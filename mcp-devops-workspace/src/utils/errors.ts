/**
 * Gestion des erreurs MCP
 */

export class MCPError extends Error {
  constructor(
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'SECURITY_ERROR', details);
    this.name = 'SecurityError';
  }
}

export class NotFoundError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'PERMISSION_DENIED', details);
    this.name = 'PermissionError';
  }
}

/**
 * Formate une erreur pour réponse MCP
 */
export function formatError(error: unknown): { isError: true; content: Array<{ type: 'text'; text: string }> } {
  if (error instanceof MCPError) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.name,
            code: error.code,
            message: error.message,
            details: error.details,
          }, null, 2),
        },
      ],
    };
  }

  if (error instanceof Error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.name,
            message: error.message,
            stack: error.stack,
          }, null, 2),
        },
      ],
    };
  }

  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          error: 'UnknownError',
          message: String(error),
        }, null, 2),
      },
    ],
  };
}

/**
 * Wrap une fonction async avec gestion d'erreur
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error instanceof MCPError ? error : new MCPError(String(error));
    }
  };
}
