/**
 * Système de logging sécurisé (sans secrets)
 */

type LogLevel = "debug" | "info" | "warn" | "error";

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = "info") {
    this.level = process.env.LOG_LEVEL as LogLevel || level;
  }

  /**
   * Sanitize un message pour masquer les secrets
   */
  private sanitize(message: string): string {
    return message
      .replace(/password[=:]\s*\S+/gi, "password=***")
      .replace(/token[=:]\s*\S+/gi, "token=***")
      .replace(/api[_-]?key[=:]\s*\S+/gi, "api_key=***")
      .replace(/secret[=:]\s*\S+/gi, "secret=***")
      .replace(/Authorization:\s*\S+/gi, "Authorization: ***");
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    if (levels.indexOf(level) < levels.indexOf(this.level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const sanitizedMessage = this.sanitize(message);
    const sanitizedArgs = args.map((arg) =>
      typeof arg === "string" ? this.sanitize(arg) : arg
    );

    console[level === "debug" || level === "info" ? "log" : level](
      `[${timestamp}] [${level.toUpperCase()}]`,
      sanitizedMessage,
      ...sanitizedArgs
    );
  }

  debug(message: string, ...args: any[]): void {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log("error", message, ...args);
  }
}

export const logger = new Logger();
