import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { config } from '../config.js';
import { logger } from './logger.js';
import { ExecutionError } from './errors.js';

const execPromise = promisify(execCallback);

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ShellOptions {
  cwd?: string;
  timeout?: number;
  env?: NodeJS.ProcessEnv;
  maxBuffer?: number;
}

/**
 * Exécute une commande shell de manière sécurisée
 */
export async function executeCommand(
  command: string,
  options: ShellOptions = {}
): Promise<ShellResult> {
  const timeout = options.timeout || config.commandTimeoutMs;

  logger.debug('Executing command', { command, options });

  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: options.cwd,
      timeout,
      env: { ...process.env, ...options.env },
      maxBuffer: options.maxBuffer || 10 * 1024 * 1024, // 10MB
    });

    logger.debug('Command executed successfully', { command, stdout: stdout.substring(0, 200) });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    };
  } catch (error: any) {
    logger.error('Command execution failed', { command, error: error.message });

    throw new ExecutionError(`Command failed: ${command}`, {
      command,
      stdout: error.stdout?.trim(),
      stderr: error.stderr?.trim(),
      exitCode: error.code,
      signal: error.signal,
    });
  }
}

/**
 * Vérifie si une commande existe dans le PATH
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    await executeCommand(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Échappe les caractères spéciaux pour utilisation dans le shell
 */
export function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
