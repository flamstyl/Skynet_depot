import { execa, ResultPromise } from 'execa';
import { logger } from '../utils/logger.js';

/**
 * Service pour exécuter des commandes shell de manière sécurisée
 */
export class ShellService {
  /**
   * Exécute une commande shell
   */
  async exec(
    command: string,
    args: string[] = [],
    options: {
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
      shell?: boolean;
    } = {}
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    logger.debug(`Exécution commande : ${command} ${args.join(' ')}`, {
      cwd: options.cwd,
    });

    try {
      const result = await execa(command, args, {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        timeout: options.timeout || 30000, // 30s par défaut
        shell: options.shell || false,
        reject: false, // Ne pas throw sur exit code !== 0
      });

      logger.debug(`Commande terminée : exitCode=${result.exitCode}`);

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      };
    } catch (error: any) {
      logger.error('Erreur lors de l\'exécution de la commande', {
        command,
        error: error.message,
      });
      throw new Error(`Erreur exec : ${error.message}`);
    }
  }

  /**
   * Exécute une commande et retourne juste stdout
   */
  async execSimple(
    command: string,
    args: string[] = [],
    cwd?: string
  ): Promise<string> {
    const result = await this.exec(command, args, { cwd });

    if (result.exitCode !== 0) {
      throw new Error(`Commande échouée : ${result.stderr}`);
    }

    return result.stdout.trim();
  }

  /**
   * Vérifie si une commande existe
   */
  async commandExists(command: string): Promise<boolean> {
    try {
      await this.exec('which', [command]);
      return true;
    } catch {
      return false;
    }
  }
}

export const shellService = new ShellService();
