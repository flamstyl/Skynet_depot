/**
 * Workflow Generator
 * Uses Gemini to automatically generate workflows from natural language descriptions
 */

import type {
  GeminiWorkflowPlan,
  GeminiNodePlan,
  GeminiConnectionPlan,
} from '@gemini-flow/shared-types';
import { GeminiClient } from './gemini-client';

export interface NodeCatalogInfo {
  name: string;
  displayName: string;
  description: string;
  group: string[];
  properties: Array<{
    name: string;
    displayName: string;
    type: string;
    description?: string;
  }>;
}

export class WorkflowGenerator {
  private gemini: GeminiClient;
  private nodeCatalog: NodeCatalogInfo[] = [];

  constructor(apiKey: string) {
    this.gemini = new GeminiClient({ apiKey });
  }

  /**
   * Set node catalog for context
   */
  setNodeCatalog(catalog: NodeCatalogInfo[]): void {
    this.nodeCatalog = catalog;
  }

  /**
   * Generate workflow from natural language description
   */
  async generateWorkflow(description: string): Promise<GeminiWorkflowPlan> {
    const prompt = this.buildGenerationPrompt(description);

    const schema = {
      type: 'object',
      properties: {
        description: { type: 'string' },
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nodeType: { type: 'string' },
              name: { type: 'string' },
              parameters: { type: 'object' },
              credentials: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' },
            },
            required: ['nodeType', 'name', 'parameters'],
          },
        },
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
            },
            required: ['from', 'to'],
          },
        },
        reasoning: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['description', 'nodes', 'connections', 'reasoning', 'confidence'],
    };

    try {
      const plan = await this.gemini.generateJSON<GeminiWorkflowPlan>(prompt, schema);

      // Validate plan
      this.validatePlan(plan);

      // Add positioning
      plan.nodes = this.addNodePositioning(plan.nodes);

      return plan;
    } catch (error) {
      throw new Error(
        `Workflow generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build the generation prompt
   */
  private buildGenerationPrompt(description: string): string {
    const catalogInfo = this.formatNodeCatalog();

    return `You are an expert workflow automation architect. Your task is to design a complete workflow based on the user's description.

USER DESCRIPTION:
${description}

AVAILABLE NODES:
${catalogInfo}

INSTRUCTIONS:
1. Analyze the user's requirements carefully
2. Select the appropriate nodes from the catalog
3. Configure each node with the correct parameters
4. Connect the nodes in the right order
5. Ensure the workflow is efficient and follows best practices
6. Provide clear reasoning for your design decisions

DESIGN PRINCIPLES:
- Start with a trigger node if the workflow needs to be activated by an event
- Use HTTP Request nodes for API calls
- Use transformation nodes (Code, Set, Function) for data manipulation
- Use conditional nodes (IF, Switch) for branching logic
- End with action nodes (notifications, database writes, etc.)
- Keep it simple and maintainable
- Add error handling where appropriate

RESPONSE FORMAT:
Return a JSON object with:
- description: A clear summary of what the workflow does
- nodes: Array of nodes with their configuration
- connections: Array defining how nodes connect (from -> to)
- reasoning: Your design rationale
- confidence: Your confidence level (0-100) in this workflow design

Each node should have:
- nodeType: The exact node type name from the catalog
- name: A descriptive name for this node instance
- parameters: All required configuration for the node
- credentials: Array of credential names needed (if any)
- notes: Brief explanation of what this node does in the workflow`;
  }

  /**
   * Format node catalog for prompt
   */
  private formatNodeCatalog(): string {
    if (this.nodeCatalog.length === 0) {
      return `
Core Nodes:
- HTTP Request: Make HTTP/HTTPS requests to any URL
- Webhook: Receive HTTP requests (trigger)
- Schedule: Run on a schedule (trigger)
- Code: Execute custom JavaScript code
- Set: Manually set data
- IF: Conditional branching
- Switch: Multi-way branching
- Merge: Combine data from multiple branches
- Filter: Filter items based on conditions
- Function: Transform data with JavaScript
- Email: Send emails
- Slack: Send Slack messages
- Discord: Send Discord messages
- GitHub: Interact with GitHub API
- Database: Query/write to databases
`;
    }

    return this.nodeCatalog
      .map(
        node => `
${node.displayName} (${node.name}):
  Description: ${node.description}
  Groups: ${node.group.join(', ')}
  Parameters: ${node.properties.map(p => `${p.name} (${p.type})`).join(', ')}
`
      )
      .join('\n');
  }

  /**
   * Validate the generated plan
   */
  private validatePlan(plan: GeminiWorkflowPlan): void {
    if (!plan.nodes || plan.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    if (!plan.connections || plan.connections.length === 0) {
      if (plan.nodes.length > 1) {
        throw new Error('Multi-node workflows must have connections');
      }
    }

    // Validate node names are unique
    const names = plan.nodes.map(n => n.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate node names: ${duplicates.join(', ')}`);
    }

    // Validate connections reference existing nodes
    const nodeNames = new Set(names);
    for (const conn of plan.connections) {
      if (!nodeNames.has(conn.from)) {
        throw new Error(`Connection references unknown node: ${conn.from}`);
      }
      if (!nodeNames.has(conn.to)) {
        throw new Error(`Connection references unknown node: ${conn.to}`);
      }
    }
  }

  /**
   * Add automatic positioning to nodes
   */
  private addNodePositioning(nodes: GeminiNodePlan[]): GeminiNodePlan[] {
    const SPACING_X = 300;
    const SPACING_Y = 150;

    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: 100 + (index % 3) * SPACING_X,
        y: 100 + Math.floor(index / 3) * SPACING_Y,
      },
    }));
  }

  /**
   * Refine an existing workflow based on feedback
   */
  async refineWorkflow(
    currentPlan: GeminiWorkflowPlan,
    feedback: string
  ): Promise<GeminiWorkflowPlan> {
    const prompt = `You are refining an existing workflow based on user feedback.

CURRENT WORKFLOW:
${JSON.stringify(currentPlan, null, 2)}

USER FEEDBACK:
${feedback}

AVAILABLE NODES:
${this.formatNodeCatalog()}

INSTRUCTIONS:
1. Understand the user's feedback
2. Modify the workflow accordingly
3. Keep existing nodes if they're still relevant
4. Add, remove, or reconfigure nodes as needed
5. Update connections to reflect changes
6. Explain your changes in the reasoning

Return the complete refined workflow in the same JSON format.`;

    const schema = {
      type: 'object',
      properties: {
        description: { type: 'string' },
        nodes: { type: 'array' },
        connections: { type: 'array' },
        reasoning: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['description', 'nodes', 'connections', 'reasoning', 'confidence'],
    };

    const refinedPlan = await this.gemini.generateJSON<GeminiWorkflowPlan>(prompt, schema);
    this.validatePlan(refinedPlan);

    return refinedPlan;
  }
}
