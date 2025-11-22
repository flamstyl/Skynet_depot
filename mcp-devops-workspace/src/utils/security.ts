import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Sécurité : validation et sanitization
 */

// Liste de paths sensibles à protéger
const PROTECTED_PATHS = [
  '/etc/passwd',
  '/etc/shadow',
  '/etc/sudoers',
  '/root',
  '/boot',
];

// Extensions dangereuses
const DANGEROUS_EXTENSIONS = ['.sh', '.bash', '.zsh', '.exe', '.bat', '.cmd'];

/**
 * Vérifie si un path est safe (pas de path traversal, pas de path système sensible)
 */
export async function validatePath(inputPath: string, allowedBasePath?: string): Promise<string> {
  // Résoudre le path absolu
  const resolvedPath = path.resolve(inputPath);

  // Vérifier path traversal
  if (resolvedPath.includes('..')) {
    throw new Error(`Path traversal détecté : ${inputPath}`);
  }

  // Vérifier paths protégés
  for (const protectedPath of PROTECTED_PATHS) {
    if (resolvedPath.startsWith(protectedPath)) {
      throw new Error(`Accès interdit au path système : ${resolvedPath}`);
    }
  }

  // Si un basePath est fourni, vérifier que le path est bien dans ce basePath
  if (allowedBasePath) {
    const resolvedBasePath = path.resolve(allowedBasePath);
    if (!resolvedPath.startsWith(resolvedBasePath)) {
      throw new Error(`Path en dehors du basePath autorisé : ${resolvedPath}`);
    }
  }

  return resolvedPath;
}

/**
 * Vérifie si un fichier existe
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifie si une extension de fichier est safe
 */
export function validateFileExtension(filePath: string, dangerousOnly = true): boolean {
  const ext = path.extname(filePath).toLowerCase();

  if (dangerousOnly) {
    return !DANGEROUS_EXTENSIONS.includes(ext);
  }

  return true;
}

/**
 * Sanitize un nom de fichier/dossier
 */
export function sanitizeFileName(name: string): string {
  // Supprimer caractères dangereux
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/^\.+/, '') // Pas de leading dots
    .trim();
}

/**
 * Vérifie si une commande shell est safe (basique)
 */
export function sanitizeCommand(command: string): string {
  // Supprimer caractères dangereux pour shell injection
  const dangerous = [';', '&&', '||', '|', '`', '$', '(', ')', '<', '>', '&'];

  let sanitized = command;
  for (const char of dangerous) {
    if (sanitized.includes(char)) {
      throw new Error(`Caractère dangereux détecté dans la commande : ${char}`);
    }
  }

  return sanitized;
}

/**
 * Crée un backup d'un fichier avant modification
 */
export async function createBackup(filePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup-${timestamp}`;

  try {
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  } catch (error) {
    throw new Error(`Impossible de créer le backup : ${error}`);
  }
}

/**
 * Limite la taille d'un fichier à lire
 */
export async function validateFileSize(filePath: string, maxSizeMB = 10): Promise<void> {
  const stats = await fs.stat(filePath);
  const sizeMB = stats.size / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    throw new Error(`Fichier trop volumineux : ${sizeMB.toFixed(2)}MB (max: ${maxSizeMB}MB)`);
  }
}
