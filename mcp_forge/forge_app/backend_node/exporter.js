/**
 * Exporter Module - MCP Forge Backend
 * Handles agent export to various formats
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

class Exporter {
  constructor() {
    this.templatesPath = path.join(__dirname, 'agent_templates');
  }

  /**
   * Export to YAML format
   */
  exportToYAML(agentData) {
    const config = this.buildAgentConfig(agentData);
    return yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
  }

  /**
   * Export to JSON format
   */
  exportToJSON(agentData) {
    const config = this.buildAgentConfig(agentData);
    return JSON.stringify(config, null, 2);
  }

  /**
   * Export to n8n workflow format
   */
  exportToN8N(agentData) {
    const workflow = this.buildN8NWorkflow(agentData);
    return JSON.stringify(workflow, null, 2);
  }

  /**
   * Build agent configuration
   */
  buildAgentConfig(agentData) {
    const agentNode = this.findAgentNode(agentData);
    if (!agentNode) {
      throw new Error('No AI agent node found');
    }

    const config = {
      name: this.sanitizeName(agentData.metadata?.name || 'untitled_agent'),
      version: '1.0.0',
      model: agentNode.config.model || 'claude-sonnet-4',
      description: agentData.metadata?.description || 'Agent created with MCP Forge'
    };

    // Memory
    const memoryNode = this.findNodeByType(agentData, 'memory-block');
    if (memoryNode) {
      config.memory = {
        type: memoryNode.config.type || 'persistent',
        path: memoryNode.config.path || './memory/agent.json'
      };
    }

    // Triggers
    const triggers = this.buildTriggers(agentData);
    if (triggers.length > 0) {
      config.triggers = triggers;
    }

    // Inputs
    const inputs = this.buildInputs(agentData);
    if (inputs.length > 0) {
      config.inputs = inputs;
    }

    // Processing
    config.processing = {
      role: agentNode.config.role || 'You are a helpful assistant.',
      temperature: agentNode.config.temperature || 0.7,
      max_tokens: agentNode.config.max_tokens || 4096
    };

    // Outputs
    const outputs = this.buildOutputs(agentData);
    if (outputs.length > 0) {
      config.outputs = outputs;
    }

    return config;
  }

  /**
   * Build triggers
   */
  buildTriggers(agentData) {
    const triggerNodes = agentData.nodes.filter(n => n.type.includes('trigger'));
    return triggerNodes.map(node => {
      switch (node.type) {
        case 'cron-trigger':
          return {
            type: 'cron',
            schedule: node.config.schedule,
            timezone: node.config.timezone || 'UTC'
          };
        case 'api-trigger':
          return {
            type: 'api',
            method: node.config.method || 'POST',
            path: node.config.path,
            port: node.config.port || 3000
          };
        default:
          return { type: 'manual' };
      }
    });
  }

  /**
   * Build inputs
   */
  buildInputs(agentData) {
    const inputs = [];
    const folderWatcher = this.findNodeByType(agentData, 'folder-watcher');
    if (folderWatcher) {
      inputs.push({
        type: 'folder_watch',
        path: folderWatcher.config.path,
        patterns: folderWatcher.config.patterns || ['*']
      });
    }
    return inputs;
  }

  /**
   * Build outputs
   */
  buildOutputs(agentData) {
    const outputNodes = agentData.nodes.filter(n => n.type.includes('output'));
    return outputNodes.map(node => {
      switch (node.type) {
        case 'drive-output':
          return {
            type: 'drive',
            path: node.config.path
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
            path: node.config.path
          };
        default:
          return { type: 'console' };
      }
    });
  }

  /**
   * Build n8n workflow
   */
  buildN8NWorkflow(agentData) {
    // TODO: Complete n8n mapping
    return {
      name: agentData.metadata?.name || 'Agent Workflow',
      nodes: [],
      connections: {},
      active: false
    };
  }

  /**
   * Find agent node
   */
  findAgentNode(agentData) {
    return agentData.nodes.find(n => n.type.includes('-agent'));
  }

  /**
   * Find node by type
   */
  findNodeByType(agentData, type) {
    return agentData.nodes.find(n => n.type === type);
  }

  /**
   * Sanitize name
   */
  sanitizeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  /**
   * Merge with template
   */
  mergeWithTemplate(templateName, customConfig) {
    const templatePath = path.join(this.templatesPath, `${templateName}.yaml`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const template = yaml.load(fs.readFileSync(templatePath, 'utf-8'));
    return { ...template, ...customConfig };
  }
}

module.exports = Exporter;
