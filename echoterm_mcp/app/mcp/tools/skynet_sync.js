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
    console.error('[SKYNET_SYNC] Config not found, using defaults');
    config = {
      skynetHubUrl: 'http://localhost:5000',
      googleDriveEnabled: false,
      ragEnabled: false,
      enabled: false
    };
    return config;
  }
}

/**
 * Sync memory with another Skynet agent
 * @param {string} targetAgent - Target agent name
 * @param {string} memoryType - Type of memory (session/longterm)
 * @returns {Promise<object>} - Sync result
 */
async function syncMemoryWithAgent(targetAgent, memoryType = 'session') {
  const cfg = await loadConfig();

  if (!cfg.enabled) {
    console.log('[SKYNET_SYNC] Skynet sync disabled');
    return { success: false, message: 'Skynet sync disabled' };
  }

  try {
    // Get memory from backend
    const memoryUrl = memoryType === 'session'
      ? 'http://localhost:3737/memory/session'
      : 'http://localhost:3737/memory/longterm';

    const memoryResult = await axios.get(memoryUrl);

    // Send to Skynet Hub
    const response = await axios.post(
      `${cfg.skynetHubUrl}/api/agents/sync`,
      {
        sourceAgent: 'echoterm_mcp',
        targetAgent,
        memoryType,
        memoryData: memoryResult.data.memory,
        timestamp: new Date().toISOString()
      },
      {
        timeout: 5000
      }
    );

    console.log(`[SKYNET_SYNC] Memory synced with ${targetAgent}`);

    return {
      success: true,
      syncResult: response.data
    };

  } catch (error) {
    console.error('[SKYNET_SYNC] Failed to sync memory:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Push session data to Google Drive (via Skynet Hub)
 * @param {object} sessionData - Session data to push
 * @returns {Promise<object>} - Result
 */
async function pushToGoogleDrive(sessionData) {
  const cfg = await loadConfig();

  if (!cfg.googleDriveEnabled) {
    console.log('[SKYNET_SYNC] Google Drive sync disabled');
    return { success: false, message: 'Google Drive sync disabled' };
  }

  try {
    const response = await axios.post(
      `${cfg.skynetHubUrl}/api/storage/drive`,
      {
        source: 'echoterm_mcp',
        folder: 'EchoTerm_Sessions',
        filename: `session_${new Date().toISOString().replace(/:/g, '-')}.json`,
        content: JSON.stringify(sessionData, null, 2)
      },
      {
        timeout: 10000
      }
    );

    console.log('[SKYNET_SYNC] Session pushed to Google Drive');

    return {
      success: true,
      driveResult: response.data
    };

  } catch (error) {
    console.error('[SKYNET_SYNC] Failed to push to Google Drive:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Push command history to RAG system
 * @param {array} historyEntries - History entries
 * @returns {Promise<object>} - Result
 */
async function pushToRAG(historyEntries) {
  const cfg = await loadConfig();

  if (!cfg.ragEnabled) {
    console.log('[SKYNET_SYNC] RAG sync disabled');
    return { success: false, message: 'RAG sync disabled' };
  }

  try {
    const response = await axios.post(
      `${cfg.skynetHubUrl}/api/rag/ingest`,
      {
        source: 'echoterm_mcp',
        collection: 'terminal_commands',
        documents: historyEntries.map(entry => ({
          id: `cmd_${entry.timestamp}`,
          content: entry.command,
          metadata: {
            timestamp: entry.timestamp,
            exitCode: entry.exitCode,
            duration: entry.duration,
            stdout: (entry.stdout || '').substring(0, 500),
            stderr: (entry.stderr || '').substring(0, 500)
          }
        }))
      },
      {
        timeout: 10000
      }
    );

    console.log('[SKYNET_SYNC] History pushed to RAG');

    return {
      success: true,
      ragResult: response.data
    };

  } catch (error) {
    console.error('[SKYNET_SYNC] Failed to push to RAG:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Query RAG for similar commands
 * @param {string} query - Query text
 * @returns {Promise<object>} - Similar commands
 */
async function querySimilarCommands(query) {
  const cfg = await loadConfig();

  if (!cfg.ragEnabled) {
    console.log('[SKYNET_SYNC] RAG query disabled');
    return { success: false, message: 'RAG query disabled' };
  }

  try {
    const response = await axios.post(
      `${cfg.skynetHubUrl}/api/rag/query`,
      {
        collection: 'terminal_commands',
        query,
        limit: 5
      },
      {
        timeout: 5000
      }
    );

    console.log('[SKYNET_SYNC] Similar commands retrieved from RAG');

    return {
      success: true,
      results: response.data.results
    };

  } catch (error) {
    console.error('[SKYNET_SYNC] Failed to query RAG:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  syncMemoryWithAgent,
  pushToGoogleDrive,
  pushToRAG,
  querySimilarCommands
};
