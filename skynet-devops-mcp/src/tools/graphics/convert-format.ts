import sharp from 'sharp';
import { existsSync } from 'fs';
import { extname, dirname, basename } from 'path';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { NotFoundError, ExecutionError } from '../../lib/errors.js';
import { ConvertFormatSchema } from '../../schemas/graphics.js';

export async function convertFormat(input: unknown) {
  const params = validate(ConvertFormatSchema, input);

  logger.info('Converting image format', params);

  if (!existsSync(params.inputPath)) {
    throw new NotFoundError(`Input image does not exist: ${params.inputPath}`);
  }

  try {
    const image = sharp(params.inputPath);
    const metadata = await image.metadata();
    const inputFormat = metadata.format || 'unknown';

    // Déterminer le chemin de sortie
    const outputPath =
      params.outputPath ||
      `${dirname(params.inputPath)}/${basename(params.inputPath, extname(params.inputPath))}.${params.outputFormat}`;

    // Convertir selon le format
    let converted = image;

    if (params.outputFormat === 'png') {
      converted = image.png({ quality: params.quality });
    } else if (params.outputFormat === 'jpg' || params.outputFormat === 'jpeg') {
      converted = image.jpeg({ quality: params.quality });
    } else if (params.outputFormat === 'webp') {
      converted = image.webp({ quality: params.quality });
    } else if (params.outputFormat === 'avif') {
      converted = image.avif({ quality: params.quality });
    }

    await converted.toFile(outputPath);

    const outputMetadata = await sharp(outputPath).metadata();

    const originalSize = metadata.size || 0;
    const newSize = outputMetadata.size || 0;
    const compressionRatio = originalSize > 0 ? newSize / originalSize : 1;

    logger.info('Image converted successfully', {
      outputPath,
      inputFormat,
      outputFormat: params.outputFormat,
    });

    return {
      success: true,
      inputPath: params.inputPath,
      outputPath,
      inputFormat,
      outputFormat: params.outputFormat,
      compressionRatio: parseFloat(compressionRatio.toFixed(2)),
    };
  } catch (error: any) {
    logger.error('Failed to convert image format', { error: error.message });
    throw new ExecutionError(`Failed to convert image format: ${error.message}`);
  }
}
