/**
 * Serveur MCP principal - Skynet Workspace (version simplifiée)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { createLogger } from './utils/logger.js';

// Import des modules
import { devEnvTools } from './dev_env/index.js';
import { dockerAdminTools } from './docker_admin/index.js';
import { serverAdminTools } from './server_admin/index.js';
import { projectOpsTools } from './project_ops/index.js';
import { graphicsTools } from './graphics_tools/index.js';

const logger = createLogger('MCPServer');

const SERVER_CONFIG = {
  name: 'skynet-mcp-workspace',
  version: '1.0.0'
};

const ALL_TOOLS: Record<string, any> = {
  ...devEnvTools,
  ...dockerAdminTools,
  ...serverAdminTools,
  ...projectOpsTools,
  ...graphicsTools
};

class SkynetMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(SERVER_CONFIG, {
      capabilities: { tools: {} }
    });

    this.setupHandlers();
    this.setupErrorHandling();

    logger.info('Serveur MCP Skynet initialisé');
  }

  private setupHandlers(): void {
    // Handler: list_tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Requête list_tools reçue');

      const tools = Object.entries(ALL_TOOLS).map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: {
          type: 'object' as const,
          properties: {},
          required: []
        }
      }));

      logger.info(`${tools.length} tools disponibles`);

      return { tools };
    });

    // Handler: call_tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info(`Appel tool: ${name}`);

      const tool = ALL_TOOLS[name];

      if (!tool) {
        logger.error(`Tool non trouvé: ${name}`);
        return {
          content: [{
            type: 'text' as const,
            text: `❌ Tool inconnu: ${name}`
          }],
          isError: true
        };
      }

      try {
        const validatedArgs = tool.inputSchema.parse(args || {});
        const startTime = Date.now();
        const result = await tool.handler(validatedArgs);
        const duration = Date.now() - startTime;

        logger.success(`Tool ${name} exécuté en ${duration}ms`);

        return result;

      } catch (error: any) {
        logger.error(`Erreur lors de l'exécution de ${name}`, error);

        return {
          content: [{
            type: 'text' as const,
            text: `❌ Erreur: ${error.message}`
          }],
          isError: true
        };
      }
    });

    logger.info('Handlers MCP configurés');
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      logger.error('Erreur serveur MCP', error);
    };

    process.on('SIGINT', async () => {
      logger.info('Signal SIGINT reçu, arrêt du serveur...');
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Signal SIGTERM reçu, arrêt du serveur...');
      await this.server.close();
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();

    logger.info('Démarrage du serveur MCP Skynet...');
    logger.info(`Nombre de tools: ${Object.keys(ALL_TOOLS).length}`);

    await this.server.connect(transport);

    logger.success('✅ Serveur MCP Skynet démarré et prêt!');
  }
}

export async function startMCPServer(): Promise<void> {
  const server = new SkynetMCPServer();
  await server.start();
}
