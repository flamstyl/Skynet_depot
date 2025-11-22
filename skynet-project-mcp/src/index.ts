#!/usr/bin/env node
/**
 * 📁 Skynet Project MCP Server
 * Git workflow avancé & Project scaffolding
 *
 * @author Skynet Depot
 * @version 1.0.0
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
import * as GitTools from './tools/git-tools.js';

const server = new Server(
  { name: 'skynet-project', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const tools = [
  { name: 'git_init', description: '🔧 Initialiser un dépôt Git', inputSchema: GitTools.gitInitSchema, handler: GitTools.gitInit },
  { name: 'git_status', description: '📊 Status du dépôt', inputSchema: GitTools.gitStatusSchema, handler: GitTools.gitStatus },
  { name: 'git_add', description: '➕ Ajouter des fichiers', inputSchema: GitTools.gitAddSchema, handler: GitTools.gitAdd },
  { name: 'git_commit', description: '💾 Créer un commit', inputSchema: GitTools.gitCommitSchema, handler: GitTools.gitCommit },
  { name: 'git_branch_list', description: '📋 Lister les branches', inputSchema: GitTools.gitBranchListSchema, handler: GitTools.gitBranchList },
  { name: 'git_branch_create', description: '🌿 Créer une branche', inputSchema: GitTools.gitBranchCreateSchema, handler: GitTools.gitBranchCreate },
  { name: 'git_checkout', description: '🔀 Changer de branche', inputSchema: GitTools.gitCheckoutSchema, handler: GitTools.gitCheckout },
  { name: 'git_merge', description: '🔗 Merger une branche', inputSchema: GitTools.gitMergeSchema, handler: GitTools.gitMerge },
  { name: 'git_pull', description: '⬇️  Pull depuis remote', inputSchema: GitTools.gitPullSchema, handler: GitTools.gitPull },
  { name: 'git_push', description: '⬆️  Push vers remote', inputSchema: GitTools.gitPushSchema, handler: GitTools.gitPush },
  { name: 'git_add_remote', description: '🌐 Ajouter un remote', inputSchema: GitTools.gitAddRemoteSchema, handler: GitTools.gitAddRemote },
  { name: 'git_log', description: '📜 Historique des commits', inputSchema: GitTools.gitLogSchema, handler: GitTools.gitLog },
  { name: 'git_diff', description: '🔍 Voir les différences', inputSchema: GitTools.gitDiffSchema, handler: GitTools.gitDiff },
  { name: 'git_stash', description: '📦 Stash des modifications', inputSchema: GitTools.gitStashSchema, handler: GitTools.gitStash },
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
  if (!tool) throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${request.params.name}`);

  try {
    const validatedArgs = tool.inputSchema.parse(request.params.arguments);
    const result = await tool.handler(validatedArgs as any);
    return { content: [{ type: 'text', text: result }] };
  } catch (error: any) {
    throw new McpError(ErrorCode.InternalError, error.message);
  }
});

async function main() {
  console.error('📁 Skynet Project MCP Server');
  console.error(`🛠️  ${tools.length} Git tools available`);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ Server ready\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
