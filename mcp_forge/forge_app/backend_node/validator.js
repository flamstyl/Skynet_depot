/**
 * Validator Module - MCP Forge Backend
 * Validates agent structure and integrates with AI for advanced validation
 */

const axios = require('axios');

class Validator {
  constructor() {
    this.claudeAPIKey = process.env.CLAUDE_API_KEY;
    this.openaiAPIKey = process.env.OPENAI_API_KEY;
    this.geminiAPIKey = process.env.GEMINI_API_KEY;
  }

  /**
   * Validate agent structure (non-AI)
   */
  validateStructure(agentData) {
    const errors = [];
    const warnings = [];

    // Check for nodes
    if (!agentData.nodes || agentData.nodes.length === 0) {
      errors.push('No nodes found in agent');
    }

    // Check for agent node
    const hasAgent = agentData.nodes?.some(n => n.type.includes('-agent'));
    if (!hasAgent) {
      errors.push('No AI agent node found');
    }

    // Check for triggers
    const hasTrigger = agentData.nodes?.some(n => n.type.includes('trigger'));
    if (!hasTrigger) {
      warnings.push('No trigger found - agent will need manual invocation');
    }

    // Check for disconnected nodes
    const connectedNodes = new Set();
    agentData.connections?.forEach(conn => {
      connectedNodes.add(conn.from);
      connectedNodes.add(conn.to);
    });

    const disconnected = agentData.nodes?.filter(n => !connectedNodes.has(n.id)).length || 0;
    if (disconnected > 0) {
      warnings.push(`${disconnected} disconnected node(s) found`);
    }

    // Check for cycles
    if (this.hasCycle(agentData)) {
      warnings.push('Potential infinite loop detected in connections');
    }

    // Check agent configuration
    const agentNode = agentData.nodes?.find(n => n.type.includes('-agent'));
    if (agentNode) {
      if (!agentNode.config.model) {
        errors.push('Agent node missing model configuration');
      }
      if (!agentNode.config.role) {
        warnings.push('Agent node missing role/prompt configuration');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        total_nodes: agentData.nodes?.length || 0,
        connections: agentData.connections?.length || 0,
        disconnected_nodes: disconnected
      }
    };
  }

  /**
   * Validate with AI (Claude/GPT/Gemini)
   */
  async validateWithAI(agentData, model = 'claude', customPrompt = null, task = 'validate') {
    const prompt = customPrompt || this.buildValidationPrompt(agentData, task);

    try {
      let response;

      switch (model) {
        case 'claude':
          response = await this.callClaude(prompt);
          break;

        case 'gpt':
        case 'openai':
          response = await this.callGPT(prompt);
          break;

        case 'gemini':
          response = await this.callGemini(prompt);
          break;

        default:
          throw new Error(`Unknown AI model: ${model}`);
      }

      return response;

    } catch (error) {
      console.error('AI validation error:', error);
      throw error;
    }
  }

  /**
   * Build validation prompt
   */
  buildValidationPrompt(agentData, task) {
    const summary = this.summarizeAgent(agentData);

    const prompts = {
      validate: `Analyze this AI agent configuration for errors and issues:\n\n${summary}\n\nProvide specific feedback on structure, logic, and potential problems.`,

      improve: `Suggest improvements for this AI agent:\n\n${summary}\n\nFocus on design, performance, reliability, and best practices.`,

      metadata: `Generate comprehensive metadata for this AI agent:\n\n${summary}\n\nProvide: name, description, tags, use cases. Format as JSON.`,

      evaluate_cycles: `Evaluate the execution flow of this AI agent:\n\n${summary}\n\nAnalyze logic, bottlenecks, error handling, and optimization opportunities.`
    };

    return prompts[task] || prompts.validate;
  }

  /**
   * Summarize agent for AI prompts
   */
  summarizeAgent(agentData) {
    const nodes = agentData.nodes?.map(n =>
      `- ${n.type}: ${JSON.stringify(n.config)}`
    ).join('\n') || 'No nodes';

    const connections = agentData.connections?.map(c =>
      `- ${c.from} → ${c.to}`
    ).join('\n') || 'No connections';

    return `Nodes:\n${nodes}\n\nConnections:\n${connections}`;
  }

  /**
   * Call Claude API
   */
  async callClaude(prompt) {
    if (!this.claudeAPIKey) {
      throw new Error('Claude API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: prompt
          }]
        },
        {
          headers: {
            'x-api-key': this.claudeAPIKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );

      return response.data.content[0].text;

    } catch (error) {
      console.error('Claude API error:', error.response?.data || error.message);
      throw new Error('Failed to call Claude API');
    }
  }

  /**
   * Call GPT API
   */
  async callGPT(prompt) {
    if (!this.openaiAPIKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 4096
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiAPIKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('GPT API error:', error.response?.data || error.message);
      throw new Error('Failed to call GPT API');
    }
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt) {
    if (!this.geminiAPIKey) {
      throw new Error('Gemini API key not configured');
    }

    // TODO: Implement Gemini API call
    throw new Error('Gemini integration not yet implemented');
  }

  /**
   * Detect cycles in graph
   */
  hasCycle(agentData) {
    const graph = {};
    agentData.nodes?.forEach(node => {
      graph[node.id] = [];
    });

    agentData.connections?.forEach(conn => {
      if (graph[conn.from]) {
        graph[conn.from].push(conn.to);
      }
    });

    const visited = new Set();
    const stack = new Set();

    const dfs = (nodeId) => {
      visited.add(nodeId);
      stack.add(nodeId);

      for (const neighbor of (graph[nodeId] || [])) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (stack.has(neighbor)) {
          return true;
        }
      }

      stack.delete(nodeId);
      return false;
    };

    for (const nodeId in graph) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) return true;
      }
    }

    return false;
  }
}

module.exports = Validator;
