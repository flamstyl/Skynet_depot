import sharp from 'sharp';
import { existsSync } from 'fs';
import { extname, dirname, basename } from 'path';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { NotFoundError, ExecutionError } from '../../lib/errors.js';
import { GenerateThumbnailSchema } from '../../schemas/graphics.js';

export async function generateThumbnail(input: unknown) {
  const params = validate(GenerateThumbnailSchema, input);

  logger.info('Generating thumbnail', params);

  if (!existsSync(params.inputPath)) {
    throw new NotFoundError(`Input image does not exist: ${params.inputPath}`);
  }

  try {
    // Déterminer le chemin de sortie
    const outputPath =
      params.outputPath ||
      `${dirname(params.inputPath)}/${basename(params.inputPath, extname(params.inputPath))}_thumb.${params.format}`;

    // Générer la thumbnail
    const image = sharp(params.inputPath);

    let thumbnail = image.resize(params.size, params.size, {
      fit: 'cover',
      position: 'center',
    });

    // Appliquer le format
    if (params.format === 'png') {
      thumbnail = thumbnail.png();
    } else if (params.format === 'jpg' || params.format === 'jpeg') {
      thumbnail = thumbnail.jpeg({ quality: 80 });
    } else if (params.format === 'webp') {
      thumbnail = thumbnail.webp({ quality: 80 });
    }

    await thumbnail.toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();
    const fileSize = metadata.size || 0;

    logger.info('Thumbnail generated successfully', { outputPath, size: params.size });

    return {
      success: true,
      thumbnailPath: outputPath,
      size: params.size,
      fileSize,
    };
  } catch (error: any) {
    logger.error('Failed to generate thumbnail', { error: error.message });
    throw new ExecutionError(`Failed to generate thumbnail: ${error.message}`);
  }
}
