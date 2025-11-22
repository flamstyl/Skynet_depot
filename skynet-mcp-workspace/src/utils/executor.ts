/**
 * Exécuteur de commandes shell sécurisé
 * Gère l'exécution des commandes avec validation et timeout
 */

import { execa } from 'execa';
import { createLogger } from './logger.js';
import type { CommandResult, ExecutionContext } from './types.js';

const logger = createLogger('Executor');

/**
 * Liste de commandes interdites pour éviter les actions dangereuses
 */
const FORBIDDEN_COMMANDS = [
  'rm -rf /',
  'dd if=',
  'mkfs',
  'format',
  ':(){:|:&};:',  // Fork bomb
  'chmod -R 777 /',
  'chown -R'
];

/**
 * Valide qu'une commande n'est pas dangereuse
 */
function validateCommand(command: string, args: string[]): boolean {
  const fullCommand = `${command} ${args.join(' ')}`;

  for (const forbidden of FORBIDDEN_COMMANDS) {
    if (fullCommand.includes(forbidden)) {
      logger.error(`Commande interdite détectée: ${forbidden}`);
      return false;
    }
  }

  return true;
}

/**
 * Exécute une commande shell de manière sécurisée
 */
export async function executeCommand(
  command: string,
  args: string[] = [],
  context: ExecutionContext = {}
): Promise<CommandResult> {
  const { workingDirectory, environment, timeout = 30000 } = context;

  // Validation sécurité
  if (!validateCommand(command, args)) {
    return {
      success: false,
      error: 'Commande refusée pour des raisons de sécurité',
      code: -1
    };
  }

  try {
    logger.debug(`Exécution: ${command} ${args.join(' ')}`, { cwd: workingDirectory });

    const result = await execa(command, args, {
      cwd: workingDirectory || process.cwd(),
      env: { ...process.env, ...environment },
      timeout,
      reject: false,
      stripFinalNewline: true
    });

    const success = result.exitCode === 0;

    if (!success) {
      logger.warn(`Commande échouée (code ${result.exitCode}): ${command}`, {
        stderr: result.stderr
      });
    }

    return {
      success,
      output: result.stdout || result.stderr,
      error: result.stderr,
      code: result.exitCode,
      data: result
    };
  } catch (error: any) {
    logger.error(`Erreur lors de l'exécution: ${command}`, error);

    return {
      success: false,
      error: error.message || 'Erreur inconnue',
      code: error.exitCode || -1
    };
  }
}

/**
 * Exécute plusieurs commandes en séquence
 */
export async function executeSequence(
  commands: Array<{ command: string; args: string[]; context?: ExecutionContext }>,
  stopOnError = true
): Promise<CommandResult[]> {
  const results: CommandResult[] = [];

  for (const cmd of commands) {
    const result = await executeCommand(cmd.command, cmd.args, cmd.context);
    results.push(result);

    if (stopOnError && !result.success) {
      logger.warn('Arrêt de la séquence suite à une erreur');
      break;
    }
  }

  return results;
}

/**
 * Vérifie si une commande existe dans le système
 */
export async function commandExists(command: string): Promise<boolean> {
  const result = await executeCommand('which', [command]);
  return result.success;
}

/**
 * Récupère la version d'un outil
 */
export async function getToolVersion(command: string, versionArg = '--version'): Promise<string | null> {
  const result = await executeCommand(command, [versionArg]);
  return result.success ? result.output?.trim() || null : null;
}
