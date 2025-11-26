const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const PROMPTS_DIR = path.join(__dirname, '..', '..', 'ai_prompts');

let config = null;

/**
 * Load configuration
 */
async function loadConfig() {
  if (config) return config;

  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf8');
    config = JSON.parse(data);
    return config;
  } catch (error) {
    console.error('[IA] Config not found, using defaults');
    config = {
      provider: 'claude',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-sonnet-4-5',
      maxTokens: 1024
    };
    return config;
  }
}

/**
 * Load a prompt template
 * @param {string} promptName - Name of the prompt file (without .md)
 * @returns {Promise<string>} - Prompt content
 */
async function loadPrompt(promptName) {
  try {
    const promptPath = path.join(PROMPTS_DIR, `${promptName}.md`);
    const content = await fs.readFile(promptPath, 'utf8');
    return content;
  } catch (error) {
    console.error(`[IA] Failed to load prompt: ${promptName}`, error);
    return '';
  }
}

/**
 * Get command suggestions from IA
 * @param {string} text - User input text
 * @param {object} context - Session context
 * @returns {Promise<array>} - Array of suggestions
 */
async function getSuggestions(text, context = {}) {
  const cfg = await loadConfig();

  // Load prompt template
  const promptTemplate = await loadPrompt('suggest_command');

  // Build prompt
  const prompt = `${promptTemplate}\n\n---\n\nUser input: ${text}\n\nContext:\n${JSON.stringify(context, null, 2)}\n\nProvide 2-3 command suggestions with safety level and explanation.`;

  try {
    let suggestions = [];

    if (cfg.provider === 'claude') {
      suggestions = await callClaude(prompt, cfg);
    } else if (cfg.provider === 'gpt') {
      suggestions = await callGPT(prompt, cfg);
    } else if (cfg.provider === 'gemini') {
      suggestions = await callGemini(prompt, cfg);
    } else {
      throw new Error(`Unknown provider: ${cfg.provider}`);
    }

    return suggestions;

  } catch (error) {
    console.error('[IA] Suggestion error:', error);
    return [];
  }
}

/**
 * Call Claude API
 */
async function callClaude(prompt, cfg) {
  if (!cfg.apiKey) {
    throw new Error('Claude API key not configured');
  }

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: cfg.model || 'claude-sonnet-4-5',
      max_tokens: cfg.maxTokens || 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      headers: {
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }
  );

  // Parse Claude response
  const text = response.data.content[0].text;
  return parseSuggestions(text);
}

/**
 * Call GPT API
 */
async function callGPT(prompt, cfg) {
  if (!cfg.apiKey) {
    throw new Error('GPT API key not configured');
  }

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: cfg.model || 'gpt-4',
      max_tokens: cfg.maxTokens || 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Parse GPT response
  const text = response.data.choices[0].message.content;
  return parseSuggestions(text);
}

/**
 * Call Gemini API
 */
async function callGemini(prompt, cfg) {
  if (!cfg.apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1/models/${cfg.model || 'gemini-pro'}:generateContent?key=${cfg.apiKey}`,
    {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  // Parse Gemini response
  const text = response.data.candidates[0].content.parts[0].text;
  return parseSuggestions(text);
}

/**
 * Parse IA response into structured suggestions
 * @param {string} text - Raw IA response
 * @returns {array} - Parsed suggestions
 */
function parseSuggestions(text) {
  // TODO: Implement robust parsing logic
  // For now, return a mock structure

  // Try to extract JSON if present
  const jsonMatch = text.match(/```json\n([\s\S]+?)\n```/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Fallback
    }
  }

  // Fallback: create basic suggestion
  return [
    {
      command: text.split('\n')[0] || text.substring(0, 100),
      safety: 'complex',
      explanation: 'AI-generated suggestion'
    }
  ];
}

/**
 * Resolve natural alias to command
 * @param {string} text - Natural language phrase
 * @returns {Promise<object>} - Resolved command
 */
async function resolveNaturalAlias(text) {
  const cfg = await loadConfig();

  // Load prompt template
  const promptTemplate = await loadPrompt('natural_alias');

  // Build prompt
  const prompt = `${promptTemplate}\n\n---\n\nUser phrase: "${text}"\n\nProvide the exact shell command, description, and suggested alias name in JSON format.`;

  try {
    let result = null;

    if (cfg.provider === 'claude') {
      result = await callClaudeForAlias(prompt, cfg);
    } else if (cfg.provider === 'gpt') {
      result = await callGPTForAlias(prompt, cfg);
    } else if (cfg.provider === 'gemini') {
      result = await callGeminiForAlias(prompt, cfg);
    }

    return result;

  } catch (error) {
    console.error('[IA] Alias resolution error:', error);
    return null;
  }
}

async function callClaudeForAlias(prompt, cfg) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: cfg.model || 'claude-sonnet-4-5',
      max_tokens: cfg.maxTokens || 512,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      headers: {
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }
  );

  const text = response.data.content[0].text;
  return parseAliasResponse(text);
}

async function callGPTForAlias(prompt, cfg) {
  // Similar to callGPT but for alias
  // TODO: Implement
  return null;
}

async function callGeminiForAlias(prompt, cfg) {
  // Similar to callGemini but for alias
  // TODO: Implement
  return null;
}

function parseAliasResponse(text) {
  // Try to extract JSON
  const jsonMatch = text.match(/```json\n([\s\S]+?)\n```/);

  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      // Fallback
    }
  }

  return null;
}

/**
 * Generate session summary
 * @param {object} sessionData - Session data
 * @returns {Promise<string>} - Summary text
 */
async function generateSessionSummary(sessionData) {
  const cfg = await loadConfig();

  // Load prompt template
  const promptTemplate = await loadPrompt('session_summary');

  // Build prompt
  const prompt = `${promptTemplate}\n\n---\n\nSession data:\n${JSON.stringify(sessionData, null, 2)}`;

  try {
    let summary = '';

    if (cfg.provider === 'claude') {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: cfg.model || 'claude-sonnet-4-5',
          max_tokens: cfg.maxTokens || 1024,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'x-api-key': cfg.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );

      summary = response.data.content[0].text;
    }

    return summary;

  } catch (error) {
    console.error('[IA] Summary generation error:', error);
    return 'Failed to generate summary';
  }
}

module.exports = {
  loadConfig,
  getSuggestions,
  resolveNaturalAlias,
  generateSessionSummary
};
