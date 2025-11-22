import sharp from 'sharp';
import * as path from 'path';
import {
  ResizeImageInput,
  ConvertImageInput,
  CompressImageInput,
  ImageInfoInput,
  ComposeImagesInput,
} from '../types/schemas.js';
import { validatePath, fileExists } from '../utils/security.js';
import { MCPError, NotFoundError } from '../utils/errors.js';

/**
 * Redimensionne une image
 */
export async function resizeImage(input: ResizeImageInput) {
  const inputPath = await validatePath(input.inputPath);

  if (!(await fileExists(inputPath))) {
    throw new NotFoundError(`Image ${inputPath} introuvable`);
  }

  if (!input.width && !input.height) {
    throw new MCPError('Au moins width ou height doit être spécifié');
  }

  const outputPath = input.outputPath
    ? await validatePath(input.outputPath)
    : generateOutputPath(inputPath, 'resized');

  try {
    const metadata = await sharp(inputPath)
      .resize({
        width: input.width,
        height: input.height,
        fit: input.fit,
      })
      .toFile(outputPath);

    return {
      success: true,
      inputPath,
      outputPath,
      originalSize: { width: metadata.width, height: metadata.height },
      newSize: { width: metadata.width, height: metadata.height },
      format: metadata.format,
      size: metadata.size,
      message: `Image redimensionnée : ${outputPath}`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors du redimensionnement : ${error}`);
  }
}

/**
 * Convertit le format d'une image
 */
export async function convertImage(input: ConvertImageInput) {
  const inputPath = await validatePath(input.inputPath);

  if (!(await fileExists(inputPath))) {
    throw new NotFoundError(`Image ${inputPath} introuvable`);
  }

  const outputPath = await validatePath(input.outputPath);

  try {
    let sharpInstance = sharp(inputPath);

    // Appliquer le format
    switch (input.format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: input.quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality: input.quality });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: input.quality });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({ quality: input.quality });
        break;
      case 'tiff':
        sharpInstance = sharpInstance.tiff({ quality: input.quality });
        break;
    }

    const metadata = await sharpInstance.toFile(outputPath);

    return {
      success: true,
      inputPath,
      outputPath,
      format: input.format,
      quality: input.quality,
      size: metadata.size,
      sizeFormatted: formatBytes(metadata.size),
      message: `Image convertie en ${input.format} : ${outputPath}`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la conversion : ${error}`);
  }
}

/**
 * Compresse une image
 */
export async function compressImage(input: CompressImageInput) {
  const inputPath = await validatePath(input.inputPath);

  if (!(await fileExists(inputPath))) {
    throw new NotFoundError(`Image ${inputPath} introuvable`);
  }

  const outputPath = input.outputPath
    ? await validatePath(input.outputPath)
    : generateOutputPath(inputPath, 'compressed');

  try {
    const image = sharp(inputPath);
    const originalMetadata = await image.metadata();

    // Compresser selon le format
    let compressed;
    if (originalMetadata.format === 'jpeg') {
      compressed = await image.jpeg({ quality: input.quality }).toFile(outputPath);
    } else if (originalMetadata.format === 'png') {
      compressed = await image.png({ quality: input.quality }).toFile(outputPath);
    } else if (originalMetadata.format === 'webp') {
      compressed = await image.webp({ quality: input.quality }).toFile(outputPath);
    } else {
      // Par défaut, convertir en jpeg
      compressed = await image.jpeg({ quality: input.quality }).toFile(outputPath);
    }

    const originalSize = (await sharp(inputPath).metadata()).size || 0;
    const newSize = compressed.size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(2);

    return {
      success: true,
      inputPath,
      outputPath,
      originalSize: formatBytes(originalSize),
      compressedSize: formatBytes(newSize),
      savings: `${savings}%`,
      quality: input.quality,
      message: `Image compressée : ${outputPath} (économie de ${savings}%)`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la compression : ${error}`);
  }
}

/**
 * Récupère les informations d'une image
 */
export async function getImageInfo(input: ImageInfoInput) {
  const imagePath = await validatePath(input.imagePath);

  if (!(await fileExists(imagePath))) {
    throw new NotFoundError(`Image ${imagePath} introuvable`);
  }

  try {
    const metadata = await sharp(imagePath).metadata();

    return {
      path: imagePath,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      size: metadata.size,
      sizeFormatted: metadata.size ? formatBytes(metadata.size) : 'N/A',
      exif: metadata.exif,
      icc: metadata.icc,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la lecture des métadonnées : ${error}`);
  }
}

/**
 * Crée une miniature
 */
export async function createThumbnail(input: ResizeImageInput) {
  // Utiliser resizeImage avec des dimensions fixes
  return resizeImage({
    ...input,
    width: input.width || 200,
    height: input.height || 200,
    fit: 'cover',
    outputPath: input.outputPath || generateOutputPath(input.inputPath, 'thumb'),
  });
}

/**
 * Compose deux images (watermark, overlay)
 */
export async function composeImages(input: ComposeImagesInput) {
  const basePath = await validatePath(input.basePath);
  const overlayPath = await validatePath(input.overlayPath);

  if (!(await fileExists(basePath))) {
    throw new NotFoundError(`Image de base ${basePath} introuvable`);
  }

  if (!(await fileExists(overlayPath))) {
    throw new NotFoundError(`Image overlay ${overlayPath} introuvable`);
  }

  const outputPath = await validatePath(input.outputPath);

  try {
    const baseMetadata = await sharp(basePath).metadata();
    const overlayBuffer = await sharp(overlayPath)
      .toBuffer();

    // Calculer la position
    let gravity: string;
    switch (input.position) {
      case 'top-left':
        gravity = 'northwest';
        break;
      case 'top-right':
        gravity = 'northeast';
        break;
      case 'bottom-left':
        gravity = 'southwest';
        break;
      case 'bottom-right':
        gravity = 'southeast';
        break;
      default:
        gravity = 'center';
    }

    const result = await sharp(basePath)
      .composite([
        {
          input: overlayBuffer,
          gravity: gravity as any,
          blend: 'over',
        },
      ])
      .toFile(outputPath);

    return {
      success: true,
      basePath,
      overlayPath,
      outputPath,
      size: result.size,
      sizeFormatted: formatBytes(result.size),
      message: `Images composées : ${outputPath}`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la composition : ${error}`);
  }
}

// ============================================================================
// UTILS
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateOutputPath(inputPath: string, suffix: string): string {
  const ext = path.extname(inputPath);
  const nameWithoutExt = path.basename(inputPath, ext);
  const dir = path.dirname(inputPath);
  return path.join(dir, `${nameWithoutExt}-${suffix}${ext}`);
}
