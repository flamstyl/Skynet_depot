/**
 * Validation sécurisée des chemins de fichiers et repos Git
 */

import fs from 'fs/promises';
import path from 'path';
import { PathValidationError, NotAGitRepoError } from './errors.js';

/**
 * Valide qu'un chemin est sûr (pas de path traversal)
 */
export function validatePath(inputPath) {
  // Convertir en chemin absolu
  const absolutePath = path.resolve(inputPath);

  // Vérifier path traversal
  if (inputPath.includes('..') || inputPath.includes('~')) {
    throw new PathValidationError('Path traversal detected', inputPath);
  }

  // Vérifier caractères suspects
  if (/[<>:"|?*\x00-\x1f]/.test(inputPath)) {
    throw new PathValidationError('Invalid characters in path', inputPath);
  }

  return absolutePath;
}

/**
 * Valide qu'un chemin existe
 */
export async function validatePathExists(filePath) {
  const absolutePath = validatePath(filePath);

  try {
    await fs.access(absolutePath);
    return absolutePath;
  } catch {
    throw new PathValidationError('Path does not exist', absolutePath);
  }
}

/**
 * Valide qu'un chemin est un dépôt Git
 */
export async function validateGitRepo(repoPath) {
  const absolutePath = await validatePathExists(repoPath);

  // Vérifier présence du dossier .git
  const gitPath = path.join(absolutePath, '.git');

  try {
    const stat = await fs.stat(gitPath);
    if (!stat.isDirectory()) {
      throw new NotAGitRepoError(absolutePath);
    }
  } catch {
    throw new NotAGitRepoError(absolutePath);
  }

  return absolutePath;
}

/**
 * Vérifie qu'un fichier respecte les patterns d'exclusion
 */
export function shouldExcludeFile(filePath, excludePatterns = []) {
  const normalizedPath = path.normalize(filePath);

  for (const pattern of excludePatterns) {
    // Pattern simple (exact match)
    if (normalizedPath === pattern) return true;

    // Pattern avec wildcard
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(normalizedPath)) return true;
    }

    // Pattern d'extension
    if (pattern.startsWith('*.') && normalizedPath.endsWith(pattern.slice(1))) {
      return true;
    }
  }

  return false;
}

/**
 * Valide la taille d'un fichier
 */
export async function validateFileSize(filePath, maxSizeBytes = 104857600) {
  const stat = await fs.stat(filePath);

  if (stat.size > maxSizeBytes) {
    throw new PathValidationError(
      `File too large: ${(stat.size / 1024 / 1024).toFixed(2)} MB (max: ${(maxSizeBytes / 1024 / 1024).toFixed(2)} MB)`,
      filePath
    );
  }

  return stat.size;
}
