#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { logger } from './utils/logger.js';
import { config } from './config/default.js';

// Import tools
import { devEnvTools } from './tools/dev_env/index.js';
import { dockerAdminTools } from './tools/docker_admin/index.js';
import { serverAdminTools } from './tools/server_admin/index.js';
import { projectOpsTools } from './tools/project_ops/index.js';
import { graphicsTools } from './tools/graphics_tools/index.js';

/**
 * MCP Server : DevOps Workspace
 * Fournit des outils d'administration système, Docker, Git, et graphisme
 */
class DevOpsWorkspaceServer {
  private server: Server;
  private tools: Map<string, any>;

  constructor() {
    this.server = new Server(
      {
        name: 'devops-workspace',
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

  /**
   * Enregistre tous les tools MCP
   */
  private registerTools(): void {
    const allTools = [
      ...devEnvTools,
      ...dockerAdminTools,
      ...serverAdminTools,
      ...projectOpsTools,
      ...graphicsTools,
    ];

    for (const tool of allTools) {
      this.tools.set(tool.name, tool);
      logger.info(`Tool enregistré : ${tool.name}`);
    }
  }

  /**
   * Configure les handlers MCP
   */
  private setupHandlers(): void {
    // Handler : liste des tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = Array.from(this.tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      logger.info(`Liste des tools demandée (${tools.length} tools)`);
      return { tools };
    });

    // Handler : exécution d'un tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info(`Tool appelé : ${name}`, { args });

      const tool = this.tools.get(name);
      if (!tool) {
        const error = `Tool inconnu : ${name}`;
        logger.error(error);
        throw new Error(error);
      }

      try {
        const result = await tool.execute(args);
        logger.info(`Tool ${name} exécuté avec succès`);

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

  /**
   * Démarre le serveur MCP
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('🚀 DevOps Workspace MCP Server démarré');
    logger.info(`📦 ${this.tools.size} tools disponibles`);
    logger.info(`⚙️  Config : ${JSON.stringify(config, null, 2)}`);
  }
}

// Démarrage du serveur
const server = new DevOpsWorkspaceServer();
server.start().catch((error) => {
  logger.error('❌ Erreur au démarrage du serveur', { error });
  process.exit(1);
});
