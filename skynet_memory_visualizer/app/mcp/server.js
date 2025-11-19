/**
 * Skynet Memory Visualizer - MCP Server
 * Provides MCP endpoints for Skynet ecosystem integration
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

// Import tools
const syncRAG = require('./tools/sync_rag');
const aiExport = require('./tools/ai_export');
const indexRefresh = require('./tools/index_refresh');

// Load configuration
let config;
try {
    const configFile = fs.readFileSync('./config.mcp.json', 'utf8');
    config = JSON.parse(configFile);
} catch (error) {
    console.error('Failed to load config:', error);
    process.exit(1);
}

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// === Health & Status ===

app.get('/health/visualizer', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'skynet-memory-visualizer',
        version: config.version,
        timestamp: new Date().toISOString()
    });
});

app.get('/status', (req, res) => {
    res.json({
        service: config.name,
        version: config.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        endpoints: config.endpoints
    });
});

// === Sync Endpoints ===

app.post('/sync/rag', async (req, res) => {
    try {
        console.log('Syncing RAG memory...');
        const result = await syncRAG.sync(req.body);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Sync failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/sync/status', async (req, res) => {
    try {
        const status = await syncRAG.getStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// === AI Export Endpoints ===

app.post('/ai/export', async (req, res) => {
    try {
        console.log('Exporting memory for AI...');
        const result = await aiExport.export(req.body);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Export failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/ai/regenerate', async (req, res) => {
    try {
        console.log('Regenerating document via AI...');
        const { doc_path, prompt_type } = req.body;

        // Forward to Flask backend
        const response = await fetch(`http://localhost:5432/api/ai/regenerate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error('Regenerate failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/ai/summarize', async (req, res) => {
    try {
        console.log('Summarizing document...');

        // Forward to Flask backend
        const response = await fetch(`http://localhost:5432/api/ai/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error('Summarize failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// === Index Management ===

app.post('/index/refresh', async (req, res) => {
    try {
        console.log('Refreshing RAG index...');
        const result = await indexRefresh.refresh(req.body);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Index refresh failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/index/status', async (req, res) => {
    try {
        const status = await indexRefresh.getStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// === MCP Tool Definitions (for discovery) ===

app.get('/tools', (req, res) => {
    res.json({
        tools: [
            {
                name: 'sync_rag',
                description: 'Synchronize RAG memory with Skynet Core',
                endpoint: '/sync/rag',
                method: 'POST',
                parameters: {
                    direction: 'push|pull|both',
                    force: 'boolean'
                }
            },
            {
                name: 'ai_export',
                description: 'Export documents for AI consumption',
                endpoint: '/ai/export',
                method: 'POST',
                parameters: {
                    format: 'json|markdown|text',
                    filter: 'optional tag filter'
                }
            },
            {
                name: 'index_refresh',
                description: 'Refresh RAG index metadata',
                endpoint: '/index/refresh',
                method: 'POST',
                parameters: {
                    full: 'boolean - full reindex or incremental'
                }
            }
        ]
    });
});

// === Error Handler ===

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// === Start Server ===

const PORT = config.port || 3456;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   Skynet Memory Visualizer - MCP Server        ║
║   Port: ${PORT}                                   ║
║   Version: ${config.version}                          ║
╚════════════════════════════════════════════════╝
    `);
    console.log('MCP Server ready and listening...');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing MCP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing MCP server');
    process.exit(0);
});

module.exports = app;
