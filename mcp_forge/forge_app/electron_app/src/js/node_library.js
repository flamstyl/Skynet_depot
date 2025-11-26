/**
 * Node Library - MCP Forge
 * Manages node definitions and categories
 */

class NodeLibrary {
  constructor() {
    this.categories = {
      agents: {
        name: 'Agent Models',
        icon: '🤖',
        nodes: [
          {
            type: 'claude-agent',
            name: 'Claude Agent',
            icon: '🟣',
            description: 'Claude Sonnet AI agent',
            inputs: ['trigger', 'input'],
            outputs: ['output'],
            config: {
              model: 'claude-sonnet-4',
              temperature: 0.7,
              max_tokens: 4096,
              role: 'You are a helpful assistant.'
            }
          },
          {
            type: 'gpt-agent',
            name: 'GPT Agent',
            icon: '🟢',
            description: 'OpenAI GPT agent',
            inputs: ['trigger', 'input'],
            outputs: ['output'],
            config: {
              model: 'gpt-4',
              temperature: 0.7,
              max_tokens: 4096,
              role: 'You are a helpful assistant.'
            }
          },
          {
            type: 'gemini-agent',
            name: 'Gemini Agent',
            icon: '🔵',
            description: 'Google Gemini agent',
            inputs: ['trigger', 'input'],
            outputs: ['output'],
            config: {
              model: 'gemini-pro',
              temperature: 0.7,
              max_tokens: 4096,
              role: 'You are a helpful assistant.'
            }
          },
          {
            type: 'codestral-agent',
            name: 'Codestral Agent',
            icon: '🟠',
            description: 'Mistral Codestral coding agent',
            inputs: ['trigger', 'input'],
            outputs: ['output'],
            config: {
              model: 'codestral-latest',
              temperature: 0.3,
              max_tokens: 8192,
              role: 'You are an expert programmer.'
            }
          }
        ]
      },
      triggers: {
        name: 'Triggers',
        icon: '⏰',
        nodes: [
          {
            type: 'cron-trigger',
            name: 'Cron Schedule',
            icon: '⏰',
            description: 'Scheduled trigger using cron syntax',
            inputs: [],
            outputs: ['trigger'],
            config: {
              schedule: '0 9 * * *',
              timezone: 'UTC',
              enabled: true
            }
          },
          {
            type: 'folder-watcher',
            name: 'Folder Watcher',
            icon: '👁️',
            description: 'Watch folder for file changes',
            inputs: [],
            outputs: ['files'],
            config: {
              path: './inbox',
              patterns: ['*.txt', '*.md'],
              recursive: false,
              debounce: 1000
            }
          },
          {
            type: 'email-trigger',
            name: 'Email Trigger',
            icon: '📧',
            description: 'Trigger on incoming email',
            inputs: [],
            outputs: ['email'],
            config: {
              protocol: 'imap',
              host: '',
              port: 993,
              user: '',
              folder: 'INBOX'
            }
          },
          {
            type: 'api-trigger',
            name: 'API Endpoint',
            icon: '🌐',
            description: 'HTTP API endpoint trigger',
            inputs: [],
            outputs: ['request'],
            config: {
              method: 'POST',
              path: '/webhook',
              port: 3000
            }
          }
        ]
      },
      processing: {
        name: 'Processing',
        icon: '⚙️',
        nodes: [
          {
            type: 'memory-block',
            name: 'Memory',
            icon: '💾',
            description: 'Persistent memory storage',
            inputs: ['data'],
            outputs: ['data'],
            config: {
              type: 'persistent',
              path: './memory',
              format: 'json'
            }
          },
          {
            type: 'prompt-template',
            name: 'Prompt Template',
            icon: '📝',
            description: 'Template for AI prompts',
            inputs: ['variables'],
            outputs: ['prompt'],
            config: {
              template: 'Hello {{name}}, please help with {{task}}',
              variables: ['name', 'task']
            }
          },
          {
            type: 'action-chain',
            name: 'Action Chain',
            icon: '⛓️',
            description: 'Chain multiple actions',
            inputs: ['input'],
            outputs: ['output'],
            config: {
              actions: []
            }
          },
          {
            type: 'decision-logic',
            name: 'Decision',
            icon: '🔀',
            description: 'Conditional branching logic',
            inputs: ['input'],
            outputs: ['true', 'false'],
            config: {
              condition: 'value > 10',
              operator: '>'
            }
          }
        ]
      },
      outputs: {
        name: 'Outputs',
        icon: '📤',
        nodes: [
          {
            type: 'drive-output',
            name: 'Drive Export',
            icon: '💾',
            description: 'Write to file system',
            inputs: ['data'],
            outputs: [],
            config: {
              path: './output',
              filename: 'output.txt',
              append: false
            }
          },
          {
            type: 'webhook-output',
            name: 'Webhook',
            icon: '🔗',
            description: 'Send HTTP webhook',
            inputs: ['data'],
            outputs: ['response'],
            config: {
              url: '',
              method: 'POST',
              headers: {}
            }
          },
          {
            type: 'log-output',
            name: 'Log Writer',
            icon: '📋',
            description: 'Write to log file',
            inputs: ['message'],
            outputs: [],
            config: {
              path: './logs/agent.log',
              level: 'info',
              format: 'json'
            }
          },
          {
            type: 'email-output',
            name: 'Email Send',
            icon: '📧',
            description: 'Send email via SMTP',
            inputs: ['message'],
            outputs: [],
            config: {
              host: '',
              port: 587,
              from: '',
              to: '',
              subject: ''
            }
          }
        ]
      }
    };
  }

  /**
   * Get all node types
   */
  getAllNodes() {
    const allNodes = [];
    Object.values(this.categories).forEach(category => {
      allNodes.push(...category.nodes);
    });
    return allNodes;
  }

  /**
   * Get node definition by type
   */
  getNodeDefinition(type) {
    const allNodes = this.getAllNodes();
    return allNodes.find(node => node.type === type);
  }

  /**
   * Search nodes
   */
  search(query) {
    const allNodes = this.getAllNodes();
    const lowerQuery = query.toLowerCase();
    return allNodes.filter(node =>
      node.name.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get categories
   */
  getCategories() {
    return this.categories;
  }
}
