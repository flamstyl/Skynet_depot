import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { lookup } from 'mime-types';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { NotFoundError, ExecutionError } from '../../lib/errors.js';
import { ReadFileSchema } from '../../schemas/project.js';
import { config } from '../../config.js';

export async function readFileContent(input: unknown) {
  const params = validate(ReadFileSchema, input);

  logger.info('Reading file', params);

  if (!existsSync(params.filePath)) {
    throw new NotFoundError(`File does not exist: ${params.filePath}`);
  }

  try {
    const stats = await stat(params.filePath);
    const maxSize = params.maxSize || config.maxFileSizeMB * 1024 * 1024;

    if (stats.size > maxSize) {
      throw new ExecutionError(
        `File too large: ${stats.size} bytes (max: ${maxSize} bytes)`
      );
    }

    const content = await readFile(params.filePath, params.encoding as BufferEncoding);
    const mimeType = lookup(params.filePath) || 'application/octet-stream';

    logger.info('File read successfully', { filePath: params.filePath, size: stats.size });

    return {
      content,
      filePath: params.filePath,
      size: stats.size,
      encoding: params.encoding,
      mimeType,
    };
  } catch (error: any) {
    logger.error('Failed to read file', { error: error.message });
    throw new ExecutionError(`Failed to read file: ${error.message}`);
  }
}
