/**
 * Types pour les tools MCP
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface MCPError {
  code: string;
  message: string;
  details?: any;
}

// Dev Env Types
export interface CreateProjectInput {
  name: string;
  type: 'python' | 'node' | 'mixed';
  path?: string;
  template?: string;
  git_init?: boolean;
}

export interface SetupPythonEnvInput {
  project_path: string;
  python_version?: string;
  env_name?: string;
  requirements?: string;
  install_deps?: boolean;
}

export interface SetupNodeEnvInput {
  project_path: string;
  node_version?: string;
  package_manager: 'npm' | 'yarn' | 'pnpm';
  install_deps?: boolean;
}

export interface InstallDependenciesInput {
  project_path: string;
  type: 'python' | 'node';
  force?: boolean;
}

export interface ListEnvsInput {
  filter?: 'python' | 'node' | 'all';
  search_path?: string;
}

// Docker Types
export interface ListContainersInput {
  all?: boolean;
  filter?: string;
  format?: 'simple' | 'detailed';
}

export interface ContainerLogsInput {
  container: string;
  tail?: number;
  since?: string;
  follow?: boolean;
}

export interface ContainerActionInput {
  container: string;
  timeout?: number;
  wait_healthy?: boolean;
}

export interface ComposeInput {
  compose_file: string;
  detach?: boolean;
  build?: boolean;
  force_recreate?: boolean;
}

// Server Admin Types
export interface GetResourceUsageInput {
  detailed?: boolean;
  include_gpu?: boolean;
}

export interface ListServicesInput {
  filter?: 'active' | 'failed' | 'all';
  search?: string;
}

export interface ServiceActionInput {
  service: string;
  confirm?: boolean;
}

// Project Ops Types
export interface ListDirectoryInput {
  path: string;
  recursive?: boolean;
  include_hidden?: boolean;
  filter?: string;
}

export interface ReadFileInput {
  path: string;
  encoding?: string;
  max_size?: number;
}

export interface WriteFileInput {
  path: string;
  content: string;
  encoding?: string;
  create_backup?: boolean;
  create_dirs?: boolean;
}

export interface DeleteFileInput {
  path: string;
  recursive?: boolean;
  confirm: boolean;
}

export interface GitInput {
  repo_path: string;
  message?: string;
  files?: string[];
  remote?: string;
  branch?: string;
  force?: boolean;
  author?: {
    name: string;
    email: string;
  };
}

// Graphics Types
export interface ResizeImageInput {
  input_path: string;
  output_path: string;
  width?: number;
  height?: number;
  maintain_aspect?: boolean;
  quality?: number;
}

export interface ConvertFormatInput {
  input_path: string;
  output_path: string;
  format: 'jpg' | 'png' | 'webp' | 'gif' | 'bmp';
  quality?: number;
}

export interface ComposeImagesInput {
  images: Array<{
    path: string;
    x: number;
    y: number;
  }>;
  output_path: string;
  canvas_width: number;
  canvas_height: number;
  background?: string;
}

export interface GenerateThumbnailInput {
  input_path: string;
  output_path: string;
  max_size?: number;
  crop?: boolean;
}

export interface OptimizeImageInput {
  input_path: string;
  output_path?: string;
  aggressive?: boolean;
}
