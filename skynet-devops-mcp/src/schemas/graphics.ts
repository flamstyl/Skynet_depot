import { z } from 'zod';

export const ResizeImageSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fit: z.enum(['cover', 'contain', 'fill']).optional().default('cover'),
  quality: z.number().int().min(1).max(100).optional().default(80),
});

export const ConvertFormatSchema = z.object({
  inputPath: z.string().min(1),
  outputFormat: z.enum(['png', 'jpg', 'jpeg', 'webp', 'avif']),
  outputPath: z.string().optional(),
  quality: z.number().int().min(1).max(100).optional().default(80),
});

export const GenerateThumbnailSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().optional(),
  size: z.number().int().positive().optional().default(256),
  format: z.enum(['png', 'jpg', 'jpeg', 'webp']).optional().default('jpeg'),
});

export type ResizeImageInput = z.infer<typeof ResizeImageSchema>;
export type ConvertFormatInput = z.infer<typeof ConvertFormatSchema>;
export type GenerateThumbnailInput = z.infer<typeof GenerateThumbnailSchema>;
