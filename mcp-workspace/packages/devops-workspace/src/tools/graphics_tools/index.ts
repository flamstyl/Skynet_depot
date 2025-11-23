import { ToolDefinition } from '../../models/types.js';
import { imageService } from '../../services/image.service.js';
import { validatePath } from '../../utils/validator.js';

export const graphicsTools: ToolDefinition[] = [
  // image_info
  {
    name: 'image_info',
    description: 'Récupère les métadonnées d\'une image',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Chemin de l\'image' },
      },
      required: ['path'],
    },
    execute: async (args: any) => {
      const imagePath = validatePath(args.path, true);

      const available = await imageService.isAvailable();
      if (!available) {
        throw new Error('ImageMagick non disponible. Installez : apt install imagemagick');
      }

      const info = await imageService.getImageInfo(imagePath);

      return {
        success: true,
        data: info,
        timestamp: new Date().toISOString(),
      };
    },
  },

  // resize_image
  {
    name: 'resize_image',
    description: 'Redimensionne une image',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
        output: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
        keepAspectRatio: { type: 'boolean', default: true },
      },
      required: ['input', 'output', 'width', 'height'],
    },
    execute: async (args: any) => {
      const inputPath = validatePath(args.input, true);
      const outputPath = validatePath(args.output, true);

      const available = await imageService.isAvailable();
      if (!available) {
        throw new Error('ImageMagick non disponible');
      }

      const result = await imageService.resizeImage(
        inputPath,
        outputPath,
        args.width,
        args.height,
        args.keepAspectRatio !== false
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    },
  },

  // convert_format
  {
    name: 'convert_format',
    description: 'Convertit le format d\'une image',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
        output: { type: 'string' },
        format: { type: 'string', enum: ['png', 'jpg', 'jpeg', 'webp', 'gif'] },
      },
      required: ['input', 'output', 'format'],
    },
    execute: async (args: any) => {
      const inputPath = validatePath(args.input, true);
      const outputPath = validatePath(args.output, true);

      const available = await imageService.isAvailable();
      if (!available) {
        throw new Error('ImageMagick non disponible');
      }

      const result = await imageService.convertFormat(
        inputPath,
        outputPath,
        args.format
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    },
  },

  // generate_thumbnail
  {
    name: 'generate_thumbnail',
    description: 'Génère une miniature',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
        output: { type: 'string' },
        size: { type: 'number', default: 200 },
      },
      required: ['input', 'output'],
    },
    execute: async (args: any) => {
      const inputPath = validatePath(args.input, true);
      const outputPath = validatePath(args.output, true);

      const available = await imageService.isAvailable();
      if (!available) {
        throw new Error('ImageMagick non disponible');
      }

      const result = await imageService.generateThumbnail(
        inputPath,
        outputPath,
        args.size || 200
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    },
  },

  // optimize_image
  {
    name: 'optimize_image',
    description: 'Optimise une image (compression)',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
        output: { type: 'string' },
        quality: { type: 'number', default: 85 },
      },
      required: ['input'],
    },
    execute: async (args: any) => {
      const inputPath = validatePath(args.input, true);
      const outputPath = args.output
        ? validatePath(args.output, true)
        : inputPath.replace(/(\.[^.]+)$/, '.optimized$1');

      const available = await imageService.isAvailable();
      if (!available) {
        throw new Error('ImageMagick non disponible');
      }

      const result = await imageService.optimizeImage(
        inputPath,
        outputPath,
        args.quality || 85
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    },
  },
];
