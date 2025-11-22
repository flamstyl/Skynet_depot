import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { NotFoundError, ExecutionError } from '../../lib/errors.js';
import { ListDirectorySchema } from '../../schemas/project.js';

export async function listDirectory(input: unknown) {
  const params = validate(ListDirectorySchema, input);

  logger.info('Listing directory', params);

  if (!existsSync(params.path)) {
    throw new NotFoundError(`Directory does not exist: ${params.path}`);
  }

  try {
    const items: any[] = [];

    async function scanDir(dirPath: string, recursive: boolean) {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        // Ignorer les fichiers cachés si nécessaire
        if (!params.includeHidden && entry.name.startsWith('.')) {
          continue;
        }

        // Filtrer par pattern si fourni
        if (params.pattern) {
          const regex = new RegExp(params.pattern.replace(/\*/g, '.*'));
          if (!regex.test(entry.name)) {
            continue;
          }
        }

        const stats = await stat(fullPath);

        const item = {
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'directory' : entry.isSymbolicLink() ? 'symlink' : 'file',
          size: entry.isFile() ? stats.size : undefined,
          modified: stats.mtime.toISOString(),
          permissions: stats.mode.toString(8).slice(-3),
        };

        items.push(item);

        if (recursive && entry.isDirectory()) {
          await scanDir(fullPath, true);
        }
      }
    }

    await scanDir(params.path, params.recursive || false);

    logger.info('Directory listed', { path: params.path, total: items.length });

    return {
      path: params.path,
      items,
      total: items.length,
    };
  } catch (error: any) {
    logger.error('Failed to list directory', { error: error.message });
    throw new ExecutionError(`Failed to list directory: ${error.message}`);
  }
}
