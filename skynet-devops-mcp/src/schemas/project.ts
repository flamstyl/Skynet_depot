import { z } from 'zod';

export const ListDirectorySchema = z.object({
  path: z.string().min(1),
  recursive: z.boolean().optional().default(false),
  includeHidden: z.boolean().optional().default(false),
  pattern: z.string().optional(),
});

export const ReadFileSchema = z.object({
  filePath: z.string().min(1),
  encoding: z.string().optional().default('utf-8'),
  maxSize: z.number().int().positive().optional(),
});

export const WriteFileSchema = z.object({
  filePath: z.string().min(1),
  content: z.string(),
  encoding: z.string().optional().default('utf-8'),
  backup: z.boolean().optional().default(false),
  createDirs: z.boolean().optional().default(true),
});

export const GitStatusSchema = z.object({
  repositoryPath: z.string().min(1),
});

export const GitCommitSchema = z.object({
  repositoryPath: z.string().min(1),
  message: z.string().min(1),
  files: z.array(z.string()).optional(),
  author: z
    .object({
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
});

export const GitPushSchema = z.object({
  repositoryPath: z.string().min(1),
  remote: z.string().optional().default('origin'),
  branch: z.string().optional(),
  force: z.boolean().optional().default(false),
});

export type ListDirectoryInput = z.infer<typeof ListDirectorySchema>;
export type ReadFileInput = z.infer<typeof ReadFileSchema>;
export type WriteFileInput = z.infer<typeof WriteFileSchema>;
export type GitStatusInput = z.infer<typeof GitStatusSchema>;
export type GitCommitInput = z.infer<typeof GitCommitSchema>;
export type GitPushInput = z.infer<typeof GitPushSchema>;
