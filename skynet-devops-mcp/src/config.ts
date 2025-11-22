import { homedir } from 'os';
import { join } from 'path';

export interface Config {
  baseProjectsPath: string;
  tempDir: string;
  logLevel: string;
  logFile: string;
  dockerSocket: string;
  allowDangerousOperations: boolean;
  requireConfirmationForSystemRestart: boolean;
  maxFileSizeMB: number;
  maxLogLines: number;
  commandTimeoutMs: number;
}

export const config: Config = {
  baseProjectsPath: process.env.BASE_PROJECTS_PATH || join(homedir(), 'projects'),
  tempDir: process.env.TEMP_DIR || '/tmp/skynet-mcp',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || '/var/log/skynet-devops-mcp.log',
  dockerSocket: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  allowDangerousOperations: process.env.ALLOW_DANGEROUS_OPERATIONS === 'true',
  requireConfirmationForSystemRestart: process.env.REQUIRE_CONFIRMATION_FOR_SYSTEM_RESTART !== 'false',
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  maxLogLines: parseInt(process.env.MAX_LOG_LINES || '1000', 10),
  commandTimeoutMs: parseInt(process.env.COMMAND_TIMEOUT_MS || '300000', 10),
};
