/**
 * Classes d'erreurs personnalisées pour le MCP GitHub Auto-Committer
 */

export class AutoCommitterError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AutoCommitterError';
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

export class PathValidationError extends AutoCommitterError {
  constructor(message, path) {
    super(message, 'PATH_VALIDATION_ERROR', { path });
    this.name = 'PathValidationError';
  }
}

export class NotAGitRepoError extends AutoCommitterError {
  constructor(path) {
    super(`Not a git repository: ${path}`, 'NOT_A_GIT_REPO', { path });
    this.name = 'NotAGitRepoError';
  }
}

export class SecurityViolationError extends AutoCommitterError {
  constructor(message, details) {
    super(message, 'SECURITY_VIOLATION', details);
    this.name = 'SecurityViolationError';
  }
}

export class GitOperationError extends AutoCommitterError {
  constructor(message, operation, details = {}) {
    super(message, 'GIT_OPERATION_ERROR', { operation, ...details });
    this.name = 'GitOperationError';
  }
}

export class NoChangesError extends AutoCommitterError {
  constructor() {
    super('No changes to commit', 'NO_CHANGES', {});
    this.name = 'NoChangesError';
  }
}

export class RemoteError extends AutoCommitterError {
  constructor(message, remote, details = {}) {
    super(message, 'REMOTE_ERROR', { remote, ...details });
    this.name = 'RemoteError';
  }
}

export class CredentialsError extends AutoCommitterError {
  constructor(message) {
    super(message, 'CREDENTIALS_ERROR', {});
    this.name = 'CredentialsError';
  }
}
