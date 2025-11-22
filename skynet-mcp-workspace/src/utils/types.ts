/**
 * Types et interfaces communs pour Skynet MCP Workspace
 */

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  code?: number;
  data?: any;
}

export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface ExecutionContext {
  workingDirectory?: string;
  environment?: Record<string, string>;
  timeout?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  modified: Date;
  permissions?: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: string;
}

export interface SystemHealth {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
  loadAverage: number[];
}

export interface DockerContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string[];
  created: Date;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
  staged: string[];
  clean: boolean;
}
