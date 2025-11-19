import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import logger from './utils/logger.js';
import apiRouter from './routes/api.js';
import { initDocker } from './modules/docker_runner.js';
import { loadConfig } from './utils/config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  logger.info('WebSocket client connected');

  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Claude DevBox Backend'
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      logger.info(`WebSocket message: ${data.type}`);
      // Handle WebSocket messages
    } catch (error) {
      logger.error('Invalid WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});

// Export wss for use in other modules
export { wss };

// Initialize Docker
async function initialize() {
  try {
    logger.info('Starting Claude DevBox Backend...');

    // Load configuration
    await loadConfig();
    logger.info('Configuration loaded');

    // Initialize Docker
    await initDocker();
    logger.info('Docker initialized');

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Claude DevBox Backend listening on port ${PORT}`);
      logger.info(`🔌 WebSocket server ready`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start the server
initialize();
