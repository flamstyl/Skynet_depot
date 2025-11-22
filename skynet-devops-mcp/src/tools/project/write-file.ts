import { writeFile, copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { ExecutionError } from '../../lib/errors.js';
import { WriteFileSchema } from '../../schemas/project.js';

export async function writeFileContent(input: unknown) {
  const params = validate(WriteFileSchema, input);

  logger.info('Writing file', params);

  try {
    let backupPath: string | undefined;

    // Créer les dossiers parents si nécessaire
    if (params.createDirs) {
      const dir = dirname(params.filePath);
      await mkdir(dir, { recursive: true });
    }

    // Backup si demandé et le fichier existe
    if (params.backup && existsSync(params.filePath)) {
      backupPath = `${params.filePath}.backup.${Date.now()}`;
      await copyFile(params.filePath, backupPath);
      logger.info('Backup created', { backupPath });
    }

    // Écrire le fichier
    await writeFile(params.filePath, params.content, params.encoding as BufferEncoding);

    const bytesWritten = Buffer.byteLength(params.content, params.encoding as BufferEncoding);

    logger.info('File written successfully', { filePath: params.filePath, bytesWritten });

    return {
      success: true,
      filePath: params.filePath,
      backupPath,
      bytesWritten,
    };
  } catch (error: any) {
    logger.error('Failed to write file', { error: error.message });
    throw new ExecutionError(`Failed to write file: ${error.message}`);
  }
}
