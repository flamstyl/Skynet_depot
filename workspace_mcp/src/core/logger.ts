/**
 * Logger structuré pour le MCP Workspace
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOGS_DIR = process.env.LOGS_DIR || path.join(process.cwd(), 'data', 'logs');

// Format personnalisé
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;

    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  })
);

// Configuration Winston
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: customFormat,
  transports: [
    // Console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    // Fichier pour toutes les logs
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'workspace-mcp.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Fichier pour les erreurs seulement
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Helper methods
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),

  // Logging spécifique aux tools
  toolCall: (toolName: string, input: any) => {
    logger.info(`Tool called: ${toolName}`, { input });
  },

  toolSuccess: (toolName: string, duration: number) => {
    logger.info(`Tool succeeded: ${toolName}`, { duration: `${duration}ms` });
  },

  toolError: (toolName: string, error: Error) => {
    logger.error(`Tool failed: ${toolName}`, {
      error: error.message,
      stack: error.stack
    });
  }
};

export default logger;
