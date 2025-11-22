import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDATION POUR LES TOOLS MCP
// ============================================================================

// --- DEV ENV ---
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  path: z.string().optional(),
  language: z.enum(['python', 'node', 'go', 'rust', 'generic']),
  initGit: z.boolean().default(true),
  createReadme: z.boolean().default(true),
});

export const SetupPythonEnvSchema = z.object({
  projectPath: z.string(),
  pythonVersion: z.string().optional(),
  requirements: z.string().optional(), // path to requirements.txt
  venvName: z.string().default('.venv'),
});

export const SetupNodeEnvSchema = z.object({
  projectPath: z.string(),
  packageManager: z.enum(['npm', 'yarn', 'pnpm']).default('npm'),
  initPackageJson: z.boolean().default(true),
});

export const InstallDependenciesSchema = z.object({
  projectPath: z.string(),
  language: z.enum(['python', 'node']),
  dependenciesFile: z.string().optional(),
});

// --- DOCKER ADMIN ---
export const ListContainersSchema = z.object({
  all: z.boolean().default(false),
  filters: z.record(z.string()).optional(),
});

export const ContainerActionSchema = z.object({
  containerId: z.string().min(1),
});

export const ContainerLogsSchema = z.object({
  containerId: z.string().min(1),
  tail: z.number().default(100),
  since: z.string().optional(), // timestamp
  follow: z.boolean().default(false),
});

export const DockerComposeSchema = z.object({
  composePath: z.string(),
  projectName: z.string().optional(),
  detached: z.boolean().default(true),
});

// --- SERVER ADMIN ---
export const ServiceActionSchema = z.object({
  serviceName: z.string().min(1),
  confirm: z.boolean().default(false),
});

export const CheckPortSchema = z.object({
  port: z.number().min(1).max(65535),
  host: z.string().default('localhost'),
});

export const ProcessListSchema = z.object({
  limit: z.number().default(10),
  sortBy: z.enum(['cpu', 'memory', 'pid']).default('cpu'),
});

// --- PROJECT OPS ---
export const ListDirectorySchema = z.object({
  path: z.string(),
  recursive: z.boolean().default(false),
  showHidden: z.boolean().default(false),
});

export const ReadFileSchema = z.object({
  path: z.string(),
  encoding: z.string().default('utf-8'),
});

export const WriteFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  createBackup: z.boolean().default(true),
  mode: z.string().optional(), // file permissions
});

export const DeleteFileSchema = z.object({
  path: z.string(),
  confirm: z.boolean().default(false),
});

export const GitActionSchema = z.object({
  repoPath: z.string(),
  message: z.string().optional(),
  files: z.array(z.string()).optional(),
  branch: z.string().optional(),
  remote: z.string().optional(),
});

// --- GRAPHICS ---
export const ResizeImageSchema = z.object({
  inputPath: z.string(),
  outputPath: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover'),
});

export const ConvertImageSchema = z.object({
  inputPath: z.string(),
  outputPath: z.string(),
  format: z.enum(['jpeg', 'png', 'webp', 'avif', 'tiff']),
  quality: z.number().min(1).max(100).default(80),
});

export const CompressImageSchema = z.object({
  inputPath: z.string(),
  outputPath: z.string().optional(),
  quality: z.number().min(1).max(100).default(70),
});

export const ImageInfoSchema = z.object({
  imagePath: z.string(),
});

export const ComposeImagesSchema = z.object({
  basePath: z.string(),
  overlayPath: z.string(),
  outputPath: z.string(),
  position: z.enum(['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).default('center'),
  opacity: z.number().min(0).max(1).default(1),
});

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type SetupPythonEnvInput = z.infer<typeof SetupPythonEnvSchema>;
export type SetupNodeEnvInput = z.infer<typeof SetupNodeEnvSchema>;
export type InstallDependenciesInput = z.infer<typeof InstallDependenciesSchema>;
export type ListContainersInput = z.infer<typeof ListContainersSchema>;
export type ContainerActionInput = z.infer<typeof ContainerActionSchema>;
export type ContainerLogsInput = z.infer<typeof ContainerLogsSchema>;
export type DockerComposeInput = z.infer<typeof DockerComposeSchema>;
export type ServiceActionInput = z.infer<typeof ServiceActionSchema>;
export type CheckPortInput = z.infer<typeof CheckPortSchema>;
export type ProcessListInput = z.infer<typeof ProcessListSchema>;
export type ListDirectoryInput = z.infer<typeof ListDirectorySchema>;
export type ReadFileInput = z.infer<typeof ReadFileSchema>;
export type WriteFileInput = z.infer<typeof WriteFileSchema>;
export type DeleteFileInput = z.infer<typeof DeleteFileSchema>;
export type GitActionInput = z.infer<typeof GitActionSchema>;
export type ResizeImageInput = z.infer<typeof ResizeImageSchema>;
export type ConvertImageInput = z.infer<typeof ConvertImageSchema>;
export type CompressImageInput = z.infer<typeof CompressImageSchema>;
export type ImageInfoInput = z.infer<typeof ImageInfoSchema>;
export type ComposeImagesInput = z.infer<typeof ComposeImagesSchema>;
