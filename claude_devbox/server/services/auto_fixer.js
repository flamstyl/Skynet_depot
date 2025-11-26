/**
 * Auto Fixer Service
 * Implements the auto-correction loop
 */

import logger from './logger.js';

class AutoFixer {
    constructor(dockerRunner, mcpBridge) {
        this.dockerRunner = dockerRunner;
        this.mcpBridge = mcpBridge;
    }

    async fix(code, language, options = {}) {
        const maxRetries = options.maxRetries || 5;
        const timeout = options.timeout || 300000; // 5 minutes
        const context = options.context || '';

        const startTime = Date.now();
        const attempts = [];
        let currentCode = code;
        let attempt = 0;

        logger.info(`Starting auto-fix loop (max ${maxRetries} attempts)`);

        while (attempt < maxRetries) {
            attempt++;

            // Check timeout
            if (Date.now() - startTime > timeout) {
                logger.warn('Auto-fix timeout exceeded');
                return {
                    success: false,
                    finalCode: currentCode,
                    attempts: attempt,
                    history: attempts,
                    error: 'Timeout exceeded'
                };
            }

            logger.info(`Auto-fix attempt ${attempt}/${maxRetries}`);

            try {
                // Execute code
                const result = await this.dockerRunner.execute(currentCode, language, {
                    timeout: 30000
                });

                // Log attempt
                attempts.push({
                    attempt,
                    code: currentCode,
                    exitCode: result.exitCode,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    timestamp: new Date().toISOString()
                });

                // Check if successful
                // Ignore Rust warning in stderr (rustc: command not found)
                const cleanStderr = (result.stderr || '').replace(/rustc: command not found/g, '').trim();
                
                if (result.exitCode === 0 && cleanStderr === '') {
                    logger.info(`✓ Auto-fix successful on attempt ${attempt}`);

                    return {
                        success: true,
                        finalCode: currentCode,
                        attempts: attempt,
                        history: attempts,
                        duration: Date.now() - startTime,
                        stdout: result.stdout,
                        stderr: result.stderr
                    };
                }

                // Code has errors, send to Claude for fix
                logger.info(`Errors detected, requesting fix from Claude...`);

                const fixPrompt = this.buildFixPrompt(
                    currentCode,
                    language,
                    result.stderr || result.stdout,
                    attempt,
                    context
                );

                const claudeResponse = await this.mcpBridge.sendToClaude(fixPrompt, {
                    context: {
                        language,
                        error: result.stderr,
                        previousAttempts: attempt
                    }
                });

                // Extract fixed code
                const fixedCode = this.mcpBridge.extractCodeFromResponse(claudeResponse);

                if (!fixedCode || fixedCode === currentCode) {
                    logger.warn('Claude returned no fix or same code');
                    continue;
                }

                logger.info('Received fix from Claude, retrying...');

                // Update current code with fix
                currentCode = fixedCode;

                // Log the fix
                attempts[attempts.length - 1].fix = fixedCode;
                attempts[attempts.length - 1].fixExplanation = claudeResponse.content;

            } catch (error) {
                logger.error(`Error in attempt ${attempt}:`, error);

                attempts.push({
                    attempt,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });

                // Continue to next attempt
                continue;
            }
        }

        // Max retries exceeded
        logger.warn(`Auto-fix failed after ${maxRetries} attempts`);

        return {
            success: false,
            finalCode: currentCode,
            attempts: maxRetries,
            history: attempts,
            error: 'Max retries exceeded',
            duration: Date.now() - startTime
        };
    }

    buildFixPrompt(code, language, error, attempt, context) {
        return `You are helping to debug and fix code in a DevBox environment.

**Context:** ${context || 'User requested auto-fix'}

**Language:** ${language}

**Attempt:** ${attempt}

**Current Code:**
\`\`\`${language}
${code}
\`\`\`

**Error Output:**
\`\`\`
${error}
\`\`\`

Please analyze the error and provide a fixed version of the code. Return ONLY the corrected code in a code block, without additional explanation. The code should:
1. Fix all errors shown in the error output
2. Handle edge cases that might cause failures
3. Include proper error handling
4. Be production-ready and robust

Fixed code:`;
    }

    async quickFix(code, language, errorMessage) {
        // Single-attempt fix for simple errors
        logger.info('Attempting quick fix...');

        const fixPrompt = `Fix this ${language} code that has the following error:

Error: ${errorMessage}

Code:
\`\`\`${language}
${code}
\`\`\`

Return only the fixed code in a code block.`;

        try {
            const claudeResponse = await this.mcpBridge.sendToClaude(fixPrompt, {
                context: { language, error: errorMessage, previousAttempts: 0 }
            });

            const fixedCode = this.mcpBridge.extractCodeFromResponse(claudeResponse);

            // Verify the fix
            const result = await this.dockerRunner.execute(fixedCode, language, {
                timeout: 15000
            });

            return {
                success: result.exitCode === 0,
                fixedCode,
                stdout: result.stdout,
                stderr: result.stderr,
                explanation: claudeResponse.content
            };

        } catch (error) {
            logger.error('Quick fix failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async analyzeCode(code, language) {
        // Analyze code for potential issues without executing
        logger.info('Analyzing code...');

        const prompt = `Analyze this ${language} code for potential issues, bugs, or improvements:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Potential bugs or errors
2. Security concerns
3. Performance issues
4. Best practice violations
5. Suggested improvements`;

        try {
            const response = await this.mcpBridge.sendToClaude(prompt, {
                context: { language }
            });

            return {
                analysis: response.content,
                confidence: response.confidence || 0.8
            };

        } catch (error) {
            logger.error('Code analysis failed:', error);
            return {
                analysis: null,
                error: error.message
            };
        }
    }
}

export default AutoFixer;
