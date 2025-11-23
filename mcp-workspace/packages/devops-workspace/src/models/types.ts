/**
 * Types TypeScript pour le MCP DevOps Workspace
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  execute: (args: any) => Promise<ToolResult>;
}

// ============================================================================
// DEV_ENV TYPES
// ============================================================================

export interface ProjectStructure {
  projectPath: string;
  type: string;
  structure: string[];
}

export interface PythonEnv {
  venvPath: string;
  pythonVersion: string;
  activated: boolean;
}

export interface NodeEnv {
  packageManager: string;
  version: string;
  nodeVersion: string;
}

// ============================================================================
// DOCKER_ADMIN TYPES
// ============================================================================

export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: string;
  ports: string[];
}

export interface ContainerStats {
  cpu: number;
  memory: number;
  memoryLimit: number;
  networkRx: number;
  networkTx: number;
  diskRead: number;
  diskWrite: number;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

// ============================================================================
// SERVER_ADMIN TYPES
// ============================================================================

export interface SystemInfo {
  os: string;
  platform: string;
  kernel: string;
  uptime: number;
  hostname: string;
  cpu: {
    model: string;
    cores: number;
    speed: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
  };
}

export interface ResourceUsage {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: Array<{
    mount: string;
    total: number;
    used: number;
    free: number;
    percentage: number;
  }>;
}

export interface Service {
  name: string;
  status: string;
  enabled: boolean;
  active: boolean;
  uptime?: string;
  pid?: number;
}

export interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  command: string;
}

// ============================================================================
// PROJECT_OPS TYPES
// ============================================================================

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
}

export interface GitStatus {
  branch: string;
  tracking?: string;
  ahead: number;
  behind: number;
  modified: string[];
  created: string[];
  deleted: string[];
  renamed: string[];
  staged: string[];
  conflicted: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

// ============================================================================
// GRAPHICS_TOOLS TYPES
// ============================================================================

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  colorSpace?: string;
  hasAlpha?: boolean;
}

export interface ImageOperationResult {
  success: boolean;
  outputPath: string;
  inputSize: number;
  outputSize: number;
  reduction?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}
