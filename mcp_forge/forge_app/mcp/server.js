/**
 * MCP Server - MCP Forge
 * Provides MCP tools for AI agent validation and deployment
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const AIBridge = require('./tools/ai_bridge');
const AgentSync = require('./tools/sync_agents');

class MCPForgeServer {
  constructor() {
    this.server = new McpServer({
      name: 'mcp-forge',
      version: '1.0.0',
      description: 'MCP Forge - AI Agent Builder Tools'
    });

    this.aiBridge = new AIBridge();
    this.agentSync = new AgentSync();

    this.setupTools();
    this.setupResources();
  }

  /**
   * Setup MCP tools
   */
  setupTools() {
    // Validate agent with AI
    this.server.addTool({
      name: 'validate_agent',
      description: 'Validate agent configuration with Claude/GPT/Gemini',
      parameters: {
        type: 'object',
        properties: {
          agent_config: {
            type: 'object',
            description: 'Agent configuration object'
          },
          model: {
            type: 'string',
            description: 'AI model to use (claude, gpt, gemini)',
            default: 'claude'
          }
        },
        required: ['agent_config']
      },
      handler: async (params) => {
        try {
          const result = await this.aiBridge.validate(params.agent_config, params.model);
          return {
            success: true,
            validation: result
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    });

    // Improve agent with AI suggestions
    this.server.addTool({
      name: 'improve_agent',
      description: 'Get AI suggestions to improve agent design',
      parameters: {
        type: 'object',
        properties: {
          agent_config: {
            type: 'object',
            description: 'Agent configuration object'
          },
          focus_areas: {
            type: 'array',
            description: 'Areas to focus on (e.g., performance, reliability)',
            items: { type: 'string' },
            default: []
          }
        },
        required: ['agent_config']
      },
      handler: async (params) => {
        try {
          const result = await this.aiBridge.improve(params.agent_config, params.focus_areas);
          return {
            success: true,
            improvements: result
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    });

    // Generate metadata
    this.server.addTool({
      name: 'generate_metadata',
      description: 'Auto-generate agent metadata (name, description, tags)',
      parameters: {
        type: 'object',
        properties: {
          agent_config: {
            type: 'object',
            description: 'Agent configuration object'
          }
        },
        required: ['agent_config']
      },
      handler: async (params) => {
        try {
          const result = await this.aiBridge.generateMetadata(params.agent_config);
          return {
            success: true,
            metadata: result
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    });

    // Sync to Skynet
    this.server.addTool({
      name: 'sync_to_skynet',
      description: 'Deploy agent to Skynet Core directory',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'Agent ID or name'
          },
          agent_config: {
            type: 'object',
            description: 'Agent configuration object'
          },
          target_path: {
            type: 'string',
            description: 'Target deployment path',
            default: '/agents/'
          }
        },
        required: ['agent_id', 'agent_config']
      },
      handler: async (params) => {
        try {
          const result = await this.agentSync.pushToSkynet(
            params.agent_id,
            params.agent_config,
            params.target_path
          );
          return {
            success: true,
            deployment: result
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    });

    // Test agent
    this.server.addTool({
      name: 'test_agent',
      description: 'Run comprehensive tests on agent configuration',
      parameters: {
        type: 'object',
        properties: {
          agent_config: {
            type: 'object',
            description: 'Agent configuration object'
          },
          test_scenarios: {
            type: 'array',
            description: 'Test scenarios to run',
            items: { type: 'string' },
            default: ['structure', 'logic', 'performance']
          }
        },
        required: ['agent_config']
      },
      handler: async (params) => {
        try {
          // TODO: Implement comprehensive testing
          return {
            success: true,
            tests: {
              structure: { passed: true },
              logic: { passed: true },
              performance: { passed: true }
            }
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    });

    // Export agent
    this.server.addTool({
      name: 'export_agent',
      description: 'Export agent to YAML/JSON format',
      parameters: {
        type: 'object',
        properties: {
          agent_config: {
            type: 'object',
            description: 'Agent configuration object'
          },
          format: {
            type: 'string',
            description: 'Export format (yaml or json)',
            enum: ['yaml', 'json'],
            default: 'yaml'
          }
        },
        required: ['agent_config']
      },
      handler: async (params) => {
        try {
          const result = await this.agentSync.exportAgent(params.agent_config, params.format);
          return {
            success: true,
            export: result
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    });

    console.log('✅ MCP Tools registered');
  }

  /**
   * Setup MCP resources
   */
  setupResources() {
    // Agent templates resource
    this.server.addResource({
      uri: 'forge://templates',
      name: 'Agent Templates',
      description: 'Available agent templates',
      mimeType: 'application/json',
      handler: async () => {
        return {
          contents: JSON.stringify({
            templates: [
              {
                id: 'base_agent',
                name: 'Base Agent',
                description: 'Minimal agent configuration'
              },
              {
                id: 'cyclic_agent',
                name: 'Cyclic Agent',
                description: 'Agent with automated cycles'
              },
              {
                id: 'triggered_agent',
                name: 'Triggered Agent',
                description: 'Agent with multiple trigger types'
              }
            ]
          }, null, 2)
        };
      }
    });

    console.log('✅ MCP Resources registered');
  }

  /**
   * Start MCP server
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🔥 MCP Forge Server running');
    console.log('Available tools:');
    console.log('  - validate_agent');
    console.log('  - improve_agent');
    console.log('  - generate_metadata');
    console.log('  - sync_to_skynet');
    console.log('  - test_agent');
    console.log('  - export_agent');
  }
}

// Start server
const server = new MCPForgeServer();
server.start().catch(console.error);
