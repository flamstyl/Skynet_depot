/**
 * Sentinelle MCP Server
 * MCP (Message Channel Protocol) server for Skynet Context Watcher
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Import tools
const { analyzeWithAI } = require('./tools/ia_bridge');
const { sendNotification } = require('./tools/notifications');

// Load configuration
const configPath = path.join(__dirname, 'config.mcp.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors({
    origin: config.security.allowed_origins
}));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// =============================================================================
// HEALTH & STATUS
// =============================================================================

/**
 * GET /health/sentinelle
 * Health check endpoint
 */
app.get('/health/sentinelle', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Sentinelle MCP Server',
        version: config.server.version,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * GET /status
 * Detailed status information
 */
app.get('/status', (req, res) => {
    res.json({
        server: {
            name: config.server.name,
            version: config.server.version,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        },
        config: {
            ai_backend: config.ai.backend,
            notifications_enabled: config.notifications.notify_raphael
        },
        timestamp: new Date().toISOString()
    });
});

// =============================================================================
// EVENT NOTIFICATIONS
// =============================================================================

/**
 * POST /notify/event
 * Send notification about a file system event
 *
 * Body:
 * {
 *   "event": {...},
 *   "ai_analysis": {...}
 * }
 */
app.post('/notify/event', async (req, res) => {
    try {
        const { event, ai_analysis } = req.body;

        if (!event) {
            return res.status(400).json({
                error: 'Missing event data'
            });
        }

        // Prepare notification message
        const notification = {
            channel: config.channel,
            timestamp: new Date().toISOString(),
            event: {
                id: event.event_id,
                type: event.event_type,
                file: event.file_name,
                path: event.path,
                priority: event.priority,
                category: event.category
            }
        };

        if (ai_analysis) {
            notification.ai_summary = ai_analysis.summary;
            notification.recommendations = ai_analysis.recommendations;
        }

        // Send notification if configured
        if (config.notifications.notify_raphael) {
            const notificationResult = await sendNotification(notification, config);

            res.json({
                success: true,
                message: 'Event notification processed',
                event_id: event.event_id,
                notification_sent: notificationResult.sent,
                notification_methods: notificationResult.methods
            });
        } else {
            res.json({
                success: true,
                message: 'Event received (notifications disabled)',
                event_id: event.event_id,
                notification_sent: false
            });
        }

    } catch (error) {
        console.error('Error processing event notification:', error);
        res.status(500).json({
            error: 'Failed to process event notification',
            message: error.message
        });
    }
});

/**
 * POST /alert/raphael
 * Send direct alert to Raphaël
 *
 * Body:
 * {
 *   "message": "Alert message",
 *   "priority": "high",
 *   "data": {...}
 * }
 */
app.post('/alert/raphael', async (req, res) => {
    try {
        const { message, priority, data } = req.body;

        if (!message) {
            return res.status(400).json({
                error: 'Missing alert message'
            });
        }

        const alert = {
            channel: config.channel,
            type: 'alert',
            timestamp: new Date().toISOString(),
            message,
            priority: priority || 'medium',
            data: data || {}
        };

        const result = await sendNotification(alert, config);

        res.json({
            success: true,
            message: 'Alert sent to Raphaël',
            notification_sent: result.sent,
            methods: result.methods
        });

    } catch (error) {
        console.error('Error sending alert:', error);
        res.status(500).json({
            error: 'Failed to send alert',
            message: error.message
        });
    }
});

// =============================================================================
// AI ANALYSIS
// =============================================================================

/**
 * POST /ai/analyze
 * Analyze an event with AI
 *
 * Body:
 * {
 *   "event": {...},
 *   "prompt_type": "analyze_change" | "generate_reaction" | "summarize_event"
 * }
 */
app.post('/ai/analyze', async (req, res) => {
    try {
        const { event, prompt_type } = req.body;

        if (!event) {
            return res.status(400).json({
                error: 'Missing event data'
            });
        }

        const promptType = prompt_type || 'analyze_change';

        // Perform AI analysis
        const analysis = await analyzeWithAI(event, promptType, config);

        if (analysis.success) {
            res.json({
                success: true,
                analysis: analysis.result.summary,
                recommendations: analysis.result.recommendations || [],
                confidence: analysis.result.confidence || 'medium',
                model: analysis.model,
                duration_ms: analysis.duration_ms
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'AI analysis failed',
                message: analysis.error
            });
        }

    } catch (error) {
        console.error('Error in AI analysis:', error);
        res.status(500).json({
            error: 'AI analysis error',
            message: error.message
        });
    }
});

// =============================================================================
// WATCHER MANAGEMENT
// =============================================================================

/**
 * PUT /watcher/update
 * Update watcher configuration
 *
 * Body:
 * {
 *   "action": "add" | "remove" | "enable" | "disable",
 *   "path": "C:/path/to/watch",
 *   "recursive": true
 * }
 */
app.put('/watcher/update', (req, res) => {
    try {
        const { action, path, recursive } = req.body;

        if (!action || !path) {
            return res.status(400).json({
                error: 'Missing action or path'
            });
        }

        // TODO: Implement watcher configuration update
        // This would communicate with the Python backend to update watchers

        res.json({
            success: true,
            message: `Watcher configuration update: ${action}`,
            path,
            recursive
        });

    } catch (error) {
        console.error('Error updating watcher:', error);
        res.status(500).json({
            error: 'Failed to update watcher',
            message: error.message
        });
    }
});

// =============================================================================
// REPORTS
// =============================================================================

/**
 * GET /reports/list
 * List available reports
 */
app.get('/reports/list', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const format = req.query.format || 'json';

        // TODO: Implement report listing
        // This would read from the reports directory

        res.json({
            success: true,
            reports: [],
            count: 0,
            limit,
            format
        });

    } catch (error) {
        console.error('Error listing reports:', error);
        res.status(500).json({
            error: 'Failed to list reports',
            message: error.message
        });
    }
});

/**
 * GET /reports/:id
 * Get specific report
 */
app.get('/reports/:id', (req, res) => {
    try {
        const reportId = req.params.id;
        const format = req.query.format || 'json';

        // TODO: Implement report retrieval
        // This would read the specific report file

        res.json({
            success: true,
            report_id: reportId,
            format,
            data: null
        });

    } catch (error) {
        console.error('Error retrieving report:', error);
        res.status(500).json({
            error: 'Failed to retrieve report',
            message: error.message
        });
    }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// =============================================================================
// START SERVER
// =============================================================================

const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🟣 Sentinelle MCP Server');
    console.log('='.repeat(60));
    console.log(`Server: ${config.server.name} v${config.server.version}`);
    console.log(`Listening: http://${HOST}:${PORT}`);
    console.log(`AI Backend: ${config.ai.backend}`);
    console.log(`Notifications: ${config.notifications.notify_raphael ? 'Enabled' : 'Disabled'}`);
    console.log('='.repeat(60) + '\n');
    console.log('Available endpoints:');
    console.log('  GET  /health/sentinelle');
    console.log('  GET  /status');
    console.log('  POST /notify/event');
    console.log('  POST /alert/raphael');
    console.log('  POST /ai/analyze');
    console.log('  PUT  /watcher/update');
    console.log('  GET  /reports/list');
    console.log('  GET  /reports/:id');
    console.log('\nPress Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down Sentinelle MCP Server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Shutting down Sentinelle MCP Server...');
    process.exit(0);
});
