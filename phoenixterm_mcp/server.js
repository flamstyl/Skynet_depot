#!/usr/bin/env node

/**
 * 🔥 PhoenixTerm MCP Server
 * Advanced PTY-based Terminal Server for AI Autonomy
 * Version 2.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Core modules
import { PTYManager } from './core/pty_manager.js';
import { SessionManager } from './core/session_manager.js';
import { SecurityManager } from './core/security_manager.js';
import { RetryEngine } from './core/retry_engine.js';
import { StreamingHandler } from './core/streaming_handler.js';

// Tools
import { executeInteractiveCommand } from './tools/execute_interactive.js';
import { getSessionState } from './tools/get_session_state.js';
import { validateCommand } from './tools/validate_command.js';
import { executeTemplate } from './tools/execute_template.js';
import { listSessions } from './tools/list_sessions.js';
import { killSession } from './tools/kill_session.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PhoenixTerm MCP Server
 */
class PhoenixTermServer {
  constructor() {
    this.config = null;
    this.ptyManager = null;
    this.sessionManager = null;
    this.securityManager = null;
    this.retryEngine = null;
    this.streamingHandler = null;

    this.tools = [
      executeInteractiveCommand,
      getSessionState,
      validateCommand,
      executeTemplate,
      listSessions,
      killSession,
    ];
  }

  /**
   * Charge la configuration
   */
  async loadConfig() {
    try {
      const configPath = path.join(__dirname, 'config', 'default.json');
      const data = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(data);
      console.error('[PhoenixTerm] Configuration loaded');
    } catch (error) {
      console.error('[PhoenixTerm] Failed to load config, using defaults:', error.message);
      this.config = { server: { mode: 'stdio' } };
    }
  }

  /**
   * Initialise tous les gestionnaires
   */
  async initialize() {
    await this.loadConfig();

    console.error('[PhoenixTerm] Initializing managers...');

    this.ptyManager = new PTYManager(this.config);
    this.sessionManager = new SessionManager(this.config);
    this.securityManager = new SecurityManager(this.config);
    this.retryEngine = new RetryEngine(this.config);
    this.streamingHandler = new StreamingHandler(this.config);

    console.error('[PhoenixTerm] All managers initialized');
  }

  /**
   * Gestionnaire MCP: list_tools
   */
  async handleListTools() {
    return {
      tools: this.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  }

  /**
   * Gestionnaire MCP: call_tool
   */
  async handleCallTool(request) {
    const { name, arguments: params } = request.params;

    console.error(`[PhoenixTerm] Calling tool: ${name}`);

    // Trouver l'outil
    const tool = this.tools.find(t => t.name === name);
    if (!tool) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: `Tool ${name} not found`,
          }),
        }],
        isError: true,
      };
    }

    // Contexte pour les outils
    const context = {
      ptyManager: this.ptyManager,
      sessionManager: this.sessionManager,
      securityManager: this.securityManager,
      retryEngine: this.retryEngine,
      streamingHandler: this.streamingHandler,
    };

    try {
      // Exécuter l'outil
      const result = await tool.execute(params, context);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };

    } catch (error) {
      console.error(`[PhoenixTerm] Tool execution error:`, error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack,
          }),
        }],
        isError: true,
      };
    }
  }

  /**
   * Gestionnaire MCP: initialize
   */
  async handleInitialize(request) {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'PhoenixTerm MCP',
        version: '2.0.0',
      },
    };
  }

  /**
   * Traite une requête MCP
   */
  async handleRequest(request) {
    const { method } = request;

    console.error(`[PhoenixTerm] Handling request: ${method}`);

    switch (method) {
      case 'initialize':
        return await this.handleInitialize(request);

      case 'tools/list':
        return await this.handleListTools();

      case 'tools/call':
        return await this.handleCallTool(request);

      case 'notifications/initialized':
        return {}; // Acknowledge

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  /**
   * Mode stdio (communication via stdin/stdout)
   */
  async runStdioMode() {
    console.error('[PhoenixTerm] Running in stdio mode');
    console.error('[PhoenixTerm] Ready to accept MCP requests');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on('line', async (line) => {
      try {
        const request = JSON.parse(line);

        const response = await this.handleRequest(request);

        // Répondre via stdout
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: response,
        }));

      } catch (error) {
        console.error('[PhoenixTerm] Request error:', error);

        // Erreur au format JSON-RPC
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: request?.id || null,
          error: {
            code: -32603,
            message: error.message,
          },
        }));
      }
    });

    rl.on('close', async () => {
      console.error('[PhoenixTerm] stdin closed, shutting down...');
      await this.shutdown();
      process.exit(0);
    });
  }

  /**
   * Mode WebSocket (pour support HTTP/WS)
   */
  async runWebSocketMode() {
    const { WebSocketServer } = await import('ws');
    const port = this.config.server.websocket?.port || 3740;

    const wss = new WebSocketServer({ port });

    console.error(`[PhoenixTerm] WebSocket server listening on port ${port}`);

    wss.on('connection', (ws) => {
      console.error('[PhoenixTerm] Client connected');

      ws.on('message', async (message) => {
        try {
          const request = JSON.parse(message.toString());
          const response = await this.handleRequest(request);

          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: response,
          }));

        } catch (error) {
          console.error('[PhoenixTerm] WebSocket error:', error);

          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: request?.id || null,
            error: {
              code: -32603,
              message: error.message,
            },
          }));
        }
      });

      ws.on('close', () => {
        console.error('[PhoenixTerm] Client disconnected');
      });
    });
  }

  /**
   * Démarre le serveur
   */
  async start() {
    console.error('╔═══════════════════════════════════════════════════╗');
    console.error('║  🔥 PhoenixTerm MCP Server v2.0.0                ║');
    console.error('║  Advanced PTY Terminal for AI Autonomy          ║');
    console.error('╚═══════════════════════════════════════════════════╝');

    await this.initialize();

    const mode = this.config.server?.mode || 'stdio';

    if (mode === 'stdio') {
      await this.runStdioMode();
    } else if (mode === 'websocket') {
      await this.runWebSocketMode();
    } else {
      throw new Error(`Unknown server mode: ${mode}`);
    }
  }

  /**
   * Arrête le serveur proprement
   */
  async shutdown() {
    console.error('[PhoenixTerm] Shutting down...');

    // Cleanup des gestionnaires
    if (this.ptyManager) {
      this.ptyManager.destroyAll();
    }

    if (this.sessionManager) {
      await this.sessionManager.shutdown();
    }

    if (this.streamingHandler) {
      this.streamingHandler.destroyAll();
    }

    console.error('[PhoenixTerm] Shutdown complete');
  }
}

/**
 * Gestion des signaux système
 */
function setupSignalHandlers(server) {
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

  signals.forEach(signal => {
    process.on(signal, async () => {
      console.error(`[PhoenixTerm] Received ${signal}`);
      await server.shutdown();
      process.exit(0);
    });
  });

  process.on('uncaughtException', (error) => {
    console.error('[PhoenixTerm] Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[PhoenixTerm] Unhandled rejection:', reason);
  });
}

/**
 * Point d'entrée
 */
async function main() {
  const server = new PhoenixTermServer();
  setupSignalHandlers(server);

  try {
    await server.start();
  } catch (error) {
    console.error('[PhoenixTerm] Fatal error:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
main();
