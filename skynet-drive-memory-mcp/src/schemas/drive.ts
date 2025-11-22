import { z } from 'zod';

export const ListFilesSchema = z.object({
  path: z.string().optional(),
  mimeType: z.string().optional(),
  recursive: z.boolean().optional().default(false),
  maxResults: z.number().int().positive().optional().default(100),
});

export const ReadMemorySchema = z.object({
  path: z.string().min(1),
  match: z.string().optional(),
  convertFormat: z.boolean().optional().default(true),
});

export const WriteMemorySchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  mimeType: z.string().optional().default('text/plain'),
  append: z.boolean().optional().default(false),
  createPath: z.boolean().optional().default(true),
});

export const QueryRagSchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().positive().optional().default(3),
  threshold: z.number().min(0).max(1).optional().default(0.5),
  path: z.string().optional(),
  mimeType: z.string().optional(),
});

export type ListFilesInput = z.infer<typeof ListFilesSchema>;
export type ReadMemoryInput = z.infer<typeof ReadMemorySchema>;
export type WriteMemoryInput = z.infer<typeof WriteMemorySchema>;
export type QueryRagInput = z.infer<typeof QueryRagSchema>;
