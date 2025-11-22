/**
 * Exécuteur de commandes shell sécurisé
 */

import { exec as execCallback } from "child_process";
import { promisify } from "util";
import { CommandExecutionOptions, CommandResult } from "../models/types.js";
import { CommandExecutionError } from "../models/errors.js";
import { logger } from "../utils/logger.js";

const execAsync = promisify(execCallback);

export class ShellExecutor {
  private defaultTimeout = parseInt(process.env.COMMAND_TIMEOUT || "30000", 10);

  /**
   * Exécute une commande shell de manière sécurisée
   */
  async execute(
    command: string,
    options: CommandExecutionOptions = {}
  ): Promise<CommandResult> {
    const { timeout = this.defaultTimeout, cwd, env, sudo = false } = options;

    const finalCommand = sudo ? `sudo ${command}` : command;

    logger.debug(`Executing command: ${finalCommand}`, { cwd });

    try {
      const { stdout, stderr } = await execAsync(finalCommand, {
        timeout,
        cwd,
        env: { ...process.env, ...env },
        maxBuffer: 10 * 1024 * 1024, // 10 MB
      });

      logger.debug(`Command succeeded: ${finalCommand}`);

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      };
    } catch (error: any) {
      logger.error(`Command failed: ${finalCommand}`, error);

      if (error.killed) {
        throw new CommandExecutionError(
          `Command timeout after ${timeout}ms: ${command}`,
          { command, timeout }
        );
      }

      return {
        stdout: error.stdout?.trim() || "",
        stderr: error.stderr?.trim() || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  /**
   * Exécute une commande et retourne seulement stdout
   */
  async run(command: string, options?: CommandExecutionOptions): Promise<string> {
    const result = await this.execute(command, options);

    if (result.exitCode !== 0) {
      throw new CommandExecutionError(
        `Command failed with exit code ${result.exitCode}: ${command}`,
        { command, stderr: result.stderr }
      );
    }

    return result.stdout;
  }

  /**
   * Vérifie si une commande existe
   */
  async commandExists(command: string): Promise<boolean> {
    try {
      await this.run(`which ${command}`);
      return true;
    } catch {
      return false;
    }
  }
}

export const shell = new ShellExecutor();
