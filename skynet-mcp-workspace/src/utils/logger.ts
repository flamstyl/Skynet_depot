/**
 * Logger utilitaire pour Skynet MCP Workspace
 * Gère les logs avec niveaux et formatage
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

class Logger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] [${this.module}] ${message}${dataStr}`;
  }

  debug(message: string, data?: any): void {
    if (process.env.DEBUG) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, data));
  }

  error(message: string, error?: Error | any): void {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(this.formatMessage(LogLevel.ERROR, message, errorData));
  }

  success(message: string, data?: any): void {
    console.log(this.formatMessage(LogLevel.SUCCESS, message, data));
  }
}

export function createLogger(module: string): Logger {
  return new Logger(module);
}
