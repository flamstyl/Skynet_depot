/**
 * Dry Run Engine - MCP Forge
 * Simulates agent execution without real actions
 */

class DryRunEngine {
  constructor() {
    this.executionLog = [];
    this.mockResponses = {
      'claude-agent': 'Mock Claude response: Task completed successfully.',
      'gpt-agent': 'Mock GPT response: I understand and will help with that.',
      'gemini-agent': 'Mock Gemini response: Processing your request...',
      'codestral-agent': 'Mock Codestral response: Here is the generated code...'
    };
  }

  /**
   * Run dry-run simulation
   */
  async simulate(canvasData, testInput = null) {
    this.executionLog = [];
    this.log('info', '🚀 Starting dry-run simulation...');

    try {
      // Step 1: Validate structure
      this.log('info', '📋 Validating agent structure...');
      const validation = this.validate(canvasData);
      if (!validation.valid) {
        this.log('error', `❌ Validation failed: ${validation.errors.join(', ')}`);
        return this.buildReport(false);
      }
      this.log('success', '✅ Structure valid');

      // Step 2: Initialize memory
      const memoryNode = this.findNodeByType(canvasData, 'memory-block');
      if (memoryNode) {
        this.log('info', `💾 Memory initialized: ${memoryNode.config.path}`);
      }

      // Step 3: Simulate triggers
      const triggers = this.findNodesByTypePattern(canvasData, 'trigger');
      if (triggers.length > 0) {
        this.log('info', `⏰ Found ${triggers.length} trigger(s)`);
        triggers.forEach(trigger => {
          this.simulateTrigger(trigger);
        });
      } else {
        this.log('info', '⏰ No triggers - manual invocation');
      }

      // Step 4: Process inputs
      const inputs = this.findNodesByTypePattern(canvasData, 'watcher');
      if (inputs.length > 0) {
        this.log('info', `📥 Processing ${inputs.length} input(s)...`);
        inputs.forEach(input => {
          this.simulateInput(input, testInput);
        });
      }

      // Step 5: Execute agent
      const agentNode = this.findAgentNode(canvasData);
      if (agentNode) {
        this.log('info', `🤖 Executing ${agentNode.type}...`);
        const response = await this.simulateAgent(agentNode, testInput);
        this.log('success', `✅ Agent response: ${response.substring(0, 100)}...`);
      }

      // Step 6: Handle outputs
      const outputs = this.findNodesByTypePattern(canvasData, 'output');
      if (outputs.length > 0) {
        this.log('info', `📤 Processing ${outputs.length} output(s)...`);
        outputs.forEach(output => {
          this.simulateOutput(output);
        });
      }

      this.log('success', '✅ Simulation completed successfully');
      return this.buildReport(true);

    } catch (error) {
      this.log('error', `❌ Simulation failed: ${error.message}`);
      return this.buildReport(false, error);
    }
  }

  /**
   * Simulate trigger activation
   */
  simulateTrigger(trigger) {
    switch (trigger.type) {
      case 'cron-trigger':
        this.log('info', `  ⏰ Cron trigger: ${trigger.config.schedule}`);
        this.log('info', `     Next run: ${this.getNextCronRun(trigger.config.schedule)}`);
        break;

      case 'folder-watcher':
        this.log('info', `  👁️ Watching: ${trigger.config.path}`);
        this.log('info', `     Patterns: ${trigger.config.patterns?.join(', ') || '*'}`);
        break;

      case 'email-trigger':
        this.log('info', `  📧 Email trigger: ${trigger.config.host}:${trigger.config.port}`);
        break;

      case 'api-trigger':
        this.log('info', `  🌐 API endpoint: ${trigger.config.method} ${trigger.config.path}`);
        break;
    }
  }

  /**
   * Simulate input processing
   */
  simulateInput(input, testInput) {
    this.log('info', `  📥 Input: ${input.type}`);
    if (testInput) {
      this.log('info', `     Test data: ${JSON.stringify(testInput).substring(0, 50)}...`);
    } else {
      this.log('info', `     Mock data: [simulated input]`);
    }
  }

  /**
   * Simulate AI agent execution
   */
  async simulateAgent(agentNode, testInput) {
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockResponse = this.mockResponses[agentNode.type] || 'Mock AI response';

    this.log('info', `  Model: ${agentNode.config.model}`);
    this.log('info', `  Temperature: ${agentNode.config.temperature}`);
    this.log('info', `  Max tokens: ${agentNode.config.max_tokens}`);

    if (testInput) {
      this.log('info', `  Input: ${JSON.stringify(testInput).substring(0, 50)}...`);
    }

    return mockResponse;
  }

  /**
   * Simulate output handling
   */
  simulateOutput(output) {
    switch (output.type) {
      case 'drive-output':
        this.log('info', `  💾 Would write to: ${output.config.path}/${output.config.filename}`);
        break;

      case 'webhook-output':
        this.log('info', `  🔗 Would POST to: ${output.config.url}`);
        break;

      case 'log-output':
        this.log('info', `  📋 Would log to: ${output.config.path}`);
        break;

      case 'email-output':
        this.log('info', `  📧 Would send email to: ${output.config.to}`);
        break;
    }
  }

  /**
   * Validate agent structure
   */
  validate(canvasData) {
    const errors = [];

    if (!this.findAgentNode(canvasData)) {
      errors.push('No AI agent node found');
    }

    if (canvasData.nodes.length === 0) {
      errors.push('No nodes in canvas');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Find agent node
   */
  findAgentNode(canvasData) {
    return canvasData.nodes.find(node => node.type.includes('-agent'));
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
    return canvasData.nodes.filter(node => node.type.includes(pattern));
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
   * Build execution report
   */
  buildReport(success, error = null) {
    return {
      success,
      timestamp: new Date().toISOString(),
      duration: this.executionLog.length > 0
        ? new Date(this.executionLog[this.executionLog.length - 1].timestamp) - new Date(this.executionLog[0].timestamp)
        : 0,
      steps: this.executionLog.length,
      log: this.executionLog,
      error: error ? error.message : null,
      summary: this.generateSummary()
    };
  }

  /**
   * Generate execution summary
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

  /**
   * Get next cron run time (mock)
   */
  getNextCronRun(schedule) {
    // TODO: Implement actual cron parsing
    return 'Next hour (simulated)';
  }
}
