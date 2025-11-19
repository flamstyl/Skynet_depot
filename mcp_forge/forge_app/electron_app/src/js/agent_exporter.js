/**
 * Agent Exporter - MCP Forge
 * Exports canvas data to various formats
 */

class AgentExporter {
  constructor() {
    this.yamlBuilder = new YAMLBuilder();
    this.jsonBuilder = new JSONBuilder();
  }

  /**
   * Export to YAML format
   */
  async exportToYAML(canvasData) {
    try {
      const yaml = this.yamlBuilder.build(canvasData);
      return {
        success: true,
        content: yaml,
        format: 'yaml'
      };
    } catch (error) {
      console.error('YAML export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export to JSON format
   */
  async exportToJSON(canvasData) {
    try {
      const json = this.jsonBuilder.build(canvasData);
      return {
        success: true,
        content: json,
        format: 'json'
      };
    } catch (error) {
      console.error('JSON export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export to n8n workflow format
   */
  async exportToN8N(canvasData) {
    try {
      // TODO: Implement n8n workflow export
      const workflow = this.buildN8NWorkflow(canvasData);
      return {
        success: true,
        content: JSON.stringify(workflow, null, 2),
        format: 'n8n'
      };
    } catch (error) {
      console.error('n8n export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build n8n workflow structure
   */
  buildN8NWorkflow(canvasData) {
    // TODO: Map Skynet nodes to n8n nodes
    return {
      name: canvasData.metadata?.name || 'Agent Workflow',
      nodes: [],
      connections: {},
      active: false,
      settings: {},
      id: Date.now()
    };
  }

  /**
   * Validate agent structure before export
   */
  validate(canvasData) {
    const errors = [];
    const warnings = [];

    // Check for agent node
    const hasAgentNode = canvasData.nodes.some(node =>
      node.type.includes('agent')
    );

    if (!hasAgentNode) {
      errors.push('No AI agent node found. Add at least one agent (Claude, GPT, Gemini, etc.)');
    }

    // Check for trigger
    const hasTrigger = canvasData.nodes.some(node =>
      node.type.includes('trigger')
    );

    if (!hasTrigger) {
      warnings.push('No trigger found. Agent will need to be invoked manually.');
    }

    // Check for disconnected nodes
    const connectedNodes = new Set();
    canvasData.connections.forEach(conn => {
      connectedNodes.add(conn.from);
      connectedNodes.add(conn.to);
    });

    const disconnectedNodes = canvasData.nodes.filter(node =>
      !connectedNodes.has(node.id)
    );

    if (disconnectedNodes.length > 0) {
      warnings.push(`${disconnectedNodes.length} disconnected node(s) found`);
    }

    // Check for cycles (infinite loops)
    if (this.hasCycle(canvasData)) {
      warnings.push('Potential infinite loop detected in connections');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Detect cycles in graph
   */
  hasCycle(canvasData) {
    const graph = {};
    canvasData.nodes.forEach(node => {
      graph[node.id] = [];
    });

    canvasData.connections.forEach(conn => {
      if (graph[conn.from]) {
        graph[conn.from].push(conn.to);
      }
    });

    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph[nodeId] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId in graph) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) return true;
      }
    }

    return false;
  }

  /**
   * Generate agent metadata
   */
  generateMetadata(canvasData) {
    const agentNodes = canvasData.nodes.filter(node =>
      node.type.includes('agent')
    );

    const triggerNodes = canvasData.nodes.filter(node =>
      node.type.includes('trigger')
    );

    return {
      name: canvasData.metadata?.name || 'Untitled Agent',
      description: canvasData.metadata?.description || 'AI agent created with MCP Forge',
      version: '1.0.0',
      created: canvasData.metadata?.created || new Date().toISOString(),
      modified: new Date().toISOString(),
      stats: {
        totalNodes: canvasData.nodes.length,
        connections: canvasData.connections.length,
        agents: agentNodes.length,
        triggers: triggerNodes.length
      }
    };
  }
}
