import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from './lib/logger.js';
import { formatError } from './lib/errors.js';
import { GoogleDriveClient } from './lib/drive-client.js';
import { Embedder } from './lib/embedder.js';
import { EmbeddingCache } from './lib/cache.js';
import { RagEngine } from './lib/rag.js';
import * as tools from './tools/index.js';
import * as schemas from './schemas/drive.js';

export class DriveMemoryMcpServer {
  private server: Server;
  private driveClient: GoogleDriveClient;
  private embedder: Embedder;
  private cache: EmbeddingCache;
  private ragEngine: RagEngine;

  constructor() {
    this.server = new Server(
      {
        name: 'skynet-drive-memory-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.driveClient = new GoogleDriveClient();
    this.embedder = new Embedder();
    this.cache = new EmbeddingCache();
    this.ragEngine = new RagEngine(this.driveClient, this.embedder, this.cache);

    this.setupHandlers();
  }

  async initialize() {
    logger.info('Initializing Drive Memory MCP Server...');

    await this.driveClient.initialize();
    await this.embedder.initialize();
    await this.cache.initialize();

    logger.info('Drive Memory MCP Server initialized');
  }

  private setupHandlers() {
    // Liste des tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolsList: Tool[] = [
        {
          name: 'list_files',
          description: 'Liste les fichiers stockés sur Google Drive',
          inputSchema: {
            type: 'object',
            properties: schemas.ListFilesSchema.shape,
          },
        },
        {
          name: 'read_memory',
          description: 'Lit le contenu de fichiers depuis Google Drive (mémoire persistante)',
          inputSchema: {
            type: 'object',
            properties: schemas.ReadMemorySchema.shape,
            required: ['path'],
          },
        },
        {
          name: 'write_memory',
          description: 'Écrit du contenu dans Google Drive (mémoire persistante)',
          inputSchema: {
            type: 'object',
            properties: schemas.WriteMemorySchema.shape,
            required: ['path', 'content'],
          },
        },
        {
          name: 'query_rag',
          description: 'Effectue une recherche sémantique (RAG) dans les fichiers Google Drive',
          inputSchema: {
            type: 'object',
            properties: schemas.QueryRagSchema.shape,
            required: ['query'],
          },
        },
      ];

      return { tools: toolsList };
    });

    // Exécution des tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info('Tool called', { name, args });

      try {
        let result: any;

        switch (name) {
          case 'list_files':
            result = await tools.listFiles(this.driveClient, args);
            break;

          case 'read_memory':
            result = await tools.readMemory(this.driveClient, args);
            break;

          case 'write_memory':
            result = await tools.writeMemory(this.driveClient, args);
            break;

          case 'query_rag':
            result = await tools.queryRag(this.ragEngine, args);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Tool execution failed', { name, error });

        const formattedError = formatError(error);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formattedError, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('Skynet Drive Memory MCP Server started');
  }
}
