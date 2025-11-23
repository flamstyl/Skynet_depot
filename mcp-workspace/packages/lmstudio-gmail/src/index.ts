#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';

import { logger } from './utils/logger.js';
import { config } from './config/default.js';
import { gmailTools } from './tools/gmail/index.js';
import { lmstudioTools } from './tools/lmstudio/index.js';

/**
 * MCP Server : LM Studio + Gmail
 * Assistant email local avec IA
 */
class LMStudioGmailServer {
  private server: Server;
  private tools: Map<string, any>;

  constructor() {
    this.server = new Server(
      {
        name: 'lmstudio-gmail',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tools = new Map();
    this.registerTools();
    this.setupHandlers();
  }

  private registerTools(): void {
    const allTools = [...gmailTools, ...lmstudioTools];

    for (const tool of allTools) {
      this.tools.set(tool.name, tool);
      logger.info(`Tool enregistré : ${tool.name}`);
    }
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = Array.from(this.tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      logger.info(`Liste des tools demandée (${tools.length} tools)`);
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info(`Tool appelé : ${name}`);

      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Tool inconnu : ${name}`);
      }

      try {
        const result = await tool.execute(args);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        logger.error(`Erreur dans tool ${name}`, { error: error.message });
        throw error;
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('📧 LM Studio Gmail MCP Server démarré');
    logger.info(`📦 ${this.tools.size} tools disponibles`);
    logger.info(`⚙️  LM Studio : ${config.lmstudioBaseUrl}`);
  }
}

const server = new LMStudioGmailServer();
server.start().catch((error) => {
  logger.error('❌ Erreur au démarrage', { error });
  process.exit(1);
});
