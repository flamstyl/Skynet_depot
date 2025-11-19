const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.mcp.json');

let config = null;

/**
 * Load MCP configuration
 */
async function loadConfig() {
  if (config) return config;

  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf8');
    config = JSON.parse(data);
    return config;
  } catch (error) {
    console.error('[ECHO_BRIDGE] Config not found, using defaults');
    config = {
      echoAgentUrl: 'http://localhost:4000',
      enabled: false
    };
    return config;
  }
}

/**
 * Push summary to Echo agent
 * @param {string} summary - Session summary
 * @param {array} tags - Optional tags
 * @returns {Promise<object>} - Result
 */
async function pushToEcho(summary, tags = []) {
  const cfg = await loadConfig();

  if (!cfg.enabled) {
    console.log('[ECHO_BRIDGE] Echo integration disabled');
    return { success: false, message: 'Echo integration disabled' };
  }

  try {
    const response = await axios.post(
      `${cfg.echoAgentUrl}/api/ingest`,
      {
        source: 'echoterm_mcp',
        type: 'terminal_session_summary',
        content: summary,
        tags: ['terminal', 'skynet', 'echoterm', ...tags],
        timestamp: new Date().toISOString()
      },
      {
        timeout: 5000
      }
    );

    console.log('[ECHO_BRIDGE] Summary pushed to Echo');

    return {
      success: true,
      echoResponse: response.data
    };

  } catch (error) {
    console.error('[ECHO_BRIDGE] Failed to push to Echo:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get insights from Echo agent
 * @param {object} context - Context data
 * @returns {Promise<object>} - Insights
 */
async function getInsightsFromEcho(context = {}) {
  const cfg = await loadConfig();

  if (!cfg.enabled) {
    console.log('[ECHO_BRIDGE] Echo integration disabled');
    return { success: false, message: 'Echo integration disabled' };
  }

  try {
    const response = await axios.post(
      `${cfg.echoAgentUrl}/api/query`,
      {
        query: 'What insights do you have about my recent terminal usage?',
        context: {
          source: 'echoterm_mcp',
          ...context
        }
      },
      {
        timeout: 10000
      }
    );

    console.log('[ECHO_BRIDGE] Insights received from Echo');

    return {
      success: true,
      insights: response.data.insights || response.data.answer
    };

  } catch (error) {
    console.error('[ECHO_BRIDGE] Failed to get insights from Echo:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Notify Echo about important terminal events
 * @param {string} eventType - Type of event
 * @param {object} eventData - Event data
 */
async function notifyEcho(eventType, eventData) {
  const cfg = await loadConfig();

  if (!cfg.enabled) {
    return;
  }

  try {
    await axios.post(
      `${cfg.echoAgentUrl}/api/events`,
      {
        source: 'echoterm_mcp',
        eventType,
        eventData,
        timestamp: new Date().toISOString()
      },
      {
        timeout: 3000
      }
    );

    console.log(`[ECHO_BRIDGE] Event '${eventType}' sent to Echo`);

  } catch (error) {
    console.error('[ECHO_BRIDGE] Failed to notify Echo:', error.message);
  }
}

module.exports = {
  pushToEcho,
  getInsightsFromEcho,
  notifyEcho
};
