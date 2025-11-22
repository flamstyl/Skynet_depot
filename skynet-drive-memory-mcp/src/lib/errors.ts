export class McpError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'McpError';
  }
}

export class ValidationError extends McpError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends McpError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends McpError {
  constructor(message: string, details?: unknown) {
    super(message, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class ExecutionError extends McpError {
  constructor(message: string, details?: unknown) {
    super(message, 'EXECUTION_ERROR', details);
    this.name = 'ExecutionError';
  }
}

export function formatError(error: unknown): { message: string; code: string; details?: unknown } {
  if (error instanceof McpError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      details: { stack: error.stack },
    };
  }

  return {
    message: String(error),
    code: 'UNKNOWN_ERROR',
  };
}
