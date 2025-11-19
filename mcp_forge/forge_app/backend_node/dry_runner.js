/**
 * Dry Runner Module - MCP Forge Backend
 * Simulates agent execution without real actions
 */

class DryRunner {
  constructor() {
    this.executionLog = [];
    this.mockResponses = {
      'claude-agent': 'Mock Claude response: I understand and will help with that task.',
      'gpt-agent': 'Mock GPT response: Task completed successfully.',
      'gemini-agent': 'Mock Gemini response: Processing your request...',
      'codestral-agent': 'Mock Codestral response: Here is the generated code...'
    };
  }

  /**
   * Simulate agent execution
   */
  async simulate(agentData, testInput = null) {
    this.executionLog = [];
    const startTime = Date.now();

    this.log('info', '🚀 Starting dry-run simulation');

    try {
      // Validate structure
      this.log('info', '📋 Validating structure...');
      if (!this.validateStructure(agentData)) {
        throw new Error('Invalid agent structure');
      }
      this.log('success', '✅ Structure valid');

      // Initialize memory
      const memoryNode = this.findNodeByType(agentData, 'memory-block');
      if (memoryNode) {
        this.log('info', `💾 Memory: ${memoryNode.config.path}`);
      }

      // Process triggers
      const triggers = this.findNodesByTypePattern(agentData, 'trigger');
      if (triggers.length > 0) {
        this.log('info', `⏰ Triggers: ${triggers.length}`);
        for (const trigger of triggers) {
          this.simulateTrigger(trigger);
        }
      }

      // Process inputs
      const inputs = this.findNodesByTypePattern(agentData, 'watcher');
      if (inputs.length > 0) {
        this.log('info', `📥 Inputs: ${inputs.length}`);
        for (const input of inputs) {
          this.simulateInput(input, testInput);
        }
      }

      // Execute agent
      const agentNode = this.findAgentNode(agentData);
      if (agentNode) {
        this.log('info', `🤖 Executing ${agentNode.type}...`);
        await this.simulateAgent(agentNode, testInput);
      }

      // Process outputs
      const outputs = this.findNodesByTypePattern(agentData, 'output');
      if (outputs.length > 0) {
        this.log('info', `📤 Outputs: ${outputs.length}`);
        for (const output of outputs) {
          this.simulateOutput(output);
        }
      }

      const duration = Date.now() - startTime;
      this.log('success', `✅ Simulation complete (${duration}ms)`);

      return {
        success: true,
        duration,
        steps: this.executionLog.length,
        log: this.executionLog,
        summary: this.generateSummary()
      };

    } catch (error) {
      this.log('error', `❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        log: this.executionLog
      };
    }
  }

  /**
   * Validate structure
   */
  validateStructure(agentData) {
    if (!agentData.nodes || agentData.nodes.length === 0) {
      this.log('error', 'No nodes found');
      return false;
    }

    if (!this.findAgentNode(agentData)) {
      this.log('error', 'No AI agent node found');
      return false;
    }

    return true;
  }

  /**
   * Simulate trigger
   */
  simulateTrigger(trigger) {
    switch (trigger.type) {
      case 'cron-trigger':
        this.log('info', `  ⏰ Cron: ${trigger.config.schedule}`);
        break;
      case 'folder-watcher':
        this.log('info', `  👁️ Watching: ${trigger.config.path}`);
        break;
      case 'api-trigger':
        this.log('info', `  🌐 API: ${trigger.config.method} ${trigger.config.path}`);
        break;
    }
  }

  /**
   * Simulate input
   */
  simulateInput(input, testInput) {
    this.log('info', `  📥 Input type: ${input.type}`);
    if (testInput) {
      this.log('info', `     Test data provided`);
    }
  }

  /**
   * Simulate agent execution
   */
  async simulateAgent(agentNode, testInput) {
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockResponse = this.mockResponses[agentNode.type] || 'Mock AI response';

    this.log('info', `  Model: ${agentNode.config.model}`);
    this.log('info', `  Temperature: ${agentNode.config.temperature}`);
    this.log('success', `  Response: ${mockResponse}`);

    return mockResponse;
  }

  /**
   * Simulate output
   */
  simulateOutput(output) {
    switch (output.type) {
      case 'drive-output':
        this.log('info', `  💾 Write to: ${output.config.path}`);
        break;
      case 'webhook-output':
        this.log('info', `  🔗 POST to: ${output.config.url}`);
        break;
      case 'log-output':
        this.log('info', `  📋 Log to: ${output.config.path}`);
        break;
    }
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
   * Find nodes by type pattern
   */
  findNodesByTypePattern(agentData, pattern) {
    return agentData.nodes.filter(n => n.type.includes(pattern));
  }

  /**
   * Log execution step
   */
  log(level, message) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    this.executionLog.push(entry);
    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  /**
   * Generate summary
   */
  generateSummary() {
    const errors = this.executionLog.filter(e => e.level === 'error').length;
    const warnings = this.executionLog.filter(e => e.level === 'warning').length;
    const successes = this.executionLog.filter(e => e.level === 'success').length;

    return {
      total_steps: this.executionLog.length,
      errors,
      warnings,
      successes,
      status: errors === 0 ? 'success' : 'failed'
    };
  }
}

module.exports = DryRunner;
