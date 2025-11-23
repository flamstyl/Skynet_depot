#!/usr/bin/env node

/**
 * Gemini Flow Orchestrator - MCP Server
 * Model Context Protocol Server (Specification 2025-06-18)
 *
 * Provides AI-powered workflow automation via MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { WorkflowGenerator, WorkflowAnalyzer, AutoFixer } from '@gemini-flow/gemini-agent';
import { nodeRegistry } from '@gemini-flow/node-registry';
import { httpClient, scraper } from '@gemini-flow/internet-tools';
import { credentialManager } from '@gemini-flow/security';

import type {
  Workflow,
  WorkflowNode,
  NodeConnection,
  WorkflowExecution,
  GeminiWorkflowPlan,
} from '@gemini-flow/shared-types';

/**
 * In-memory storage (in production, use PostgreSQL)
 */
class WorkflowStore {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();

  createWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  updateWorkflow(id: string, updates: Partial<Workflow>): void {
    const workflow = this.workflows.get(id);
    if (workflow) {
      this.workflows.set(id, { ...workflow, ...updates, updatedAt: new Date() });
    }
  }

  deleteWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  createExecution(execution: WorkflowExecution): void {
    this.executions.set(execution.id, execution);
  }

  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  listExecutions(workflowId?: string): WorkflowExecution[] {
    const executions = Array.from(this.executions.values());
    return workflowId ? executions.filter(e => e.workflowId === workflowId) : executions;
  }
}

const store = new WorkflowStore();

/**
 * Initialize Gemini API
 */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.error('⚠️  GEMINI_API_KEY not set. AI features will not work.');
  console.error('Set it with: export GEMINI_API_KEY=your_api_key');
}

const workflowGenerator = new WorkflowGenerator(GEMINI_API_KEY);
const workflowAnalyzer = new WorkflowAnalyzer(GEMINI_API_KEY);
const autoFixer = new AutoFixer(GEMINI_API_KEY);

// Set node catalog for generator
workflowGenerator.setNodeCatalog(
  nodeRegistry.list().map(node => ({
    name: node.name,
    displayName: node.displayName,
    description: node.description,
    group: node.group as string[],
    properties: node.properties.map(p => ({
      name: p.name,
      displayName: p.displayName,
      type: p.type,
      description: p.description,
    })),
  }))
);

/**
 * MCP Server
 */
const server = new Server(
  {
    name: 'gemini-flow-orchestrator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool Definitions (MCP Protocol)
 */
const tools: Tool[] = [
  {
    name: 'list_workflows',
    description: 'List all workflows in the system',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_workflow',
    description: 'Get a specific workflow by ID',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'The workflow ID',
        },
      },
      required: ['workflow_id'],
    },
  },
  {
    name: 'create_workflow_from_description',
    description:
      'Generate a complete workflow from a natural language description using Gemini AI. The AI will automatically select nodes, configure parameters, and create connections.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description:
            'Natural language description of the workflow. Example: "Send me a Slack message every day at 9am with GitHub issues assigned to me"',
        },
        name: {
          type: 'string',
          description: 'Workflow name (optional, will be generated if not provided)',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'validate_workflow',
    description: 'Validate a workflow configuration and identify potential issues',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'The workflow ID to validate',
        },
      },
      required: ['workflow_id'],
    },
  },
  {
    name: 'refine_workflow',
    description: 'Refine an existing workflow based on user feedback using Gemini AI',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'The workflow ID to refine',
        },
        feedback: {
          type: 'string',
          description:
            'User feedback describing what to change. Example: "Add error handling" or "Send email instead of Slack"',
        },
      },
      required: ['workflow_id', 'feedback'],
    },
  },
  {
    name: 'analyze_workflow_execution',
    description: 'Analyze a failed workflow execution and get AI-powered suggestions',
    inputSchema: {
      type: 'object',
      properties: {
        execution_id: {
          type: 'string',
          description: 'The execution ID to analyze',
        },
      },
      required: ['execution_id'],
    },
  },
  {
    name: 'auto_fix_workflow',
    description: 'Automatically fix workflow issues identified by analysis',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'The workflow ID to fix',
        },
        execution_id: {
          type: 'string',
          description: 'The failed execution ID to analyze',
        },
      },
      required: ['workflow_id', 'execution_id'],
    },
  },
  {
    name: 'list_nodes_catalog',
    description: 'List all available node types in the catalog',
    inputSchema: {
      type: 'object',
      properties: {
        group: {
          type: 'string',
          description:
            'Filter by node group: trigger, action, transform, core, ai, communication, database, file, productivity',
        },
        search: {
          type: 'string',
          description: 'Search query to filter nodes',
        },
      },
    },
  },
  {
    name: 'get_node_details',
    description: 'Get detailed information about a specific node type',
    inputSchema: {
      type: 'object',
      properties: {
        node_type: {
          type: 'string',
          description: 'The node type name (e.g., "httpRequest", "webhook")',
        },
      },
      required: ['node_type'],
    },
  },
  {
    name: 'http_request',
    description: 'Make an HTTP request to any URL with SSRF protection',
    inputSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          description: 'HTTP method',
        },
        url: {
          type: 'string',
          description: 'Target URL (validated against SSRF)',
        },
        headers: {
          type: 'object',
          description: 'Request headers',
        },
        body: {
          type: 'object',
          description: 'Request body (for POST, PUT, PATCH)',
        },
      },
      required: ['method', 'url'],
    },
  },
  {
    name: 'scrape_webpage',
    description: 'Scrape data from a webpage with SSRF protection',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to scrape',
        },
        selector: {
          type: 'string',
          description: 'CSS selector to extract data (optional)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'delete_workflow',
    description: 'Delete a workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'The workflow ID to delete',
        },
      },
      required: ['workflow_id'],
    },
  },
];

/**
 * List Tools Handler
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

/**
 * Call Tool Handler
 */
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    // Ensure args is defined (required by MCP protocol)
    if (!args) {
      throw new Error('Arguments are required');
    }

    switch (name) {
      case 'list_workflows': {
        const workflows = store.listWorkflows();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  count: workflows.length,
                  workflows: workflows.map(w => ({
                    id: w.id,
                    name: w.name,
                    description: w.description,
                    active: w.active,
                    nodeCount: w.nodes.length,
                    createdAt: w.createdAt,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_workflow': {
        const workflow = store.getWorkflow(args.workflow_id as string);
        if (!workflow) {
          throw new Error('Workflow not found');
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(workflow, null, 2) }],
        };
      }

      case 'create_workflow_from_description': {
        const description = args.description as string;
        const name = (args.name as string) || 'AI Generated Workflow';

        // Generate workflow using Gemini
        const plan: GeminiWorkflowPlan = await workflowGenerator.generateWorkflow(description);

        // Convert plan to workflow
        const workflow: Workflow = {
          id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          description: plan.description,
          nodes: plan.nodes.map((nodePlan, index) => ({
            id: `node_${index}`,
            name: nodePlan.name,
            type: nodePlan.nodeType,
            position: nodePlan.position || { x: 100, y: 100 },
            parameters: nodePlan.parameters,
            notes: nodePlan.notes,
          })) as WorkflowNode[],
          connections: plan.connections.map(conn => {
            const sourceNode = plan.nodes.findIndex(n => n.name === conn.from);
            const targetNode = plan.nodes.findIndex(n => n.name === conn.to);
            return {
              source: `node_${sourceNode}`,
              sourceOutput: conn.output || 'main',
              target: `node_${targetNode}`,
              targetInput: conn.input || 'main',
            } as NodeConnection;
          }),
          settings: {},
          active: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        store.createWorkflow(workflow);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  workflow_id: workflow.id,
                  workflow,
                  ai_analysis: {
                    reasoning: plan.reasoning,
                    confidence: plan.confidence,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'validate_workflow': {
        const workflow = store.getWorkflow(args.workflow_id as string);
        if (!workflow) {
          throw new Error('Workflow not found');
        }

        const analysis = await workflowAnalyzer.validateWorkflow(workflow);

        return {
          content: [{ type: 'text', text: JSON.stringify(analysis, null, 2) }],
        };
      }

      case 'refine_workflow': {
        const workflow = store.getWorkflow(args.workflow_id as string);
        if (!workflow) {
          throw new Error('Workflow not found');
        }

        // Convert workflow to plan format
        const currentPlan: GeminiWorkflowPlan = {
          description: workflow.description || '',
          nodes: workflow.nodes.map(node => ({
            nodeType: node.type,
            name: node.name,
            parameters: node.parameters,
            position: node.position,
          })),
          connections: workflow.connections.map(conn => ({
            from: workflow.nodes.find(n => n.id === conn.source)?.name || '',
            to: workflow.nodes.find(n => n.id === conn.target)?.name || '',
          })),
          reasoning: '',
          confidence: 100,
        };

        const refinedPlan = await workflowGenerator.refineWorkflow(
          currentPlan,
          args.feedback as string
        );

        // Update workflow
        const updatedWorkflow: Workflow = {
          ...workflow,
          description: refinedPlan.description,
          nodes: refinedPlan.nodes.map((nodePlan, index) => ({
            id: `node_${index}`,
            name: nodePlan.name,
            type: nodePlan.nodeType,
            position: nodePlan.position || { x: 100, y: 100 },
            parameters: nodePlan.parameters,
            notes: nodePlan.notes,
          })) as WorkflowNode[],
          connections: refinedPlan.connections.map(conn => {
            const sourceNode = refinedPlan.nodes.findIndex(n => n.name === conn.from);
            const targetNode = refinedPlan.nodes.findIndex(n => n.name === conn.to);
            return {
              source: `node_${sourceNode}`,
              sourceOutput: 'main',
              target: `node_${targetNode}`,
              targetInput: 'main',
            } as NodeConnection;
          }),
          updatedAt: new Date(),
        };

        store.updateWorkflow(workflow.id, updatedWorkflow);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  workflow: updatedWorkflow,
                  ai_reasoning: refinedPlan.reasoning,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'list_nodes_catalog': {
        let nodes = nodeRegistry.list();

        if (args.group) {
          nodes = nodeRegistry.listByGroup(args.group as string);
        }

        if (args.search) {
          nodes = nodeRegistry.search(args.search as string);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  count: nodes.length,
                  nodes: nodes.map(n => ({
                    name: n.name,
                    displayName: n.displayName,
                    description: n.description,
                    group: n.group,
                    icon: n.icon,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_node_details': {
        const node = nodeRegistry.get(args.node_type as string);
        if (!node) {
          throw new Error('Node type not found');
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(node, null, 2) }],
        };
      }

      case 'http_request': {
        const response = await httpClient.request({
          method: args.method as any,
          url: args.url as string,
          headers: args.headers as any,
          body: args.body,
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      }

      case 'scrape_webpage': {
        const result = await scraper.scrape({
          url: args.url as string,
          selector: args.selector as string | undefined,
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'delete_workflow': {
        const deleted = store.deleteWorkflow(args.workflow_id as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: deleted }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start Server
 */
async function main() {
  console.error('🚀 Gemini Flow Orchestrator MCP Server starting...');
  console.error('📋 Protocol: MCP Specification 2025-06-18');
  console.error(`🤖 AI Engine: Google Gemini ${GEMINI_API_KEY ? '✅' : '❌'}`);
  console.error(`🔧 Available Nodes: ${nodeRegistry.count()}`);
  console.error(`🛠️  Available Tools: ${tools.length}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('✅ Server ready!');
}

main().catch(error => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
