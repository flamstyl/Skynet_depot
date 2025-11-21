/**
 * 🔥 PhoenixTerm MCP Tool: execute_interactive_command
 * Exécute des commandes interactives avec support PTY complet
 */

export const executeInteractiveCommand = {
  name: 'execute_interactive_command',
  description: 'Execute interactive shell commands with full PTY support, handling prompts like sudo password requests',

  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The command to execute (e.g., "sudo dnf install postgresql")',
      },
      input: {
        type: 'string',
        description: 'Text to send to stdin after execution (e.g., password for sudo prompt)',
      },
      expect_prompt: {
        type: 'string',
        description: 'Regex pattern to detect a specific prompt (e.g., "\\[sudo\\] password for .*:")',
      },
      session_id: {
        type: 'string',
        description: 'Session ID for persistent terminal (default: "default")',
        default: 'default',
      },
      timeout: {
        type: 'number',
        description: 'Maximum execution time in seconds (default: 60)',
        default: 60,
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the command',
      },
      env: {
        type: 'object',
        description: 'Environment variables for the command',
      },
      shell: {
        type: 'string',
        description: 'Shell to use (bash, zsh, fish, powershell, cmd, or auto)',
        default: 'auto',
      },
      streaming: {
        type: 'boolean',
        description: 'Enable real-time output streaming',
        default: true,
      },
      retry: {
        type: 'boolean',
        description: 'Enable automatic retry on failure',
        default: true,
      },
      validate: {
        type: 'boolean',
        description: 'Validate command security before execution',
        default: true,
      },
    },
    required: ['command'],
  },

  /**
   * Exécute la commande
   */
  async execute(params, context) {
    const {
      command,
      input,
      expect_prompt,
      session_id = 'default',
      timeout = 60000,
      cwd,
      env,
      shell = 'auto',
      streaming = true,
      retry = true,
      validate = true,
    } = params;

    const { ptyManager, sessionManager, securityManager, retryEngine, streamingHandler } = context;

    try {
      // 1. Validation de sécurité
      if (validate) {
        const securityReport = securityManager.generateSecurityReport(command);

        if (securityReport.validation.blocked) {
          return {
            success: false,
            error: 'Command blocked by security policy',
            security: securityReport,
            is_interactive_prompt_pending: false,
          };
        }

        if (securityReport.validation.severity === 'critical') {
          return {
            success: false,
            error: 'Command has critical security risks',
            security: securityReport,
            is_interactive_prompt_pending: false,
          };
        }
      }

      // 2. Récupérer ou créer la session
      let session = sessionManager.getSession(session_id);
      if (!session) {
        session = sessionManager.createSession({
          sessionId: session_id,
          shell,
          cwd,
          env,
        });
      }

      // 3. Récupérer ou créer le PTY
      let ptyInfo = ptyManager.getPTY(session_id);
      if (!ptyInfo) {
        ptyInfo = ptyManager.createPTY(session_id, {
          shell,
          cwd: cwd || session.cwd,
          env,
        });
      }

      // 4. Setup streaming si activé
      let stream = null;
      if (streaming) {
        stream = streamingHandler.getStream(session_id);
        if (!stream) {
          stream = streamingHandler.createStream(session_id);
        }
      }

      // 5. Fonction d'exécution (pour retry)
      const executeCommand = async (attemptNumber) => {
        return new Promise((resolve, reject) => {
          let outputBuffer = '';
          let stderrBuffer = '';
          let promptDetected = false;
          let exitCode = null;
          const startTime = Date.now();

          // Timeout handler
          const timeoutHandle = setTimeout(() => {
            cleanup();
            resolve({
              success: false,
              error: 'Command execution timeout',
              exitCode: 124,
              stdout: outputBuffer,
              stderr: stderrBuffer,
              timeout: true,
            });
          }, timeout);

          // Data handler
          const dataHandler = (data) => {
            outputBuffer += data;

            if (streaming) {
              streamingHandler.push(session_id, data, 'stdout');
            }

            // Détecter le prompt
            if (expect_prompt) {
              try {
                const promptRegex = new RegExp(expect_prompt, 'i');
                if (promptRegex.test(data)) {
                  promptDetected = true;

                  // Si on a de l'input à envoyer, l'envoyer maintenant
                  if (input) {
                    setTimeout(() => {
                      ptyManager.write(session_id, input + '\n');
                    }, 100);
                  }
                }
              } catch (error) {
                console.error('[Execute] Invalid prompt regex:', error);
              }
            }
          };

          // Exit handler
          const exitHandler = (code) => {
            exitCode = code;
            cleanup();

            const duration = Date.now() - startTime;

            resolve({
              success: code === 0,
              exitCode: code,
              stdout: outputBuffer,
              stderr: stderrBuffer,
              duration,
              is_interactive_prompt_pending: false,
              prompt_detected: promptDetected,
            });
          };

          // Cleanup function
          const cleanup = () => {
            clearTimeout(timeoutHandle);
            ptyManager.off('data', dataHandler);
            ptyManager.off('exit', exitHandler);
          };

          // Attacher les handlers
          ptyManager.on('data', dataHandler);
          ptyManager.on('exit', exitHandler);

          // Exécuter la commande
          try {
            ptyManager.write(session_id, command + '\n');
            console.error(`[Execute] Command sent: ${command}`);
          } catch (error) {
            cleanup();
            reject(error);
          }

          // Si pas d'expect_prompt et pas de timeout rapide, attendre un peu
          if (!expect_prompt) {
            setTimeout(() => {
              // Si la commande n'a pas terminé, retourner le output actuel
              if (exitCode === null) {
                cleanup();
                resolve({
                  success: true,
                  stdout: outputBuffer,
                  stderr: stderrBuffer,
                  is_interactive_prompt_pending: promptDetected,
                  prompt_message: promptDetected ? outputBuffer.split('\n').pop() : null,
                  running: true,
                });
              }
            }, 2000);
          }
        });
      };

      // 6. Exécuter avec retry si activé
      let result;
      if (retry && retryEngine.enabled) {
        result = await retryEngine.executeWithRetry(executeCommand, { command });

        if (!result.success && result.error) {
          return {
            success: false,
            error: result.error.message || 'Command failed after retries',
            exitCode: result.exitCode,
            attempts: result.attempts,
            is_interactive_prompt_pending: false,
          };
        }

        result = result.result || result;
      } else {
        result = await executeCommand(0);
      }

      // 7. Enregistrer dans l'historique de session
      sessionManager.addCommand(
        session_id,
        command,
        result.exitCode,
        result.stdout?.substring(0, 1000)
      );

      // 8. Détecter les patterns dans le stream
      let patterns = [];
      if (streaming) {
        patterns = streamingHandler.detectPatterns(session_id);
      }

      // 9. Retourner le résultat
      return {
        success: result.success !== false,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exit_code: result.exitCode,
        is_interactive_prompt_pending: result.is_interactive_prompt_pending || false,
        prompt_message: result.prompt_message || null,
        session_id,
        duration: result.duration,
        patterns,
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error('[Execute] Error:', error);
      return {
        success: false,
        error: error.message,
        is_interactive_prompt_pending: false,
        session_id,
      };
    }
  },
};

export default executeInteractiveCommand;
