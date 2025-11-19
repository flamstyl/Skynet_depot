/**
 * Claude DevBox Server
 * Main entry point for the backend server
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

// Import services
import { initWebSocket } from './services/ws.js';
import DockerRunner from './services/docker_runner.js';
import FileManager from './services/file_manager.js';
import MCPBridge from './services/mcp_bridge.js';
import AutoFixer from './services/auto_fixer.js';
import logger from './services/logger.js';

// Import routes
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DevBoxServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.port = process.env.PORT || 4000;
        this.services = {};
    }

    async init() {
        logger.info('🧠 Initializing Claude DevBox Server...');

        // Middleware
        this.app.use(cors());
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`);
            next();
        });

        // Initialize services
        await this.initializeServices();

        // Make services available to routes
        this.app.locals.services = this.services;

        // Routes
        this.app.use('/api', apiRoutes);

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                docker: this.services.docker.getStatus(),
                workspace: this.services.fileManager.getWorkspaceInfo(),
                timestamp: new Date().toISOString()
            });
        });

        // Static files (serve editor)
        const editorPath = join(__dirname, '../editor');
        if (fs.existsSync(editorPath)) {
            this.app.use(express.static(editorPath));
            this.app.get('/', (req, res) => {
                res.sendFile(join(editorPath, 'index.html'));
            });
        }

        // Error handling
        this.app.use((err, req, res, next) => {
            logger.error(`Error: ${err.message}`, { stack: err.stack });
            res.status(500).json({
                error: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Not found' });
        });

        // Create HTTP server
        this.server = http.createServer(this.app);

        // Initialize WebSocket
        initWebSocket(this.server, this.services);

        return this;
    }

    async initializeServices() {
        logger.info('Initializing services...');

        // Docker Runner
        this.services.docker = new DockerRunner();
        await this.services.docker.init();

        // File Manager
        this.services.fileManager = new FileManager();
        await this.services.fileManager.init();

        // MCP Bridge
        this.services.mcpBridge = new MCPBridge();

        // Auto Fixer
        this.services.autoFixer = new AutoFixer(
            this.services.docker,
            this.services.mcpBridge
        );

        logger.info('✓ All services initialized');
    }

    async start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                logger.info(`🚀 Claude DevBox Server running on port ${this.port}`);
                logger.info(`   Editor: http://localhost:${this.port}`);
                logger.info(`   API: http://localhost:${this.port}/api`);
                logger.info(`   WebSocket: ws://localhost:${this.port}/ws`);
                resolve();
            });
        });
    }

    async stop() {
        logger.info('Shutting down server...');

        if (this.server) {
            this.server.close();
        }

        // Cleanup services
        if (this.services.docker) {
            await this.services.docker.cleanup();
        }

        logger.info('Server stopped');
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    if (global.devBoxServer) {
        await global.devBoxServer.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    if (global.devBoxServer) {
        await global.devBoxServer.stop();
    }
    process.exit(0);
});

// Start server
const server = new DevBoxServer();
global.devBoxServer = server;

server.init()
    .then(() => server.start())
    .catch((error) => {
        logger.error('Failed to start server:', error);
        process.exit(1);
    });

export default DevBoxServer;
