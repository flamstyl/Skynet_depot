/**
 * Utilitaire pour l'exécution sécurisée de commandes shell
 */

import { exec, ExecOptions } from 'child_process';
import { promisify } from 'util';
import { log } from '../core/logger.js';
import { MCPErrorHandler } from '../core/error_handler.js';

const execAsync = promisify(exec);

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class ExecUtil {
  /**
   * Exécute une commande shell de manière sécurisée
   */
  static async run(
    command: string,
    options: ExecOptions = {},
    timeoutMs: number = 30000
  ): Promise<ExecResult> {
    log.debug(`Executing command: ${command}`);

    const execOptions: ExecOptions = {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      ...options
    };

    try {
      const { stdout, stderr } = await execAsync(command, execOptions);

      return {
        stdout: stdout.toString().trim(),
        stderr: stderr.toString().trim(),
        exitCode: 0
      };
    } catch (error: any) {
      log.error(`Command failed: ${command}`, {
        error: error.message,
        code: error.code
      });

      if (error.killed) {
        throw MCPErrorHandler.createError(
          MCPErrorHandler.CODES.TIMEOUT,
          `Commande timeout après ${timeoutMs}ms`,
          { command }
        );
      }

      throw MCPErrorHandler.createError(
        MCPErrorHandler.CODES.COMMAND_FAILED,
        `Commande échouée: ${error.message}`,
        {
          command,
          stdout: error.stdout?.toString(),
          stderr: error.stderr?.toString(),
          exitCode: error.code
        }
      );
    }
  }

  /**
   * Vérifie si une commande existe
   */
  static async commandExists(command: string): Promise<boolean> {
    try {
      await this.run(`which ${command}`, {}, 5000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Exécute une série de commandes séquentiellement
   */
  static async runSequence(
    commands: string[],
    options: ExecOptions = {}
  ): Promise<ExecResult[]> {
    const results: ExecResult[] = [];

    for (const command of commands) {
      const result = await this.run(command, options);
      results.push(result);
    }

    return results;
  }
}
