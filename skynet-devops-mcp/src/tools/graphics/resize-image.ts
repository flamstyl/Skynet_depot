import sharp from 'sharp';
import { existsSync } from 'fs';
import { extname } from 'path';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { NotFoundError, ExecutionError } from '../../lib/errors.js';
import { ResizeImageSchema } from '../../schemas/graphics.js';

export async function resizeImage(input: unknown) {
  const params = validate(ResizeImageSchema, input);

  logger.info('Resizing image', params);

  if (!existsSync(params.inputPath)) {
    throw new NotFoundError(`Input image does not exist: ${params.inputPath}`);
  }

  try {
    const image = sharp(params.inputPath);
    const metadata = await image.metadata();

    const originalSize = {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };

    // Déterminer la sortie
    const outputPath =
      params.outputPath ||
      params.inputPath.replace(extname(params.inputPath), `_resized${extname(params.inputPath)}`);

    // Resize
    const resized = image.resize({
      width: params.width,
      height: params.height,
      fit: params.fit,
    });

    // Appliquer la qualité
    const ext = extname(outputPath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      resized.jpeg({ quality: params.quality });
    } else if (ext === '.png') {
      resized.png({ quality: params.quality });
    } else if (ext === '.webp') {
      resized.webp({ quality: params.quality });
    }

    await resized.toFile(outputPath);

    const outputMetadata = await sharp(outputPath).metadata();
    const newSize = {
      width: outputMetadata.width || 0,
      height: outputMetadata.height || 0,
    };

    const originalFileSize = metadata.size || 0;
    const newFileSize = outputMetadata.size || 0;
    const fileSizeReduction = originalFileSize > 0 ? ((originalFileSize - newFileSize) / originalFileSize) * 100 : 0;

    logger.info('Image resized successfully', { outputPath, newSize });

    return {
      success: true,
      inputPath: params.inputPath,
      outputPath,
      originalSize,
      newSize,
      fileSizeReduction: parseFloat(fileSizeReduction.toFixed(2)),
    };
  } catch (error: any) {
    logger.error('Failed to resize image', { error: error.message });
    throw new ExecutionError(`Failed to resize image: ${error.message}`);
  }
}
