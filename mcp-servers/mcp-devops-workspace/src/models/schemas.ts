/**
 * Schémas Zod pour validation des inputs/outputs MCP
 */

import { z } from "zod";

// ============================================================================
// MODULE: dev_env
// ============================================================================

export const CreateProjectInputSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Nom invalide (alphanumerique, _, - uniquement)"),
  type: z.enum(["python", "node", "generic"]),
  path: z.string().optional(),
  initGit: z.boolean().default(true),
});

export const CreateProjectOutputSchema = z.object({
  success: z.boolean(),
  projectPath: z.string(),
  message: z.string(),
});

export const SetupPythonEnvInputSchema = z.object({
  projectPath: z.string(),
  pythonVersion: z.string().optional(),
  envName: z.string().default("venv"),
});

export const SetupPythonEnvOutputSchema = z.object({
  success: z.boolean(),
  envPath: z.string(),
  activateCommand: z.string(),
  pythonPath: z.string(),
});

export const SetupNodeEnvInputSchema = z.object({
  projectPath: z.string(),
  packageManager: z.enum(["npm", "yarn", "pnpm"]).default("npm"),
  nodeVersion: z.string().optional(),
});

export const SetupNodeEnvOutputSchema = z.object({
  success: z.boolean(),
  packageJsonPath: z.string(),
  nodeVersion: z.string(),
  packageManager: z.string(),
});

export const InstallDependenciesInputSchema = z.object({
  projectPath: z.string(),
  projectType: z.enum(["python", "node"]),
  upgrade: z.boolean().default(false),
});

export const InstallDependenciesOutputSchema = z.object({
  success: z.boolean(),
  installed: z.array(z.string()),
  errors: z.array(z.string()).optional(),
});

export const ListEnvsInputSchema = z.object({
  type: z.enum(["python", "node", "all"]).default("all"),
});

export const ListEnvsOutputSchema = z.object({
  environments: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      path: z.string(),
      active: z.boolean(),
    })
  ),
});

// ============================================================================
// MODULE: docker
// ============================================================================

export const ListContainersInputSchema = z.object({
  all: z.boolean().default(false),
  filters: z
    .object({
      name: z.string().optional(),
      status: z.enum(["running", "stopped", "paused"]).optional(),
    })
    .optional(),
});

export const ListContainersOutputSchema = z.object({
  containers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      image: z.string(),
      status: z.string(),
      ports: z.array(z.string()),
      created: z.string(),
    })
  ),
});

export const ContainerLogsInputSchema = z.object({
  containerId: z.string(),
  tail: z.number().default(100),
  follow: z.boolean().default(false),
  since: z.string().optional(),
});

export const ContainerLogsOutputSchema = z.object({
  logs: z.string(),
  containerName: z.string(),
});

export const ContainerActionInputSchema = z.object({
  containerId: z.string(),
});

export const ContainerActionOutputSchema = z.object({
  success: z.boolean(),
  containerId: z.string(),
  newStatus: z.string(),
});

export const ListImagesInputSchema = z.object({
  dangling: z.boolean().optional(),
});

export const ListImagesOutputSchema = z.object({
  images: z.array(
    z.object({
      id: z.string(),
      repository: z.string(),
      tag: z.string(),
      size: z.string(),
      created: z.string(),
    })
  ),
});

// ============================================================================
// MODULE: system
// ============================================================================

export const GetSystemInfoInputSchema = z.object({});

export const GetSystemInfoOutputSchema = z.object({
  os: z.string(),
  kernel: z.string(),
  hostname: z.string(),
  uptime: z.string(),
  architecture: z.string(),
});

export const GetResourceUsageInputSchema = z.object({
  detailed: z.boolean().default(false),
});

export const GetResourceUsageOutputSchema = z.object({
  cpu: z.object({
    usage: z.number(),
    cores: z.number(),
  }),
  memory: z.object({
    total: z.string(),
    used: z.string(),
    free: z.string(),
    percentage: z.number(),
  }),
  disk: z.array(
    z.object({
      filesystem: z.string(),
      mountpoint: z.string(),
      total: z.string(),
      used: z.string(),
      available: z.string(),
      percentage: z.number(),
    })
  ),
});

export const ListServicesInputSchema = z.object({
  state: z.enum(["running", "failed", "all"]).default("running"),
});

export const ListServicesOutputSchema = z.object({
  services: z.array(
    z.object({
      name: z.string(),
      status: z.string(),
      enabled: z.boolean(),
    })
  ),
});

export const ServiceStatusInputSchema = z.object({
  serviceName: z.string(),
});

export const ServiceStatusOutputSchema = z.object({
  name: z.string(),
  active: z.boolean(),
  enabled: z.boolean(),
  uptime: z.string().optional(),
  logs: z.string().optional(),
});

export const RestartServiceInputSchema = z.object({
  serviceName: z.string(),
  confirm: z.boolean(),
});

export const RestartServiceOutputSchema = z.object({
  success: z.boolean(),
  serviceName: z.string(),
  newStatus: z.string(),
});

// ============================================================================
// MODULE: project
// ============================================================================

export const ListDirectoryInputSchema = z.object({
  path: z.string(),
  recursive: z.boolean().default(false),
  includeHidden: z.boolean().default(false),
});

export const ListDirectoryOutputSchema = z.object({
  path: z.string(),
  entries: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["file", "directory", "symlink"]),
      size: z.number().optional(),
      modified: z.string(),
    })
  ),
});

export const ReadFileInputSchema = z.object({
  filePath: z.string(),
  encoding: z.string().default("utf-8"),
});

export const ReadFileOutputSchema = z.object({
  content: z.string(),
  filePath: z.string(),
  size: z.number(),
});

export const WriteFileInputSchema = z.object({
  filePath: z.string(),
  content: z.string(),
  createBackup: z.boolean().default(true),
});

export const WriteFileOutputSchema = z.object({
  success: z.boolean(),
  filePath: z.string(),
  backupPath: z.string().optional(),
});

export const GitInitInputSchema = z.object({
  projectPath: z.string(),
});

export const GitInitOutputSchema = z.object({
  success: z.boolean(),
  projectPath: z.string(),
  message: z.string(),
});

export const GitStatusInputSchema = z.object({
  projectPath: z.string(),
});

export const GitStatusOutputSchema = z.object({
  branch: z.string(),
  ahead: z.number(),
  behind: z.number(),
  modified: z.array(z.string()),
  staged: z.array(z.string()),
  untracked: z.array(z.string()),
  clean: z.boolean(),
});

export const GitCommitInputSchema = z.object({
  projectPath: z.string(),
  message: z.string(),
  addAll: z.boolean().default(true),
});

export const GitCommitOutputSchema = z.object({
  success: z.boolean(),
  commitHash: z.string(),
  message: z.string(),
});

export const GitPushInputSchema = z.object({
  projectPath: z.string(),
  remote: z.string().default("origin"),
  branch: z.string().optional(),
  setUpstream: z.boolean().default(false),
});

export const GitPushOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// ============================================================================
// MODULE: graphics
// ============================================================================

export const ResizeImageInputSchema = z.object({
  inputPath: z.string(),
  outputPath: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  maintainAspectRatio: z.boolean().default(true),
});

export const ResizeImageOutputSchema = z.object({
  success: z.boolean(),
  outputPath: z.string(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
});

export const ConvertFormatInputSchema = z.object({
  inputPath: z.string(),
  outputPath: z.string(),
  format: z.enum(["png", "jpg", "jpeg", "webp", "gif"]),
});

export const ConvertFormatOutputSchema = z.object({
  success: z.boolean(),
  outputPath: z.string(),
  format: z.string(),
});

export const GenerateThumbnailInputSchema = z.object({
  inputPath: z.string(),
  outputPath: z.string(),
  maxSize: z.number().default(150),
});

export const GenerateThumbnailOutputSchema = z.object({
  success: z.boolean(),
  outputPath: z.string(),
});
