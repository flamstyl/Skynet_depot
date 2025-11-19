#!/usr/bin/env node

/**
 * Grok CLI MCP Server
 * Exposes Grok CLI tools via Model Context Protocol
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration
const configPath = join(__dirname, "config.mcp.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));

// API client for Grok CLI backend
const API_BASE = process.env.GROK_API_URL || config.api.endpoint;
const api = axios.create({
  baseURL: API_BASE,
  timeout: config.api.timeout,
});

// Create MCP server
const server = new Server(
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

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: config.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

/**
 * Execute tool
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "analyze_project":
        return await analyzeProject(args);

      case "execute_command":
        return await executeCommand(args);

      case "generate_code":
        return await generateCode(args);

      case "fix_code":
        return await fixCode(args);

      case "run_tests":
        return await runTests(args);

      case "search_memory":
        return await searchMemory(args);

      case "search_project":
        return await searchProject(args);

      case "get_diagnostics":
        return await getDiagnostics(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Tool implementations - Call Grok CLI REST API
 */

async function analyzeProject(args) {
  const response = await api.post("/analyze", {
    project_path: args.project_path || process.cwd(),
  });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response.data, null, 2),
      },
    ],
  };
}

async function executeCommand(args) {
  const response = await api.post("/execute", {
    command: args.command,
    use_sandbox: args.use_sandbox !== false,
    working_dir: args.working_dir,
  });

  return {
    content: [
      {
        type: "text",
        text: `Exit code: ${response.data.returncode}\n\nOutput:\n${response.data.stdout}\n\nErrors:\n${response.data.stderr}`,
      },
    ],
  };
}

async function generateCode(args) {
  const response = await api.post("/generate", {
    description: args.description,
    language: args.language || "python",
    context: args.context,
  });

  return {
    content: [
      {
        type: "text",
        text: `\`\`\`${response.data.language}\n${response.data.code}\n\`\`\`\n\n**Explanation:**\n${response.data.explanation}`,
      },
    ],
  };
}

async function fixCode(args) {
  const response = await api.post("/fix", {
    code: args.code,
    error: args.error,
    language: args.language || "python",
  });

  return {
    content: [
      {
        type: "text",
        text: `\`\`\`${response.data.language}\n${response.data.code}\n\`\`\`\n\n**Explanation:**\n${response.data.explanation}`,
      },
    ],
  };
}

async function runTests(args) {
  const response = await api.post("/test", {
    project_path: args.project_path || process.cwd(),
  });

  const results = response.data;
  let output = "# Test Results\n\n";

  for (const result of results) {
    output += `## ${result.test_suite}\n`;
    output += `- Total: ${result.total}\n`;
    output += `- ✓ Passed: ${result.passed}\n`;
    output += `- ✗ Failed: ${result.failed}\n`;
    output += `- ○ Skipped: ${result.skipped}\n`;
    output += `- Duration: ${result.duration}s\n\n`;

    if (result.failures && result.failures.length > 0) {
      output += "### Failures:\n";
      for (const failure of result.failures) {
        output += `- **${failure.test}**: ${failure.error}\n`;
      }
      output += "\n";
    }
  }

  return {
    content: [
      {
        type: "text",
        text: output,
      },
    ],
  };
}

async function searchMemory(args) {
  const response = await api.post("/memory/search", {
    query: args.query,
    category: args.category,
  });

  const results = response.data;
  let output = `# Memory Search Results for: "${args.query}"\n\n`;
  output += `Found ${results.length} results\n\n`;

  for (const result of results) {
    output += `## ${result.key}\n`;
    output += `- Category: ${result.category}\n`;
    output += `- Timestamp: ${result.timestamp}\n`;
    output += `- Value: ${JSON.stringify(result.value).substring(0, 200)}\n\n`;
  }

  return {
    content: [
      {
        type: "text",
        text: output,
      },
    ],
  };
}

async function searchProject(args) {
  const response = await api.post("/search", {
    query: args.query,
    top_k: args.top_k || 5,
  });

  const results = response.data.results;
  let output = `# Project Search Results for: "${args.query}"\n\n`;
  output += `Found ${results.length} relevant results\n\n`;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    output += `## Result ${i + 1} (relevance: ${(result.relevance * 100).toFixed(1)}%)\n`;
    output += `- File: ${result.metadata.file}\n`;
    output += `\`\`\`\n${result.content.substring(0, 300)}\n\`\`\`\n\n`;
  }

  return {
    content: [
      {
        type: "text",
        text: output,
      },
    ],
  };
}

async function getDiagnostics(args) {
  const response = await api.post("/diagnostics", {
    project_path: args.project_path || process.cwd(),
  });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response.data, null, 2),
      },
    ],
  };
}

/**
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("🟣 Grok CLI MCP Server running");
  console.error(`Version: ${config.version}`);
  console.error(`API Endpoint: ${API_BASE}`);
  console.error(`Tools: ${config.tools.length}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
