/**
 * Module graphics_tools - Manipulation d'images
 */

import { createTool, ToolRegistry } from '../../core/registry.js';
import { MCPErrorHandler } from '../../core/error_handler.js';
import { Validator } from '../../core/validator.js';
import sharp from 'sharp';

export async function resizeImage(input: any) {
  const validated = Validator.validate(input,  Validator.schemas.resizeImage);

  let image = sharp(validated.input_path);

  if (validated.width || validated.height) {
    image = image.resize(validated.width, validated.height, {
      fit: validated.maintain_aspect ? 'inside' : 'fill'
    });
  }

  if (validated.quality) {
    image = image.jpeg({ quality: validated.quality });
  }

  await image.toFile(validated.output_path);

  const metadata = await sharp(validated.output_path).metadata();

  return {
    input_path: validated.input_path,
    output_path: validated.output_path,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size,
    message: 'Image redimensionnée avec succès'
  };
}

export async function convertFormat(input: any) {
  const validated = Validator.validate(input,  Validator.schemas.convertFormat);

  let image = sharp(validated.input_path);

  switch (validated.format) {
    case 'jpg':
    case 'jpeg':
      image = image.jpeg({ quality: validated.quality });
      break;
    case 'png':
      image = image.png({ quality: validated.quality });
      break;
    case 'webp':
      image = image.webp({ quality: validated.quality });
      break;
    case 'gif':
      image = image.gif();
      break;
    case 'bmp':
      image = image.toFormat('bmp');
      break;
  }

  await image.toFile(validated.output_path);

  const metadata = await sharp(validated.output_path).metadata();

  return {
    input_path: validated.input_path,
    output_path: validated.output_path,
    format: metadata.format,
    size: metadata.size,
    message: `Image convertie en ${validated.format}`
  };
}

export async function generateThumbnail(input: any) {
  const validated = Validator.validate(input,  Validator.schemas.generateThumbnail);

  const options: any = {
    fit: validated.crop ? 'cover' : 'inside'
  };

  await sharp(validated.input_path)
    .resize(validated.max_size, validated.max_size, options)
    .toFile(validated.output_path);

  const metadata = await sharp(validated.output_path).metadata();

  return {
    input_path: validated.input_path,
    output_path: validated.output_path,
    width: metadata.width,
    height: metadata.height,
    size: metadata.size,
    message: 'Miniature générée avec succès'
  };
}

export function registerGraphicsToolsTools(): void {
  ToolRegistry.register(createTool('graphics_resize_image', 'Redimensionne une image', {
    input_path: { type: 'string' },
    output_path: { type: 'string' },
    width: { type: 'number' },
    height: { type: 'number' },
    maintain_aspect: { type: 'boolean', default: true },
    quality: { type: 'number', minimum: 1, maximum: 100, default: 80 }
  }, ['input_path', 'output_path']));

  ToolRegistry.register(createTool('graphics_convert_format', 'Convertit une image vers un autre format', {
    input_path: { type: 'string' },
    output_path: { type: 'string' },
    format: { type: 'string', enum: ['jpg', 'png', 'webp', 'gif', 'bmp'] },
    quality: { type: 'number', minimum: 1, maximum: 100, default: 80 }
  }, ['input_path', 'output_path', 'format']));

  ToolRegistry.register(createTool('graphics_generate_thumbnail', 'Génère une miniature', {
    input_path: { type: 'string' },
    output_path: { type: 'string' },
    max_size: { type: 'number', default: 200 },
    crop: { type: 'boolean', default: false }
  }, ['input_path', 'output_path']));
}

export const graphicsToolsHandlers = {
  graphics_resize_image: async (input: any) => MCPErrorHandler.executeTool('graphics_resize_image', () => resizeImage(input)),
  graphics_convert_format: async (input: any) => MCPErrorHandler.executeTool('graphics_convert_format', () => convertFormat(input)),
  graphics_generate_thumbnail: async (input: any) => MCPErrorHandler.executeTool('graphics_generate_thumbnail', () => generateThumbnail(input))
};
