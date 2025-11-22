import winston from 'winston';
import { config } from '../config.js';

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'skynet-drive-memory-mcp' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ...meta }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(meta).length > 0 && meta.service !== 'skynet-drive-memory-mcp') {
              msg += ` ${JSON.stringify(meta)}`;
            }
            return msg;
          }
        )
      ),
    }),
  ],
});

try {
  logger.add(
    new winston.transports.File({
      filename: config.logFile,
      format: winston.format.json(),
    })
  );
} catch (error) {
  logger.warn('Unable to write to log file, using console only', { error });
}
