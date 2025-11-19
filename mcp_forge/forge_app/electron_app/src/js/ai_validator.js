/**
 * AI Validator - MCP Forge
 * Uses Claude/GPT to validate and improve agent designs
 */

class AIValidator {
  constructor() {
    this.backendURL = 'http://localhost:3000';
  }

  /**
   * Validate agent with AI
   */
  async validate(canvasData, model = 'claude') {
    try {
      const prompt = this.buildValidationPrompt(canvasData);

      const response = await fetch(`${this.backendURL}/api/validate/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentData: canvasData,
          model: model,
          prompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        suggestions: this.parseSuggestions(result.response),
        raw: result.response
      };

    } catch (error) {
      console.error('AI Validation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get AI improvement suggestions
   */
  async improve(canvasData, focusAreas = []) {
    try {
      const prompt = this.buildImprovementPrompt(canvasData, focusAreas);

      const response = await fetch(`${this.backendURL}/api/validate/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentData: canvasData,
          prompt: prompt,
          task: 'improve'
        })
      });

      if (!response.ok) {
        throw new Error(`Improvement request failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        improvements: this.parseImprovements(result.response),
        raw: result.response
      };

    } catch (error) {
      console.error('AI Improvement error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate metadata with AI
   */
  async generateMetadata(canvasData) {
    try {
      const prompt = this.buildMetadataPrompt(canvasData);

      const response = await fetch(`${this.backendURL}/api/validate/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentData: canvasData,
          prompt: prompt,
          task: 'metadata'
        })
      });

      if (!response.ok) {
        throw new Error(`Metadata generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        metadata: this.parseMetadata(result.response),
        raw: result.response
      };

    } catch (error) {
      console.error('Metadata generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Evaluate cycles/flows
   */
  async evaluateCycles(canvasData) {
    try {
      const prompt = this.buildCycleEvaluationPrompt(canvasData);

      const response = await fetch(`${this.backendURL}/api/validate/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentData: canvasData,
          prompt: prompt,
          task: 'evaluate_cycles'
        })
      });

      if (!response.ok) {
        throw new Error(`Cycle evaluation failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        evaluation: this.parseCycleEvaluation(result.response),
        raw: result.response
      };

    } catch (error) {
      console.error('Cycle evaluation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build validation prompt
   */
  buildValidationPrompt(canvasData) {
    const agentNode = canvasData.nodes.find(n => n.type.includes('-agent'));
    const summary = this.summarizeAgent(canvasData);

    return `Analyze this AI agent configuration for errors, inconsistencies, and potential issues:

Agent Summary:
- Model: ${agentNode?.config.model || 'Unknown'}
- Total Nodes: ${canvasData.nodes.length}
- Connections: ${canvasData.connections.length}

Nodes:
${summary.nodes}

Connections:
${summary.connections}

Please identify:
1. Structural errors
2. Logic inconsistencies
3. Missing critical components
4. Potential infinite loops
5. Security concerns
6. Performance issues

Provide specific, actionable feedback.`;
  }

  /**
   * Build improvement prompt
   */
  buildImprovementPrompt(canvasData, focusAreas) {
    const summary = this.summarizeAgent(canvasData);
    const focus = focusAreas.length > 0
      ? `Focus on: ${focusAreas.join(', ')}`
      : 'General improvements';

    return `Suggest improvements for this AI agent configuration:

${summary.nodes}

${focus}

Suggest improvements for:
1. Agent design and structure
2. Trigger frequency and reliability
3. Input/output handling
4. Error handling
5. Performance optimization
6. Security best practices

Provide specific, implementable suggestions.`;
  }

  /**
   * Build metadata generation prompt
   */
  buildMetadataPrompt(canvasData) {
    const summary = this.summarizeAgent(canvasData);

    return `Generate comprehensive metadata for this AI agent:

${summary.nodes}

Generate:
1. A concise name (2-4 words)
2. A short description (1 sentence)
3. A detailed description (2-3 sentences)
4. Relevant tags (5-10 keywords)
5. Use cases (3-5 examples)
6. Target audience

Format as JSON.`;
  }

  /**
   * Build cycle evaluation prompt
   */
  buildCycleEvaluationPrompt(canvasData) {
    const summary = this.summarizeAgent(canvasData);

    return `Evaluate the execution cycles/flows of this AI agent:

${summary.nodes}
${summary.connections}

Analyze:
1. Flow coherence and logic
2. Potential bottlenecks
3. Risk of infinite loops
4. Missing error handling
5. Dependency issues
6. Optimization opportunities

Provide detailed analysis.`;
  }

  /**
   * Summarize agent for prompts
   */
  summarizeAgent(canvasData) {
    const nodes = canvasData.nodes.map(node =>
      `- ${node.type}: ${JSON.stringify(node.config)}`
    ).join('\n');

    const connections = canvasData.connections.map(conn =>
      `- ${conn.from} → ${conn.to}`
    ).join('\n');

    return {
      nodes,
      connections
    };
  }

  /**
   * Parse AI suggestions
   */
  parseSuggestions(aiResponse) {
    // TODO: Parse structured suggestions from AI response
    // For now, return raw response split by lines
    return aiResponse.split('\n').filter(line => line.trim().length > 0);
  }

  /**
   * Parse improvements
   */
  parseImprovements(aiResponse) {
    // TODO: Parse structured improvements
    return aiResponse.split('\n').filter(line => line.trim().length > 0);
  }

  /**
   * Parse metadata
   */
  parseMetadata(aiResponse) {
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse metadata JSON:', error);
    }

    // Fallback to basic parsing
    return {
      name: 'AI Agent',
      description: 'Generated by MCP Forge',
      tags: ['ai', 'agent'],
      raw: aiResponse
    };
  }

  /**
   * Parse cycle evaluation
   */
  parseCycleEvaluation(aiResponse) {
    return {
      analysis: aiResponse,
      issues: [],
      recommendations: []
    };
  }

  /**
   * Quick validation (client-side only, no AI)
   */
  quickValidate(canvasData) {
    const issues = [];
    const warnings = [];

    // Check for agent node
    const hasAgent = canvasData.nodes.some(n => n.type.includes('-agent'));
    if (!hasAgent) {
      issues.push('No AI agent node found');
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set();
    canvasData.connections.forEach(conn => {
      connectedNodeIds.add(conn.from);
      connectedNodeIds.add(conn.to);
    });

    const disconnected = canvasData.nodes.filter(node =>
      !connectedNodeIds.has(node.id)
    ).length;

    if (disconnected > 0) {
      warnings.push(`${disconnected} disconnected node(s)`);
    }

    // Check for cycles
    if (this.detectCycles(canvasData)) {
      warnings.push('Potential infinite loop detected');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Detect cycles in graph
   */
  detectCycles(canvasData) {
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
