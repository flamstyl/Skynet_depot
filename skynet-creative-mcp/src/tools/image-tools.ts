/**
 * 🎨 Image Tools
 * MCP Tools pour traitement d'images avec Sharp
 */

import { z } from 'zod';
import sharp from 'sharp';
import { readFile, writeFile } from 'fs/promises';

// Schemas
export const imageResizeSchema = z.object({
  input: z.string().describe('Chemin image source'),
  output: z.string().describe('Chemin image destination'),
  width: z.number().optional().describe('Largeur'),
  height: z.number().optional().describe('Hauteur'),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
});

export const imageConvertSchema = z.object({
  input: z.string(),
  output: z.string(),
  format: z.enum(['jpeg', 'png', 'webp', 'avif', 'gif']),
  quality: z.number().optional().describe('Qualité 1-100'),
});

export const imageRotateSchema = z.object({
  input: z.string(),
  output: z.string(),
  angle: z.number().describe('Angle en degrés'),
});

export const imageWatermarkSchema = z.object({
  input: z.string(),
  output: z.string(),
  watermarkText: z.string(),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).optional(),
});

export const imageComposeSchema = z.object({
  background: z.string().describe('Image de fond'),
  overlay: z.string().describe('Image à superposer'),
  output: z.string(),
  x: z.number().optional().describe('Position X'),
  y: z.number().optional().describe('Position Y'),
});

export const imageMetadataSchema = z.object({
  input: z.string(),
});

export const imageOptimizeSchema = z.object({
  input: z.string(),
  output: z.string(),
  quality: z.number().optional().describe('Qualité optimale (défaut: 80)'),
});

// Handlers
export async function imageResize(args: z.infer<typeof imageResizeSchema>): Promise<string> {
  try {
    await sharp(args.input)
      .resize(args.width, args.height, { fit: args.fit || 'cover' })
      .toFile(args.output);
    return JSON.stringify({ success: true, output: args.output });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function imageConvert(args: z.infer<typeof imageConvertSchema>): Promise<string> {
  try {
    const image = sharp(args.input);
    const options = args.quality ? { quality: args.quality } : {};

    switch (args.format) {
      case 'jpeg': await image.jpeg(options).toFile(args.output); break;
      case 'png': await image.png(options).toFile(args.output); break;
      case 'webp': await image.webp(options).toFile(args.output); break;
      case 'avif': await image.avif(options).toFile(args.output); break;
      case 'gif': await image.gif().toFile(args.output); break;
    }
    return JSON.stringify({ success: true, output: args.output, format: args.format });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function imageRotate(args: z.infer<typeof imageRotateSchema>): Promise<string> {
  try {
    await sharp(args.input).rotate(args.angle).toFile(args.output);
    return JSON.stringify({ success: true, output: args.output, angle: args.angle });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function imageWatermark(args: z.infer<typeof imageWatermarkSchema>): Promise<string> {
  try {
    const image = sharp(args.input);
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Créer SVG watermark
    const svgText = Buffer.from(`
      <svg width="${width}" height="${height}">
        <text x="50%" y="95%" font-size="24" fill="white" opacity="0.5"
              text-anchor="middle" font-family="Arial">${args.watermarkText}</text>
      </svg>
    `);

    await image
      .composite([{ input: svgText, top: 0, left: 0 }])
      .toFile(args.output);

    return JSON.stringify({ success: true, output: args.output });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function imageCompose(args: z.infer<typeof imageComposeSchema>): Promise<string> {
  try {
    await sharp(args.background)
      .composite([{
        input: args.overlay,
        top: args.y || 0,
        left: args.x || 0,
      }])
      .toFile(args.output);
    return JSON.stringify({ success: true, output: args.output });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function imageMetadata(args: z.infer<typeof imageMetadataSchema>): Promise<string> {
  try {
    const metadata = await sharp(args.input).metadata();
    return JSON.stringify({ success: true, metadata }, null, 2);
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function imageOptimize(args: z.infer<typeof imageOptimizeSchema>): Promise<string> {
  try {
    const quality = args.quality || 80;
    await sharp(args.input)
      .jpeg({ quality, mozjpeg: true })
      .toFile(args.output);
    return JSON.stringify({ success: true, output: args.output, quality });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
