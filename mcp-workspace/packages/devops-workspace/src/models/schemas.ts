import { z } from 'zod';

// ============================================================================
// DEV_ENV SCHEMAS
// ============================================================================

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  type: z.enum(['python', 'node', 'go', 'rust', 'generic']),
  path: z.string().optional(),
});

export const SetupPythonEnvSchema = z.object({
  projectPath: z.string(),
  pythonVersion: z.string().optional(),
  venvName: z.string().default('venv'),
});

export const SetupNodeEnvSchema = z.object({
  projectPath: z.string(),
  packageManager: z.enum(['npm', 'yarn', 'pnpm']).default('npm'),
});

export const InstallDependenciesSchema = z.object({
  projectPath: z.string(),
  type: z.enum(['python', 'node']),
  file: z.string().optional(),
});

// ============================================================================
// DOCKER_ADMIN SCHEMAS
// ============================================================================

export const ListContainersSchema = z.object({
  all: z.boolean().default(false),
  filter: z.string().optional(),
});

export const ContainerLogsSchema = z.object({
  container: z.string().min(1),
  tail: z.number().int().positive().max(1000).default(100),
  follow: z.boolean().default(false),
});

export const ContainerActionSchema = z.object({
  container: z.string().min(1),
  timeout: z.number().int().positive().optional(),
});

export const DockerComposeSchema = z.object({
  composePath: z.string(),
  detach: z.boolean().default(true),
  removeVolumes: z.boolean().default(false),
});

// ============================================================================
// SERVER_ADMIN SCHEMAS
// ============================================================================

export const ListServicesSchema = z.object({
  filter: z.string().optional(),
});

export const ServiceActionSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_.-]+$/),
  confirm: z.boolean().default(false),
});

export const CheckPortSchema = z.object({
  port: z.number().int().min(1).max(65535),
  protocol: z.enum(['tcp', 'udp']).default('tcp'),
});

export const DiskUsageSchema = z.object({
  path: z.string().default('/'),
});

// ============================================================================
// PROJECT_OPS SCHEMAS
// ============================================================================

export const ListDirectorySchema = z.object({
  path: z.string(),
  recursive: z.boolean().default(false),
  filter: z.string().optional(),
});

export const ReadFileSchema = z.object({
  path: z.string(),
  encoding: z.string().default('utf-8'),
});

export const WriteFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  backup: z.boolean().default(true),
});

export const DeleteFileSchema = z.object({
  path: z.string(),
  confirm: z.boolean().default(false),
});

export const GitInitSchema = z.object({
  path: z.string(),
  defaultBranch: z.string().default('main'),
});

export const GitStatusSchema = z.object({
  path: z.string(),
});

export const GitAddSchema = z.object({
  path: z.string(),
  files: z.array(z.string()),
});

export const GitCommitSchema = z.object({
  path: z.string(),
  message: z.string().min(1).max(500),
  author: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
});

export const GitBranchSchema = z.object({
  path: z.string(),
  action: z.enum(['list', 'create', 'delete']),
  name: z.string().optional(),
});

export const GitCheckoutSchema = z.object({
  path: z.string(),
  branch: z.string(),
  create: z.boolean().default(false),
});

export const GitPullSchema = z.object({
  path: z.string(),
  remote: z.string().default('origin'),
  branch: z.string().optional(),
});

export const GitPushSchema = z.object({
  path: z.string(),
  remote: z.string().default('origin'),
  branch: z.string().optional(),
  force: z.boolean().default(false),
});

export const GitLogSchema = z.object({
  path: z.string(),
  limit: z.number().int().positive().max(100).default(10),
});

// ============================================================================
// GRAPHICS_TOOLS SCHEMAS
// ============================================================================

export const ResizeImageSchema = z.object({
  input: z.string(),
  output: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  keepAspectRatio: z.boolean().default(true),
});

export const ConvertFormatSchema = z.object({
  input: z.string(),
  output: z.string(),
  format: z.enum(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']),
});

export const ComposeImagesSchema = z.object({
  inputs: z.array(z.string()).min(2),
  output: z.string(),
  layout: z.enum(['horizontal', 'vertical', 'grid']).default('horizontal'),
});

export const GenerateThumbnailSchema = z.object({
  input: z.string(),
  output: z.string(),
  size: z.number().int().positive().default(200),
});

export const ImageInfoSchema = z.object({
  path: z.string(),
});

export const OptimizeImageSchema = z.object({
  input: z.string(),
  output: z.string().optional(),
  quality: z.number().int().min(1).max(100).default(85),
});
