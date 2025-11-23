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
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      silent: process.env.NODE_ENV === 'production',
    }),
    new winston.transports.File({
      filename: config.logFile,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

// Helper pour ne jamais logger le contenu des emails
export const sanitizeEmail = (email: any): any => {
  if (typeof email === 'object' && email !== null) {
    const { body, snippet, ...safe } = email;
    return { ...safe, body: '[REDACTED]', snippet: snippet?.substring(0, 50) + '...' };
  }
  return email;
};
