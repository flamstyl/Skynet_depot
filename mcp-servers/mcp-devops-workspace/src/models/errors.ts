/**
 * Erreurs personnalisées pour MCP DevOps Workspace
 */

export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = "MCPError";
  }
}

export class SecurityError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, "SECURITY_ERROR", details);
    this.name = "SecurityError";
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class CommandExecutionError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, "COMMAND_EXECUTION_ERROR", details);
    this.name = "CommandExecutionError";
  }
}

export class FileSystemError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, "FILESYSTEM_ERROR", details);
    this.name = "FileSystemError";
  }
}

export class DockerError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, "DOCKER_ERROR", details);
    this.name = "DockerError";
  }
}

export class GitError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, "GIT_ERROR", details);
    this.name = "GitError";
  }
}

export class GraphicsError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, "GRAPHICS_ERROR", details);
    this.name = "GraphicsError";
  }
}
