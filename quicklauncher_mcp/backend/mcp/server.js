/**
 * QuickLauncher MCP Server
 * Handles index synchronization, AI routing, and plugin distribution
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

import { indexSync } from './tools/index_sync.js';
import { aiBridge } from './tools/ai_bridge.js';
import { pluginsManager } from './tools/plugins_manager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Load MCP configuration
let mcpConfig = {};
const configPath = join(__dirname, 'config.mcp.json');

try {
    const configData = await fs.readFile(configPath, 'utf-8');
    mcpConfig = JSON.parse(configData);
    console.log('MCP Config loaded:', mcpConfig);
} catch (error) {
    console.log('Using default MCP config');
    mcpConfig = {
        channel: 'skynet_quicklauncher',
        index_sync: true,
        ai_backend: 'claude_cli'
    };
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'QuickLauncher MCP Server',
        version: '1.0.0',
        uptime: process.uptime(),
        config: mcpConfig
    });
});

// Index Sync Endpoints

/**
 * Push index data from a device
 */
app.post('/sync/index/push', async (req, res) => {
    try {
        const { index_data, device_id } = req.body;

        if (!index_data || !device_id) {
            return res.status(400).json({
                error: 'Missing index_data or device_id'
            });
        }

        const result = await indexSync.push(device_id, index_data);

        res.json({
            success: true,
            message: 'Index pushed successfully',
            merged_count: result.merged_count
        });

    } catch (error) {
        console.error('Index push error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Pull merged index from all devices
 */
app.get('/sync/index/pull', async (req, res) => {
    try {
        const { device_id } = req.query;

        const merged_index = await indexSync.pull(device_id);

        res.json({
            success: true,
            index: merged_index,
            count: merged_index.length
        });

    } catch (error) {
        console.error('Index pull error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get sync status
 */
app.get('/sync/status', async (req, res) => {
    try {
        const status = await indexSync.getStatus();

        res.json({
            success: true,
            status
        });

    } catch (error) {
        console.error('Sync status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// AI Bridge Endpoints

/**
 * Process AI prompt (routes to Claude CLI / Gemini CLI / API)
 */
app.post('/ai/prompt', async (req, res) => {
    try {
        const { prompt, system, context } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: 'Missing prompt'
            });
        }

        const result = await aiBridge.processPrompt(
            prompt,
            system || '',
            context || {}
        );

        res.json({
            success: true,
            response: result.response,
            backend: result.backend
        });

    } catch (error) {
        console.error('AI prompt error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Plugin Manager Endpoints

/**
 * Get list of available plugins
 */
app.get('/plugins/list', async (req, res) => {
    try {
        const plugins = await pluginsManager.list();

        res.json({
            success: true,
            plugins,
            count: plugins.length
        });

    } catch (error) {
        console.error('Plugin list error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Install a plugin
 */
app.post('/plugins/install', async (req, res) => {
    try {
        const { plugin_id, source } = req.body;

        if (!plugin_id) {
            return res.status(400).json({
                error: 'Missing plugin_id'
            });
        }

        const result = await pluginsManager.install(plugin_id, source);

        res.json({
            success: true,
            message: 'Plugin installed successfully',
            plugin: result
        });

    } catch (error) {
        console.error('Plugin install error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Update a plugin
 */
app.post('/plugins/update', async (req, res) => {
    try {
        const { plugin_id } = req.body;

        if (!plugin_id) {
            return res.status(400).json({
                error: 'Missing plugin_id'
            });
        }

        const result = await pluginsManager.update(plugin_id);

        res.json({
            success: true,
            message: 'Plugin updated successfully',
            plugin: result
        });

    } catch (error) {
        console.error('Plugin update error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Uninstall a plugin
 */
app.post('/plugins/uninstall', async (req, res) => {
    try {
        const { plugin_id } = req.body;

        if (!plugin_id) {
            return res.status(400).json({
                error: 'Missing plugin_id'
            });
        }

        await pluginsManager.uninstall(plugin_id);

        res.json({
            success: true,
            message: 'Plugin uninstalled successfully'
        });

    } catch (error) {
        console.error('Plugin uninstall error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 QuickLauncher MCP Server running on port ${PORT}`);
    console.log(`📡 Channel: ${mcpConfig.channel}`);
    console.log(`🤖 AI Backend: ${mcpConfig.ai_backend}`);
    console.log(`🔄 Index Sync: ${mcpConfig.index_sync ? 'Enabled' : 'Disabled'}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\nShutting down MCP server...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nShutting down MCP server...');
    process.exit(0);
});
