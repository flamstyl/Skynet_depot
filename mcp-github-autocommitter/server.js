#!/usr/bin/env node

/**
 * 🚀 MCP GitHub Auto-Committer Server
 * Agent Git autonome pour scan, diff, changelog, commit et push automatique
 * Version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

// Core modules
import { GitManager } from './core/git_manager.js';
import { SecurityChecker } from './core/security_checker.js';
import { DiffAnalyzer } from './core/diff_analyzer.js';
import { ChangelogGenerator } from './core/changelog_generator.js';
import { CommitMessageAI } from './core/commit_message_ai.js';
import { RetryEngine } from './core/retry_engine.js';

// Utils
import { Logger, logger } from './utils/logger.js';

// Tools
import { scan_repository } from './tools/scan_repository.js';
import { generate_diff_summary } from './tools/generate_diff_summary.js';
import { generate_changelog } from './tools/generate_changelog.js';
import { stage_changes } from './tools/stage_changes.js';
import { auto_commit } from './tools/auto_commit.js';
import { auto_push } from './tools/auto_push.js';
import { sync_pull } from './tools/sync_pull.js';
import { get_repo_status } from './tools/get_repo_status.js';
import { rollback_last_commit } from './tools/rollback_last_commit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MCP GitHub Auto-Committer Server
 */
class GitHubAutoCommitterServer {
  constructor() {
    this.config = null;
    this.gitManager = null;
    this.securityChecker = null;
    this.diffAnalyzer = null;
    this.changelogGenerator = null;
    this.commitMessageAI = null;
    this.retryEngine = null;

    this.tools = [
      scan_repository,
      generate_diff_summary,
      generate_changelog,
      stage_changes,
      auto_commit,
      auto_push,
      sync_pull,
      get_repo_status,
      rollback_last_commit,
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
      console.error('[GitHubAutoCommitter] Configuration loaded');
    } catch (error) {
      console.error('[GitHubAutoCommitter] Failed to load config, using defaults:', error.message);
      this.config = {
        server: { mode: 'stdio' },
        git: { defaultRemote: 'origin', author: { name: 'Claude AI', email: 'ai@skynet.local' } },
        security: { scanForSecrets: true },
        push: { retry: { enabled: true } },
      };
    }
  }

  /**
   * Initialise tous les gestionnaires
   */
  async initialize() {
    await this.loadConfig();

    console.error('[GitHubAutoCommitter] Initializing managers...');

    this.gitManager = new GitManager(this.config);
    this.securityChecker = new SecurityChecker(this.config.security);
    this.diffAnalyzer = new DiffAnalyzer(this.config);
    this.changelogGenerator = new ChangelogGenerator(this.config.changelog);
    this.commitMessageAI = new CommitMessageAI(this.config.commit);
    this.retryEngine = new RetryEngine(this.config.push);

    console.error('[GitHubAutoCommitter] ✅ All managers initialized');
    console.error('[GitHubAutoCommitter] 🚀 GitHub Auto-Committer MCP Server ready');
    console.error(`[GitHubAutoCommitter] 📦 ${this.tools.length} tools available`);
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

    console.error(`[GitHubAutoCommitter] 🔧 Calling tool: ${name}`);

    // Trouver l'outil
    const tool = this.tools.find(t => t.name === name);
    if (!tool) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: `Tool ${name} not found`,
            available_tools: this.tools.map(t => t.name),
          }, null, 2),
        }],
        isError: true,
      };
    }

    // Contexte pour les outils
    const context = {
      config: this.config,
      gitManager: this.gitManager,
      securityChecker: this.securityChecker,
      diffAnalyzer: this.diffAnalyzer,
      changelogGenerator: this.changelogGenerator,
      commitMessageAI: this.commitMessageAI,
      retryEngine: this.retryEngine,
      logger: logger,
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
      console.error(`[GitHubAutoCommitter] ❌ Tool execution error:`, error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack,
          }, null, 2),
        }],
        isError: true,
      };
    }
  }

  /**
   * Gestionnaire de messages JSON-RPC
   */
  async handleMessage(message) {
    const { method, id } = message;

    try {
      let result;

      switch (method) {
        case 'initialize':
          result = {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'github-autocommitter',
              version: '1.0.0',
            },
          };
          break;

        case 'tools/list':
          result = await this.handleListTools();
          break;

        case 'tools/call':
          return await this.handleCallTool(message);

        default:
          throw new Error(`Unknown method: ${method}`);
      }

      return {
        jsonrpc: '2.0',
        id,
        result,
      };

    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error.message,
        },
      };
    }
  }

  /**
   * Lance le serveur en mode STDIO (standard pour MCP)
   */
  async start() {
    console.error('[GitHubAutoCommitter] Starting in STDIO mode...');

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on('line', async (line) => {
      try {
        const message = JSON.parse(line);
        const response = await this.handleMessage(message);
        console.log(JSON.stringify(response));
      } catch (error) {
        console.error('[GitHubAutoCommitter] Error processing message:', error);
        const errorResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error',
          },
        };
        console.log(JSON.stringify(errorResponse));
      }
    });

    rl.on('close', () => {
      console.error('[GitHubAutoCommitter] STDIO closed, shutting down...');
      process.exit(0);
    });
  }
}

/**
 * Point d'entrée
 */
async function main() {
  const server = new GitHubAutoCommitterServer();
  await server.initialize();
  await server.start();
}

main().catch(error => {
  console.error('[GitHubAutoCommitter] Fatal error:', error);
  process.exit(1);
});
