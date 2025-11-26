/**
 * JSON Builder - MCP Forge
 * Builds JSON agent configuration from canvas data
 */

class JSONBuilder {
  /**
   * Build JSON from canvas data
   */
  build(canvasData) {
    const agentConfig = this.buildAgentConfig(canvasData);
    return JSON.stringify(agentConfig, null, 2);
  }

  /**
   * Build agent configuration object
   */
  buildAgentConfig(canvasData) {
    const agentNode = this.findAgentNode(canvasData);
    if (!agentNode) {
      throw new Error('No AI agent node found in canvas');
    }

    const config = {
      name: canvasData.metadata?.name || 'Untitled Agent',
      version: '1.0.0',
      model: agentNode.config.model || 'claude-sonnet-4',
      created: canvasData.metadata?.created || new Date().toISOString(),
      modified: new Date().toISOString()
    };

    // Memory
    const memoryNode = this.findNodeByType(canvasData, 'memory-block');
    if (memoryNode) {
      config.memory = {
        type: memoryNode.config.type || 'persistent',
        path: memoryNode.config.path || './memory/agent.json',
        format: memoryNode.config.format || 'json'
      };
    }

    // Triggers
    const triggers = this.buildTriggers(canvasData);
    if (triggers.length > 0) {
      config.triggers = triggers;
    }

    // Inputs
    const inputs = this.buildInputs(canvasData);
    if (inputs.length > 0) {
      config.inputs = inputs;
    }

    // Processing configuration
    config.processing = {
      role: agentNode.config.role || 'You are a helpful assistant.',
      temperature: agentNode.config.temperature || 0.7,
      max_tokens: agentNode.config.max_tokens || 4096,
      top_p: agentNode.config.top_p || 1.0
    };

    // Outputs
    const outputs = this.buildOutputs(canvasData);
    if (outputs.length > 0) {
      config.outputs = outputs;
    }

    // Graph structure (preserve canvas layout)
    config.graph = {
      nodes: canvasData.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: { x: node.x, y: node.y },
        config: node.config
      })),
      connections: canvasData.connections
    };

    // Metadata
    config.metadata = {
      author: canvasData.metadata?.author || 'MCP Forge User',
      description: canvasData.metadata?.description || '',
      tags: canvasData.metadata?.tags || [],
      forge_version: '1.0.0'
    };

    return config;
  }

  /**
   * Find primary agent node
   */
  findAgentNode(canvasData) {
    return canvasData.nodes.find(node =>
      node.type.includes('-agent')
    );
  }

  /**
   * Find node by type
   */
  findNodeByType(canvasData, type) {
    return canvasData.nodes.find(node => node.type === type);
  }

  /**
   * Find nodes by type pattern
   */
  findNodesByTypePattern(canvasData, pattern) {
    return canvasData.nodes.filter(node =>
      node.type.includes(pattern)
    );
  }

  /**
   * Build triggers configuration
   */
  buildTriggers(canvasData) {
    const triggerNodes = this.findNodesByTypePattern(canvasData, 'trigger');
    return triggerNodes.map(node => ({
      id: node.id,
      type: this.mapTriggerType(node.type),
      config: node.config,
      enabled: node.config.enabled !== false
    }));
  }

  /**
   * Map trigger node type to config type
   */
  mapTriggerType(nodeType) {
    const mapping = {
      'cron-trigger': 'cron',
      'email-trigger': 'email',
      'api-trigger': 'api',
      'folder-watcher': 'folder_watch'
    };
    return mapping[nodeType] || 'manual';
  }

  /**
   * Build inputs configuration
   */
  buildInputs(canvasData) {
    const inputNodes = this.findNodesByTypePattern(canvasData, 'watcher');
    return inputNodes.map(node => ({
      id: node.id,
      type: this.mapInputType(node.type),
      config: node.config
    }));
  }

  /**
   * Map input node type
   */
  mapInputType(nodeType) {
    const mapping = {
      'folder-watcher': 'folder_watch',
      'email-trigger': 'email',
      'api-trigger': 'api'
    };
    return mapping[nodeType] || 'manual';
  }

  /**
   * Build outputs configuration
   */
  buildOutputs(canvasData) {
    const outputNodes = this.findNodesByTypePattern(canvasData, 'output');
    return outputNodes.map(node => ({
      id: node.id,
      type: this.mapOutputType(node.type),
      config: node.config
    }));
  }

  /**
   * Map output node type
   */
  mapOutputType(nodeType) {
    const mapping = {
      'drive-output': 'file',
      'webhook-output': 'webhook',
      'log-output': 'log',
      'email-output': 'email'
    };
    return mapping[nodeType] || 'console';
  }

  /**
   * Build compact version (no graph data)
   */
  buildCompact(canvasData) {
    const fullConfig = this.buildAgentConfig(canvasData);

    // Remove graph and metadata for compact version
    const { graph, metadata, ...compactConfig } = fullConfig;

    return JSON.stringify(compactConfig, null, 2);
  }

  /**
   * Validate JSON structure
   */
  validate(jsonString) {
    try {
      const config = JSON.parse(jsonString);
      const errors = [];

      // Required fields
      if (!config.name) errors.push('Missing required field: name');
      if (!config.model) errors.push('Missing required field: model');

      // Valid model
      const validModels = [
        'claude-sonnet-4',
        'claude-opus-4',
        'gpt-4',
        'gpt-4-turbo',
        'gemini-pro',
        'codestral-latest'
      ];

      if (config.model && !validModels.some(m => config.model.includes(m))) {
        errors.push(`Unknown model: ${config.model}`);
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Invalid JSON: ${error.message}`]
      };
    }
  }
}
