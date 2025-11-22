/**
 * 🔐 Hash Utilities
 * Calcul de hash pour fichiers (SHA256, MD5, etc.)
 */

import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

export type HashAlgorithm = 'sha256' | 'sha1' | 'md5';

/**
 * Calcule le hash d'un fichier
 */
export async function calculateFileHash(
  filePath: string,
  algorithm: HashAlgorithm = 'sha256'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash(algorithm);
    const stream = createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(`${algorithm}:${hash.digest('hex')}`));
    stream.on('error', reject);
  });
}

/**
 * Calcule le hash d'un buffer
 */
export function calculateBufferHash(
  buffer: Buffer,
  algorithm: HashAlgorithm = 'sha256'
): string {
  const hash = createHash(algorithm);
  hash.update(buffer);
  return `${algorithm}:${hash.digest('hex')}`;
}

/**
 * Obtient la taille d'un fichier
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Vérifie si un fichier existe
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
