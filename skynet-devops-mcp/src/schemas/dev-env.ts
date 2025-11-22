import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  path: z.string().optional(),
  type: z.enum(['python', 'node', 'generic']),
  template: z.string().optional(),
});

export const SetupPythonEnvSchema = z.object({
  projectPath: z.string().min(1),
  pythonVersion: z.string().optional().default('python3'),
  useConda: z.boolean().optional().default(false),
});

export const SetupNodeEnvSchema = z.object({
  projectPath: z.string().min(1),
  packageManager: z.enum(['npm', 'yarn', 'pnpm']),
  nodeVersion: z.string().optional(),
});

export const InstallDependenciesSchema = z.object({
  projectPath: z.string().min(1),
  type: z.enum(['python', 'node']),
  dev: z.boolean().optional().default(false),
});

export const ListEnvsSchema = z.object({
  basePath: z.string().optional(),
  type: z.enum(['python', 'node', 'all']).optional().default('all'),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type SetupPythonEnvInput = z.infer<typeof SetupPythonEnvSchema>;
export type SetupNodeEnvInput = z.infer<typeof SetupNodeEnvSchema>;
export type InstallDependenciesInput = z.infer<typeof InstallDependenciesSchema>;
export type ListEnvsInput = z.infer<typeof ListEnvsSchema>;
