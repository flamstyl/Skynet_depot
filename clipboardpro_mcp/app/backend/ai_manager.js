/**
 * AI Manager - Interface with MCP AI services
 */

const axios = require('axios');
const db = require('./database');
const historyManager = require('./history_manager');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3002';
const API_KEY = process.env.MCP_API_KEY || 'dev-key';

/**
 * Rewrite text
 * @param {string} text - Text to rewrite
 * @param {object} options - Rewrite options
 * @returns {Promise<object>} Rewrite result
 */
async function rewrite(text, options = {}) {
  try {
    console.log(`[AI] Rewriting text (${text.length} chars)...`);

    const response = await axios.post(
      `${MCP_SERVER_URL}/ai/rewrite`,
      {
        text,
        style: options.style || 'professional'
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const result = response.data;

    // Save transformation if history_id provided
    if (options.history_id) {
      await saveTransformation(options.history_id, 'rewrite', text, result.result, result);
    }

    return {
      success: true,
      original: text,
      result: result.result,
      provider: result.provider,
      usage: result.usage
    };
  } catch (error) {
    console.error('[AI] Rewrite failed:', error.message);
    return {
      success: false,
      error: error.message,
      original: text,
      result: text
    };
  }
}

/**
 * Translate text
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language
 * @param {object} options - Translation options
 * @returns {Promise<object>} Translation result
 */
async function translate(text, targetLanguage, options = {}) {
  try {
    console.log(`[AI] Translating text to ${targetLanguage}...`);

    const response = await axios.post(
      `${MCP_SERVER_URL}/ai/translate`,
      {
        text,
        target_language: targetLanguage,
        source_language: options.source_language || 'auto'
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const result = response.data;

    if (options.history_id) {
      await saveTransformation(options.history_id, 'translate', text, result.result, result);
    }

    return {
      success: true,
      original: text,
      result: result.result,
      target_language: targetLanguage,
      provider: result.provider,
      usage: result.usage
    };
  } catch (error) {
    console.error('[AI] Translation failed:', error.message);
    return {
      success: false,
      error: error.message,
      original: text,
      result: text
    };
  }
}

/**
 * Summarize text
 * @param {string} text - Text to summarize
 * @param {object} options - Summarization options
 * @returns {Promise<object>} Summary result
 */
async function summarize(text, options = {}) {
  try {
    console.log(`[AI] Summarizing text (${text.length} chars)...`);

    const response = await axios.post(
      `${MCP_SERVER_URL}/ai/summarize`,
      {
        text,
        length: options.length || 'medium'
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const result = response.data;

    if (options.history_id) {
      await saveTransformation(options.history_id, 'summarize', text, result.result, result);
    }

    return {
      success: true,
      original: text,
      result: result.result,
      length: options.length || 'medium',
      provider: result.provider,
      usage: result.usage
    };
  } catch (error) {
    console.error('[AI] Summarization failed:', error.message);
    return {
      success: false,
      error: error.message,
      original: text,
      result: text
    };
  }
}

/**
 * Clean and format text
 * @param {string} text - Text to clean
 * @param {object} options - Cleaning options
 * @returns {Promise<object>} Cleaned text result
 */
async function clean(text, options = {}) {
  try {
    console.log(`[AI] Cleaning text (${text.length} chars)...`);

    const response = await axios.post(
      `${MCP_SERVER_URL}/ai/clean`,
      {
        text,
        options: {
          remove_formatting: options.remove_formatting !== false,
          fix_grammar: options.fix_grammar !== false,
          normalize_whitespace: options.normalize_whitespace !== false
        }
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const result = response.data;

    if (options.history_id) {
      await saveTransformation(options.history_id, 'clean', text, result.result, result);
    }

    return {
      success: true,
      original: text,
      result: result.result,
      provider: result.provider,
      usage: result.usage
    };
  } catch (error) {
    console.error('[AI] Cleaning failed:', error.message);
    return {
      success: false,
      error: error.message,
      original: text,
      result: text
    };
  }
}

/**
 * Save AI transformation to database
 * @param {number} historyId - History entry ID
 * @param {string} action - AI action
 * @param {string} inputText - Input text
 * @param {string} outputText - Output text
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Saved transformation
 */
async function saveTransformation(historyId, action, inputText, outputText, metadata = {}) {
  const result = await db.run(
    `INSERT INTO ai_transformations (history_id, action, input_text, output_text, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [historyId, action, inputText, outputText, JSON.stringify(metadata)]
  );

  console.log(`[AI] Saved transformation #${result.lastID} for history #${historyId}`);

  return {
    id: result.lastID,
    history_id: historyId,
    action,
    input_text: inputText,
    output_text: outputText
  };
}

/**
 * Get transformations for history entry
 * @param {number} historyId - History entry ID
 * @returns {Promise<Array>} Transformations
 */
async function getTransformations(historyId) {
  const rows = await db.all(
    `SELECT * FROM ai_transformations
     WHERE history_id = ?
     ORDER BY created_at DESC`,
    [historyId]
  );

  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {}
  }));
}

/**
 * Get transformation by ID
 * @param {number} id - Transformation ID
 * @returns {Promise<object>} Transformation
 */
async function getTransformation(id) {
  const row = await db.get(
    'SELECT * FROM ai_transformations WHERE id = ?',
    [id]
  );

  if (!row) {
    return null;
  }

  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {}
  };
}

module.exports = {
  rewrite,
  translate,
  summarize,
  clean,
  saveTransformation,
  getTransformations,
  getTransformation
};
