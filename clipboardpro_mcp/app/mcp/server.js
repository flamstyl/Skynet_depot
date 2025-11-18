#!/usr/bin/env node

/**
 * ClipboardPro MCP Server
 * Skynet Clipboard Intelligence - MCP Integration
 *
 * Provides:
 * - Multi-device clipboard synchronization
 * - OCR text extraction from images
 * - AI-powered text transformations
 */

const express = require('express');
const cors = require('cors');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const config = require('./config.mcp.json');
const syncTools = require('./tools/sync');
const ocrTools = require('./tools/ocr');
const aiTools = require('./tools/ai_bridge');

// Express app for HTTP endpoints
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// In-memory storage for sync data
const syncStorage = new Map();

// API Key authentication middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  // TODO: Implement proper API key validation
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  next();
};

// ============================================
// HTTP ROUTES (Express)
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'clipboardpro-mcp',
    version: config.version,
    uptime: process.uptime()
  });
});

// Sync endpoints
app.post('/sync/push', authenticate, async (req, res) => {
  try {
    const { device_id, entry } = req.body;
    const result = await syncTools.pushClipboard(device_id, entry, syncStorage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/sync/pull', authenticate, async (req, res) => {
  try {
    const { device_id, since } = req.query;
    const result = await syncTools.pullClipboard(device_id, since, syncStorage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OCR endpoint
app.post('/ocr', authenticate, async (req, res) => {
  try {
    const { image, language } = req.body;
    const result = await ocrTools.extractText(image, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI endpoints
app.post('/ai/rewrite', authenticate, async (req, res) => {
  try {
    const { text, style } = req.body;
    const result = await aiTools.rewrite(text, style);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/ai/translate', authenticate, async (req, res) => {
  try {
    const { text, target_language, source_language } = req.body;
    const result = await aiTools.translate(text, target_language, source_language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/ai/summarize', authenticate, async (req, res) => {
  try {
    const { text, length } = req.body;
    const result = await aiTools.summarize(text, length);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/ai/clean', authenticate, async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await aiTools.clean(text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MCP SERVER (STDIO Transport)
// ============================================

const mcpServer = new Server(
  {
    name: config.name,
    version: config.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: config.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

// Handle tool calls
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'sync_push':
        result = await syncTools.pushClipboard(args.device_id, args.entry, syncStorage);
        break;

      case 'sync_pull':
        result = await syncTools.pullClipboard(args.device_id, args.since, syncStorage);
        break;

      case 'ocr_extract':
        result = await ocrTools.extractText(args.image, args.language);
        break;

      case 'ai_rewrite':
        result = await aiTools.rewrite(args.text, args.style);
        break;

      case 'ai_translate':
        result = await aiTools.translate(args.text, args.target_language, args.source_language);
        break;

      case 'ai_summarize':
        result = await aiTools.summarize(args.text, args.length);
        break;

      case 'ai_clean':
        result = await aiTools.clean(args.text, args.options);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// ============================================
// STARTUP
// ============================================

async function startServer() {
  // Determine mode: HTTP or MCP (stdio)
  const mode = process.env.MCP_MODE || 'http';

  if (mode === 'stdio') {
    // MCP mode: use stdio transport
    console.error('Starting ClipboardPro MCP Server (stdio mode)...');
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error('MCP Server connected via stdio');
  } else {
    // HTTP mode: start Express server
    const port = config.server.port || 3002;
    app.listen(port, () => {
      console.log(`ClipboardPro MCP Server running on http://localhost:${port}`);
      console.log(`Mode: HTTP`);
      console.log(`Version: ${config.version}`);
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('\nShutting down ClipboardPro MCP Server...');
  await mcpServer.close();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = { app, mcpServer };
