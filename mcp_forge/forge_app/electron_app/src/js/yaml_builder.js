/**
 * YAML Builder - MCP Forge
 * Builds YAML agent configuration from canvas data
 */

class YAMLBuilder {
  /**
   * Build YAML from canvas data
   */
  build(canvasData) {
    const agentConfig = this.buildAgentConfig(canvasData);
    return this.toYAML(agentConfig);
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
      name: this.sanitizeName(canvasData.metadata?.name || 'untitled_agent'),
      version: '1.0.0',
      model: agentNode.config.model || 'claude-sonnet-4'
    };

    // Memory
    const memoryNode = this.findNodeByType(canvasData, 'memory-block');
    if (memoryNode) {
      config.memory = {
        type: memoryNode.config.type || 'persistent',
        path: memoryNode.config.path || './memory/agent.json'
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

    // Processing (role, temperature, etc.)
    config.processing = {
      role: agentNode.config.role || 'You are a helpful assistant.',
      temperature: agentNode.config.temperature || 0.7,
      max_tokens: agentNode.config.max_tokens || 4096
    };

    // Cycles (execution flows)
    const cycles = this.buildCycles(canvasData);
    if (cycles.length > 0) {
      config.cycles = cycles;
    }

    // Outputs
    const outputs = this.buildOutputs(canvasData);
    if (outputs.length > 0) {
      config.outputs = outputs;
    }

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
    return triggerNodes.map(node => {
      switch (node.type) {
        case 'cron-trigger':
          return {
            type: 'cron',
            schedule: node.config.schedule,
            timezone: node.config.timezone || 'UTC'
          };

        case 'email-trigger':
          return {
            type: 'email',
            protocol: node.config.protocol,
            host: node.config.host,
            port: node.config.port,
            folder: node.config.folder || 'INBOX'
          };

        case 'api-trigger':
          return {
            type: 'api',
            method: node.config.method || 'POST',
            path: node.config.path,
            port: node.config.port || 3000
          };

        default:
          return {
            type: 'manual'
          };
      }
    });
  }

  /**
   * Build inputs configuration
   */
  buildInputs(canvasData) {
    const inputs = [];

    const folderWatcher = this.findNodeByType(canvasData, 'folder-watcher');
    if (folderWatcher) {
      inputs.push({
        type: 'folder_watch',
        path: folderWatcher.config.path,
        patterns: folderWatcher.config.patterns || ['*'],
        recursive: folderWatcher.config.recursive || false
      });
    }

    return inputs;
  }

  /**
   * Build cycles (execution flows)
   */
  buildCycles(canvasData) {
    // TODO: Build cycle definitions based on node connections
    // For now, return a simple default cycle
    const triggers = this.findNodesByTypePattern(canvasData, 'trigger');
    if (triggers.length === 0) return [];

    return [{
      name: 'default_cycle',
      trigger: 'main_trigger',
      steps: [
        'process_input',
        'run_agent',
        'handle_output'
      ]
    }];
  }

  /**
   * Build outputs configuration
   */
  buildOutputs(canvasData) {
    const outputNodes = this.findNodesByTypePattern(canvasData, 'output');
    return outputNodes.map(node => {
      switch (node.type) {
        case 'drive-output':
          return {
            type: 'drive',
            path: node.config.path,
            filename: node.config.filename
          };

        case 'webhook-output':
          return {
            type: 'webhook',
            url: node.config.url,
            method: node.config.method || 'POST'
          };

        case 'log-output':
          return {
            type: 'log',
            path: node.config.path,
            level: node.config.level || 'info'
          };

        case 'email-output':
          return {
            type: 'email',
            host: node.config.host,
            from: node.config.from,
            to: node.config.to,
            subject: node.config.subject
          };

        default:
          return {
            type: 'console'
          };
      }
    });
  }

  /**
   * Convert object to YAML string
   */
  toYAML(obj, indent = 0) {
    const lines = [];
    const indentStr = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length === 0) continue;

        lines.push(`${indentStr}${key}:`);
        value.forEach(item => {
          if (typeof item === 'object') {
            lines.push(`${indentStr}- ${this.toYAML(item, indent + 1).trim()}`);
          } else {
            lines.push(`${indentStr}- ${this.formatValue(item)}`);
          }
        });
      } else if (typeof value === 'object') {
        lines.push(`${indentStr}${key}:`);
        lines.push(this.toYAML(value, indent + 1));
      } else {
        lines.push(`${indentStr}${key}: ${this.formatValue(value)}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format value for YAML
   */
  formatValue(value) {
    if (typeof value === 'string') {
      // Quote if contains special characters
      if (value.includes(':') || value.includes('#') || value.includes('\n')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    return String(value);
  }

  /**
   * Sanitize name for filename
   */
  sanitizeName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
