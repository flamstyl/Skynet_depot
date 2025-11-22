/**
 * Types pour la configuration
 */

export interface WorkspaceConfig {
  name: string;
  version: string;
  description: string;
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
  transport: {
    type: 'stdio' | 'http';
    command?: string;
    args?: string[];
  };
  environment: Record<string, string>;
  security: {
    dangerous_operations: boolean;
    max_file_size: number;
    allowed_paths: string[];
  };
  modules: {
    dev_env: ModuleConfig;
    docker_admin: ModuleConfig;
    server_admin: ModuleConfig;
    project_ops: ModuleConfig;
    graphics_tools: ModuleConfig;
  };
}

export interface ModuleConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface EnvConfig {
  MCP_PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  PROJECTS_ROOT: string;
  DATA_DIR: string;
  CACHE_DIR: string;
  LOGS_DIR: string;
  DOCKER_SOCKET: string;
  MAX_FILE_SIZE: number;
  MAX_PROMPT_SIZE: number;
  ENABLE_DANGEROUS_OPERATIONS: boolean;
}
