/**
 * Module graphics_tools : Graphisme et manipulation d'images
 * Tools pour redimensionner, convertir, composer des images via Sharp
 */

import { z } from 'zod';
import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { createLogger } from '../utils/logger.js';
import type { ToolResult } from '../utils/types.js';

const logger = createLogger('graphics_tools');

/**
 * Schémas Zod pour validation
 */
export const ResizeImageSchema = z.object({
  inputPath: z.string().describe('Chemin de l\'image source'),
  outputPath: z.string().describe('Chemin de l\'image de sortie'),
  width: z.number().optional().describe('Largeur cible (px)'),
  height: z.number().optional().describe('Hauteur cible (px)'),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover').describe('Mode de redimensionnement')
});

export const ConvertFormatSchema = z.object({
  inputPath: z.string().describe('Chemin de l\'image source'),
  outputPath: z.string().describe('Chemin de l\'image de sortie'),
  format: z.enum(['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff']).describe('Format de sortie'),
  quality: z.number().min(1).max(100).default(90).describe('Qualité (1-100)')
});

export const GenerateThumbnailSchema = z.object({
  inputPath: z.string().describe('Chemin de l\'image source'),
  outputPath: z.string().describe('Chemin de la thumbnail'),
  size: z.number().default(200).describe('Taille de la thumbnail (px)'),
  format: z.enum(['jpeg', 'png', 'webp']).default('jpeg').describe('Format de sortie')
});

export const ComposeImagesSchema = z.object({
  backgroundPath: z.string().describe('Image de fond'),
  overlayPath: z.string().describe('Image à superposer'),
  outputPath: z.string().describe('Image résultante'),
  x: z.number().default(0).describe('Position X de l\'overlay'),
  y: z.number().default(0).describe('Position Y de l\'overlay')
});

export const ImageInfoSchema = z.object({
  imagePath: z.string().describe('Chemin de l\'image')
});

export const ApplyFilterSchema = z.object({
  inputPath: z.string().describe('Chemin de l\'image source'),
  outputPath: z.string().describe('Chemin de l\'image de sortie'),
  filter: z.enum(['grayscale', 'blur', 'sharpen', 'negative', 'sepia']).describe('Filtre à appliquer'),
  intensity: z.number().min(1).max(100).default(50).describe('Intensité du filtre')
});

/**
 * Tool: resize_image
 * Redimensionne une image
 */
export async function resizeImage(args: z.infer<typeof ResizeImageSchema>): Promise<ToolResult> {
  try {
    const { inputPath, outputPath, width, height, fit } = args;

    logger.info(`Resize image: ${inputPath} -> ${outputPath}`);

    if (!await fs.pathExists(inputPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Image source non trouvée: ${inputPath}`
        }],
        isError: true
      };
    }

    await fs.ensureDir(path.dirname(outputPath));

    await sharp(inputPath)
      .resize(width, height, { fit })
      .toFile(outputPath);

    const info = await sharp(outputPath).metadata();

    logger.success(`Image redimensionnée: ${outputPath}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Image redimensionnée avec succès!\n\n` +
              `📁 Sortie: ${outputPath}\n` +
              `📐 Dimensions: ${info.width}x${info.height}\n` +
              `💾 Taille: ${(await fs.stat(outputPath)).size / 1024} KB`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors du redimensionnement', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: convert_format
 * Convertit une image vers un autre format
 */
export async function convertFormat(args: z.infer<typeof ConvertFormatSchema>): Promise<ToolResult> {
  try {
    const { inputPath, outputPath, format, quality } = args;

    logger.info(`Convert format: ${inputPath} -> ${format}`);

    if (!await fs.pathExists(inputPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Image source non trouvée: ${inputPath}`
        }],
        isError: true
      };
    }

    await fs.ensureDir(path.dirname(outputPath));

    const image = sharp(inputPath);

    switch (format) {
      case 'jpeg':
        await image.jpeg({ quality }).toFile(outputPath);
        break;
      case 'png':
        await image.png({ quality }).toFile(outputPath);
        break;
      case 'webp':
        await image.webp({ quality }).toFile(outputPath);
        break;
      case 'avif':
        await image.avif({ quality }).toFile(outputPath);
        break;
      case 'gif':
        await image.gif().toFile(outputPath);
        break;
      case 'tiff':
        await image.tiff({ quality }).toFile(outputPath);
        break;
    }

    const inputSize = (await fs.stat(inputPath)).size;
    const outputSize = (await fs.stat(outputPath)).size;
    const compression = ((1 - outputSize / inputSize) * 100).toFixed(2);

    logger.success(`Image convertie: ${outputPath}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Image convertie avec succès!\n\n` +
              `📁 Sortie: ${outputPath}\n` +
              `🎨 Format: ${format}\n` +
              `📊 Qualité: ${quality}%\n` +
              `💾 Taille: ${outputSize / 1024} KB (compression: ${compression}%)`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la conversion', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: generate_thumbnail
 * Génère une miniature d'une image
 */
export async function generateThumbnail(args: z.infer<typeof GenerateThumbnailSchema>): Promise<ToolResult> {
  try {
    const { inputPath, outputPath, size, format } = args;

    logger.info(`Generate thumbnail: ${inputPath} (${size}px)`);

    if (!await fs.pathExists(inputPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Image source non trouvée: ${inputPath}`
        }],
        isError: true
      };
    }

    await fs.ensureDir(path.dirname(outputPath));

    const image = sharp(inputPath)
      .resize(size, size, { fit: 'cover' });

    switch (format) {
      case 'jpeg':
        await image.jpeg({ quality: 80 }).toFile(outputPath);
        break;
      case 'png':
        await image.png({ quality: 80 }).toFile(outputPath);
        break;
      case 'webp':
        await image.webp({ quality: 80 }).toFile(outputPath);
        break;
    }

    logger.success(`Thumbnail générée: ${outputPath}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Thumbnail générée!\n\n` +
              `📁 Sortie: ${outputPath}\n` +
              `📐 Taille: ${size}x${size}px\n` +
              `🎨 Format: ${format}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la génération de thumbnail', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: compose_images
 * Superpose deux images
 */
export async function composeImages(args: z.infer<typeof ComposeImagesSchema>): Promise<ToolResult> {
  try {
    const { backgroundPath, overlayPath, outputPath, x, y } = args;

    logger.info(`Compose images: ${backgroundPath} + ${overlayPath}`);

    if (!await fs.pathExists(backgroundPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Image de fond non trouvée: ${backgroundPath}`
        }],
        isError: true
      };
    }

    if (!await fs.pathExists(overlayPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Image overlay non trouvée: ${overlayPath}`
        }],
        isError: true
      };
    }

    await fs.ensureDir(path.dirname(outputPath));

    await sharp(backgroundPath)
      .composite([{
        input: overlayPath,
        top: y,
        left: x
      }])
      .toFile(outputPath);

    logger.success(`Images composées: ${outputPath}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Images composées avec succès!\n\n` +
              `📁 Sortie: ${outputPath}\n` +
              `📐 Position overlay: (${x}, ${y})`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la composition', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: image_info
 * Récupère les métadonnées d'une image
 */
export async function imageInfo(args: z.infer<typeof ImageInfoSchema>): Promise<ToolResult> {
  try {
    const { imagePath } = args;

    logger.info(`Image info: ${imagePath}`);

    if (!await fs.pathExists(imagePath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Image non trouvée: ${imagePath}`
        }],
        isError: true
      };
    }

    const metadata = await sharp(imagePath).metadata();
    const stats = await fs.stat(imagePath);

    let output = `🖼️  Informations sur l'image: ${path.basename(imagePath)}\n\n`;
    output += `📐 Dimensions: ${metadata.width}x${metadata.height}px\n`;
    output += `🎨 Format: ${metadata.format}\n`;
    output += `🌈 Espace couleur: ${metadata.space}\n`;
    output += `📊 Canaux: ${metadata.channels}\n`;
    output += `📏 Profondeur: ${metadata.depth} bits\n`;
    output += `💾 Taille fichier: ${(stats.size / 1024).toFixed(2)} KB\n`;

    if (metadata.density) {
      output += `🔍 Densité: ${metadata.density} DPI\n`;
    }

    if (metadata.hasAlpha) {
      output += `✨ Canal alpha: Oui\n`;
    }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des infos', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: apply_filter
 * Applique un filtre à une image
 */
export async function applyFilter(args: z.infer<typeof ApplyFilterSchema>): Promise<ToolResult> {
  try {
    const { inputPath, outputPath, filter, intensity } = args;

    logger.info(`Apply filter: ${filter} sur ${inputPath}`);

    if (!await fs.pathExists(inputPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Image source non trouvée: ${inputPath}`
        }],
        isError: true
      };
    }

    await fs.ensureDir(path.dirname(outputPath));

    let image = sharp(inputPath);

    switch (filter) {
      case 'grayscale':
        image = image.grayscale();
        break;

      case 'blur':
        const sigma = (intensity / 100) * 10; // 0-10
        image = image.blur(sigma);
        break;

      case 'sharpen':
        const sharpness = (intensity / 100) * 3; // 0-3
        image = image.sharpen(sharpness);
        break;

      case 'negative':
        image = image.negate();
        break;

      case 'sepia':
        // Simulation sépia via tint
        image = image.tint({ r: 112, g: 66, b: 20 });
        break;
    }

    await image.toFile(outputPath);

    logger.success(`Filtre appliqué: ${outputPath}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Filtre "${filter}" appliqué avec succès!\n\n` +
              `📁 Sortie: ${outputPath}\n` +
              `🎨 Filtre: ${filter}\n` +
              `📊 Intensité: ${intensity}%`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de l\'application du filtre', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Export des tools pour le serveur MCP
 */
export const graphicsTools = {
  resize_image: {
    description: 'Redimensionne une image avec différents modes de fit',
    inputSchema: ResizeImageSchema,
    handler: resizeImage
  },
  convert_format: {
    description: 'Convertit une image vers un autre format (jpeg, png, webp, avif, gif, tiff)',
    inputSchema: ConvertFormatSchema,
    handler: convertFormat
  },
  generate_thumbnail: {
    description: 'Génère une miniature carrée d\'une image',
    inputSchema: GenerateThumbnailSchema,
    handler: generateThumbnail
  },
  compose_images: {
    description: 'Superpose deux images (background + overlay)',
    inputSchema: ComposeImagesSchema,
    handler: composeImages
  },
  image_info: {
    description: 'Récupère les métadonnées d\'une image (dimensions, format, taille, etc.)',
    inputSchema: ImageInfoSchema,
    handler: imageInfo
  },
  apply_filter: {
    description: 'Applique un filtre à une image (grayscale, blur, sharpen, negative, sepia)',
    inputSchema: ApplyFilterSchema,
    handler: applyFilter
  }
};
