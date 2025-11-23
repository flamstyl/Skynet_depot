import winston from 'winston';
import { config } from '../config/default.js';

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console (pour MCP stdio)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      silent: process.env.NODE_ENV === 'production', // Silence console en prod (MCP stdio)
    }),
    // Fichier
    new winston.transports.File({
      filename: config.logFile,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Helper pour logger sans contenu sensible
export const sanitizeForLog = (data: any): any => {
  if (typeof data === 'string') {
    // Masque les tokens, passwords, etc.
    return data.replace(/(?:token|password|secret|key)=([^&\s]+)/gi, '$1=***');
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (/(?:token|password|secret|key|credential)/i.test(key)) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeForLog(value);
      }
    }
    return sanitized;
  }
  return data;
};
