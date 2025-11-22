#!/usr/bin/env node
/**
 * 🎨 Skynet Creative MCP Server
 * Advanced Image Processing & Creative Tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import * as ImageTools from './tools/image-tools.js';

const server = new Server(
  { name: 'skynet-creative', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const tools = [
  { name: 'image_resize', description: '🖼️  Redimensionner une image', inputSchema: ImageTools.imageResizeSchema, handler: ImageTools.imageResize },
  { name: 'image_convert', description: '🔄 Convertir le format d\'une image', inputSchema: ImageTools.imageConvertSchema, handler: ImageTools.imageConvert },
  { name: 'image_rotate', description: '🔃 Rotation d\'image', inputSchema: ImageTools.imageRotateSchema, handler: ImageTools.imageRotate },
  { name: 'image_watermark', description: '💧 Ajouter un watermark', inputSchema: ImageTools.imageWatermarkSchema, handler: ImageTools.imageWatermark },
  { name: 'image_compose', description: '🎨 Composer deux images', inputSchema: ImageTools.imageComposeSchema, handler: ImageTools.imageCompose },
  { name: 'image_metadata', description: '📊 Extraire métadonnées', inputSchema: ImageTools.imageMetadataSchema, handler: ImageTools.imageMetadata },
  { name: 'image_optimize', description: '⚡ Optimiser pour le web', inputSchema: ImageTools.imageOptimizeSchema, handler: ImageTools.imageOptimize },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema as any) as any,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((t) => t.name === request.params.name);
  if (!tool) throw new McpError(ErrorCode.MethodNotFound, `Tool not found`);

  try {
    const validatedArgs = tool.inputSchema.parse(request.params.arguments);
    const result = await tool.handler(validatedArgs as any);
    return { content: [{ type: 'text', text: result }] };
  } catch (error: any) {
    throw new McpError(ErrorCode.InternalError, error.message);
  }
});

async function main() {
  console.error('🎨 Skynet Creative MCP Server');
  console.error(`🛠️  ${tools.length} image tools available`);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ Server ready\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
