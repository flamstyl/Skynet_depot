/**
 * Auto-Fixer
 * Automatically fixes workflow issues using Gemini
 */

import type {
  Workflow,
  GeminiAnalysisResult,
  GeminiPatch,
  WorkflowNode,
  NodeConnection,
} from '@gemini-flow/shared-types';
import { GeminiClient } from './gemini-client';

export class AutoFixer {
  private gemini: GeminiClient;

  constructor(apiKey: string) {
    this.gemini = new GeminiClient({ apiKey });
  }

  /**
   * Generate a patch to fix workflow issues
   */
  async generateFix(
    workflow: Workflow,
    analysis: GeminiAnalysisResult
  ): Promise<GeminiPatch> {
    const prompt = this.buildFixPrompt(workflow, analysis);

    const schema = {
      type: 'object',
      properties: {
        nodes: {
          type: 'object',
          properties: {
            add: { type: 'array' },
            update: { type: 'array' },
            remove: { type: 'array' },
          },
        },
        connections: {
          type: 'object',
          properties: {
            add: { type: 'array' },
            remove: { type: 'array' },
          },
        },
        reasoning: { type: 'string' },
      },
      required: ['reasoning'],
    };

    try {
      return await this.gemini.generateJSON<GeminiPatch>(prompt, schema);
    } catch (error) {
      throw new Error(
        `Auto-fix generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build fix generation prompt
   */
  private buildFixPrompt(workflow: Workflow, analysis: GeminiAnalysisResult): string {
    return `You are an expert workflow fixer. Generate a patch to fix the identified issues.

CURRENT WORKFLOW:
${JSON.stringify(workflow, null, 2)}

ANALYSIS RESULTS:
${JSON.stringify(analysis, null, 2)}

INSTRUCTIONS:
1. Review each issue from the analysis
2. Generate specific changes to fix critical and warning issues
3. Preserve existing functionality where possible
4. Make minimal changes necessary to fix the issues
5. Ensure the fixed workflow is valid and complete

PATCH FORMAT:
Return a JSON object with:

nodes.add: Array of new nodes to add (if needed)
nodes.update: Array of node updates (partial node objects with id and changed fields)
nodes.remove: Array of node IDs to remove (if needed)

connections.add: Array of new connections to add
connections.remove: Array of connections to remove (source + target)

reasoning: Detailed explanation of all changes

EXAMPLE:
{
  "nodes": {
    "update": [
      {
        "id": "node-123",
        "parameters": {
          "url": "https://api.example.com/endpoint"
        }
      }
    ]
  },
  "reasoning": "Fixed the URL in the HTTP Request node..."
}

Only include sections that have changes. If no nodes need to be added, omit nodes.add.`;
  }

  /**
   * Apply a patch to a workflow
   */
  applyPatch(workflow: Workflow, patch: GeminiPatch): Workflow {
    const updatedWorkflow = JSON.parse(JSON.stringify(workflow)) as Workflow;

    // Apply node updates
    if (patch.nodes?.update) {
      for (const update of patch.nodes.update) {
        const nodeIndex = updatedWorkflow.nodes.findIndex(n => n.id === update.id);
        if (nodeIndex !== -1) {
          updatedWorkflow.nodes[nodeIndex] = {
            ...updatedWorkflow.nodes[nodeIndex],
            ...update,
          };
        }
      }
    }

    // Remove nodes
    if (patch.nodes?.remove) {
      updatedWorkflow.nodes = updatedWorkflow.nodes.filter(
        n => !patch.nodes!.remove!.includes(n.id)
      );

      // Also remove connections involving removed nodes
      updatedWorkflow.connections = updatedWorkflow.connections.filter(
        c =>
          !patch.nodes!.remove!.includes(c.source) &&
          !patch.nodes!.remove!.includes(c.target)
      );
    }

    // Add new nodes
    if (patch.nodes?.add) {
      updatedWorkflow.nodes.push(...(patch.nodes.add as WorkflowNode[]));
    }

    // Remove connections
    if (patch.connections?.remove) {
      for (const removeConn of patch.connections.remove) {
        updatedWorkflow.connections = updatedWorkflow.connections.filter(
          c => !(c.source === removeConn.source && c.target === removeConn.target)
        );
      }
    }

    // Add connections
    if (patch.connections?.add) {
      updatedWorkflow.connections.push(...(patch.connections.add as NodeConnection[]));
    }

    // Update timestamp
    updatedWorkflow.updatedAt = new Date();

    return updatedWorkflow;
  }

  /**
   * Fix and test a workflow
   */
  async fixWorkflow(
    workflow: Workflow,
    analysis: GeminiAnalysisResult
  ): Promise<{
    fixed: Workflow;
    patch: GeminiPatch;
    changes: string[];
  }> {
    const patch = await this.generateFix(workflow, analysis);
    const fixed = this.applyPatch(workflow, patch);

    // Summarize changes
    const changes: string[] = [];

    if (patch.nodes?.add) {
      changes.push(`Added ${patch.nodes.add.length} node(s)`);
    }
    if (patch.nodes?.update) {
      changes.push(`Updated ${patch.nodes.update.length} node(s)`);
    }
    if (patch.nodes?.remove) {
      changes.push(`Removed ${patch.nodes.remove.length} node(s)`);
    }
    if (patch.connections?.add) {
      changes.push(`Added ${patch.connections.add.length} connection(s)`);
    }
    if (patch.connections?.remove) {
      changes.push(`Removed ${patch.connections.remove.length} connection(s)`);
    }

    return {
      fixed,
      patch,
      changes,
    };
  }
}
