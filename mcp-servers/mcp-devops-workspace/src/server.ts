/**
 * Configuration et enregistrement des tools MCP
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { logger } from "./utils/logger.js";

// Import des tools
import { createProjectTool } from "./tools/dev-env/create-project.js";
import { listContainersTool } from "./tools/docker/list-containers.js";
import { gitStatusTool } from "./tools/project/git-status.js";
import { getResourceUsageTool } from "./tools/system/get-resource-usage.js";

// Liste de tous les tools disponibles
const tools = [
  createProjectTool,
  listContainersTool,
  gitStatusTool,
  getResourceUsageTool,
  // NOTE: Ajouter ici les autres tools quand ils seront implémentés
  // setupPythonEnvTool,
  // containerLogsTool,
  // gitCommitTool,
  // etc.
];

export class MCPDevOpsServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "mcp-devops-workspace",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Handler pour lister les tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug("Listing available tools");

      return {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema.shape,
        })),
      };
    });

    // Handler pour appeler un tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info(`Tool called: ${name}`);
      logger.debug(`Tool arguments:`, args);

      // Trouver le tool
      const tool = tools.find((t) => t.name === name);

      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        // Exécuter le handler du tool
        const result = await tool.handler(args);

        logger.debug(`Tool ${name} succeeded`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        logger.error(`Tool ${name} failed:`, error);

        // Retourner une erreur structurée
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: error.name || "Error",
                  message: error.message,
                  details: error.details || null,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    logger.info("Starting MCP DevOps Workspace Server...");

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info(`MCP DevOps Workspace Server started with ${tools.length} tools`);
    logger.info(`Available tools: ${tools.map((t) => t.name).join(", ")}`);
  }

  async stop() {
    logger.info("Stopping MCP DevOps Workspace Server...");
    await this.server.close();
  }
}
