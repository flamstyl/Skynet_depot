import path from 'path';
import { config } from '../config/default.js';

/**
 * Valide qu'un path est sûr (pas de traversal, dans le workspace)
 */
export function validatePath(inputPath: string, allowAbsolute = false): string {
  // Résout le path
  const resolved = path.resolve(inputPath);

  // Empêche traversal directory
  if (resolved.includes('..')) {
    throw new Error('Path traversal détecté et bloqué');
  }

  // Vérifie que c'est dans le workspace (sauf si allowAbsolute)
  if (!allowAbsolute && !resolved.startsWith(config.workspaceRoot)) {
    throw new Error(`Path hors du workspace : ${resolved}`);
  }

  // Empêche certains paths système critiques
  const forbiddenPaths = ['/etc', '/var', '/usr', '/bin', '/sbin', '/boot', '/sys', '/proc'];
  for (const forbidden of forbiddenPaths) {
    if (resolved.startsWith(forbidden) && !allowAbsolute) {
      throw new Error(`Access interdit au path système : ${forbidden}`);
    }
  }

  return resolved;
}

/**
 * Valide un nom de container/service (empêche injection)
 */
export function validateName(name: string): string {
  const regex = /^[a-zA-Z0-9_.-]+$/;
  if (!regex.test(name)) {
    throw new Error(`Nom invalide (caractères autorisés : a-zA-Z0-9_.-) : ${name}`);
  }
  return name;
}

/**
 * Valide une commande shell (whitelist basique)
 */
export function validateCommand(cmd: string, allowedCommands: string[]): void {
  const baseCmd = cmd.split(' ')[0];
  if (!allowedCommands.includes(baseCmd)) {
    throw new Error(`Commande non autorisée : ${baseCmd}`);
  }

  // Détecte injection basique
  const dangerousChars = ['|', '&', ';', '$', '`', '(', ')'];
  for (const char of dangerousChars) {
    if (cmd.includes(char)) {
      throw new Error(`Caractère dangereux détecté dans commande : ${char}`);
    }
  }
}

/**
 * Demande confirmation pour opération dangereuse
 */
export function requireConfirmation(operation: string, confirmed?: boolean): void {
  if (config.requireConfirmation && !confirmed) {
    throw new Error(
      `Confirmation requise pour : ${operation}. Passe confirm: true dans les paramètres.`
    );
  }
}
