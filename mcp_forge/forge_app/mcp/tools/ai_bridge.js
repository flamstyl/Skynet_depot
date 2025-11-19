/**
 * AI Bridge - MCP Forge
 * Bridge to Claude, GPT, and Gemini APIs
 */

const axios = require('axios');

class AIBridge {
  constructor() {
    this.claudeAPIKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.openaiAPIKey = process.env.OPENAI_API_KEY;
    this.geminiAPIKey = process.env.GEMINI_API_KEY;
  }

  /**
   * Validate agent with AI
   */
  async validate(agentConfig, model = 'claude') {
    const prompt = this.buildValidationPrompt(agentConfig);
    const response = await this.callAI(prompt, model);
    return this.parseValidation(response);
  }

  /**
   * Get improvement suggestions
   */
  async improve(agentConfig, focusAreas = []) {
    const prompt = this.buildImprovementPrompt(agentConfig, focusAreas);
    const response = await this.callAI(prompt, 'claude');
    return this.parseImprovements(response);
  }

  /**
   * Generate metadata
   */
  async generateMetadata(agentConfig) {
    const prompt = this.buildMetadataPrompt(agentConfig);
    const response = await this.callAI(prompt, 'claude');
    return this.parseMetadata(response);
  }

  /**
   * Call AI model
   */
  async callAI(prompt, model = 'claude') {
    switch (model.toLowerCase()) {
      case 'claude':
        return await this.callClaude(prompt);

      case 'gpt':
      case 'openai':
        return await this.callGPT(prompt);

      case 'gemini':
        return await this.callGemini(prompt);

      default:
        throw new Error(`Unknown AI model: ${model}`);
    }
  }

  /**
   * Call Claude API
   */
  async callClaude(prompt) {
    if (!this.claudeAPIKey) {
      throw new Error('Claude API key not configured. Set CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable.');
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
      throw new Error(`Claude API failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Call GPT API
   */
  async callGPT(prompt) {
    if (!this.openaiAPIKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
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
      throw new Error(`GPT API failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt) {
    if (!this.geminiAPIKey) {
      throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');
    }

    // TODO: Implement Gemini API integration
    throw new Error('Gemini integration not yet implemented');
  }

  /**
   * Build validation prompt
   */
  buildValidationPrompt(agentConfig) {
    const summary = JSON.stringify(agentConfig, null, 2);

    return `Analyze this AI agent configuration for errors, inconsistencies, and potential issues:

${summary}

Please identify:
1. Structural errors or missing required fields
2. Logic inconsistencies
3. Potential infinite loops or cycle issues
4. Security concerns
5. Performance issues
6. Best practice violations

Provide specific, actionable feedback in a structured format.`;
  }

  /**
   * Build improvement prompt
   */
  buildImprovementPrompt(agentConfig, focusAreas) {
    const summary = JSON.stringify(agentConfig, null, 2);
    const focus = focusAreas.length > 0
      ? `Focus areas: ${focusAreas.join(', ')}`
      : 'General improvements';

    return `Suggest improvements for this AI agent configuration:

${summary}

${focus}

Provide specific suggestions for:
1. Agent design and architecture
2. Trigger reliability and scheduling
3. Input/output handling
4. Error handling and resilience
5. Performance optimization
6. Security best practices

Return structured, implementable suggestions.`;
  }

  /**
   * Build metadata generation prompt
   */
  buildMetadataPrompt(agentConfig) {
    const summary = JSON.stringify(agentConfig, null, 2);

    return `Generate comprehensive metadata for this AI agent:

${summary}

Generate:
1. A concise name (2-4 words, snake_case)
2. A short description (1 sentence)
3. A detailed description (2-3 sentences)
4. Relevant tags (5-10 keywords)
5. Use cases (3-5 examples)
6. Target audience

Return as JSON with keys: name, short_description, long_description, tags, use_cases, target_audience`;
  }

  /**
   * Parse validation response
   */
  parseValidation(aiResponse) {
    return {
      raw: aiResponse,
      issues: this.extractIssues(aiResponse),
      suggestions: this.extractSuggestions(aiResponse)
    };
  }

  /**
   * Parse improvement response
   */
  parseImprovements(aiResponse) {
    return {
      raw: aiResponse,
      improvements: this.extractSuggestions(aiResponse)
    };
  }

  /**
   * Parse metadata response
   */
  parseMetadata(aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse metadata JSON:', error);
    }

    // Fallback
    return {
      name: 'ai_agent',
      short_description: 'AI agent created with MCP Forge',
      tags: ['ai', 'agent'],
      raw: aiResponse
    };
  }

  /**
   * Extract issues from AI response
   */
  extractIssues(response) {
    const lines = response.split('\n');
    const issues = [];

    for (const line of lines) {
      if (line.match(/^[\d\.\-\*]\s+/)) {
        issues.push(line.replace(/^[\d\.\-\*]\s+/, '').trim());
      }
    }

    return issues.length > 0 ? issues : [response];
  }

  /**
   * Extract suggestions from AI response
   */
  extractSuggestions(response) {
    return this.extractIssues(response); // Same extraction logic
  }
}

module.exports = AIBridge;
