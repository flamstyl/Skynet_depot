/**
 * Types et interfaces pour MCP DevOps Workspace
 */

export interface ProjectInfo {
  name: string;
  type: "python" | "node" | "generic";
  path: string;
  gitInitialized: boolean;
  environment?: EnvironmentInfo;
}

export interface EnvironmentInfo {
  type: "python" | "node";
  path: string;
  version: string;
  active: boolean;
  packages?: string[];
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string[];
  created: string;
}

export interface ImageInfo {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

export interface ServiceInfo {
  name: string;
  status: string;
  enabled: boolean;
  uptime?: string;
}

export interface SystemInfo {
  os: string;
  kernel: string;
  hostname: string;
  uptime: string;
  architecture: string;
}

export interface SystemResources {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: string;
    used: string;
    free: string;
    percentage: number;
  };
  disk: DiskInfo[];
}

export interface DiskInfo {
  filesystem: string;
  mountpoint: string;
  total: string;
  used: string;
  available: string;
  percentage: number;
}

export interface FileEntry {
  name: string;
  type: "file" | "directory" | "symlink";
  size?: number;
  modified: string;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  staged: string[];
  untracked: string[];
  clean: boolean;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface MCPToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CommandExecutionOptions {
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
  sudo?: boolean;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
