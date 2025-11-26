/**
 * Logger Service
 * Winston-based logging with file and console output
 */

import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, '../logs');
fs.ensureDirSync(logsDir);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'claude-devbox' },
    transports: [
        // Write all logs to combined.log
        new winston.transports.File({
            filename: join(logsDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        // Write errors to error.log
        new winston.transports.File({
            filename: join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10485760,
            maxFiles: 5
        })
    ]
});

// Console output for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
                let metaStr = '';
                if (Object.keys(meta).length > 0) {
                    metaStr = '\n' + JSON.stringify(meta, null, 2);
                }
                return `${timestamp} ${level}: ${message}${metaStr}`;
            })
        )
    }));
}

export default logger;
