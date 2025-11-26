const express = require('express');
const bodyParser = require('body-parser');
const echoBridge = require('./tools/echo_bridge');
const skynetSync = require('./tools/skynet_sync');

const app = express();
const PORT = 3738;

// Middleware
app.use(bodyParser.json());

// ========== MCP SERVER ==========

/**
 * MCP Tool: get_terminal_session
 * Returns current terminal session summary
 */
app.post('/mcp/tools/get_terminal_session', async (req, res) => {
  try {
    const axios = require('axios');
    const sessionResult = await axios.get('http://localhost:3737/memory/session');

    res.json({
      success: true,
      data: sessionResult.data.memory
    });

  } catch (error) {
    console.error('[MCP] get_terminal_session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * MCP Tool: get_command_history
 * Returns recent command history
 */
app.post('/mcp/tools/get_command_history', async (req, res) => {
  try {
    const { limit = 50 } = req.body;

    const axios = require('axios');
    const historyResult = await axios.get('http://localhost:3737/history/list', {
      params: { limit }
    });

    res.json({
      success: true,
      data: historyResult.data.history
    });

  } catch (error) {
    console.error('[MCP] get_command_history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * MCP Tool: sync_memory
 * Sync memory with other Skynet agents
 */
app.post('/mcp/tools/sync_memory', async (req, res) => {
  try {
    const { targetAgent, memoryType } = req.body;

    // TODO: Implement actual sync logic
    const result = await skynetSync.syncMemoryWithAgent(targetAgent, memoryType);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[MCP] sync_memory error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * MCP Tool: push_to_echo
 * Push session summary to Echo agent
 */
app.post('/mcp/tools/push_to_echo', async (req, res) => {
  try {
    const { summary, tags } = req.body;

    const result = await echoBridge.pushToEcho(summary, tags);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[MCP] push_to_echo error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * MCP Tool: get_insights_from_echo
 * Get insights from Echo agent
 */
app.post('/mcp/tools/get_insights_from_echo', async (req, res) => {
  try {
    const { context } = req.body;

    const insights = await echoBridge.getInsightsFromEcho(context);

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('[MCP] get_insights_from_echo error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'EchoTerm MCP server is running' });
});

// ========== SERVER START ==========

app.listen(PORT, () => {
  console.log(`╔═══════════════════════════════════════════════╗`);
  console.log(`║  EchoTerm MCP Server                          ║`);
  console.log(`║  Running on http://localhost:${PORT}          ║`);
  console.log(`╚═══════════════════════════════════════════════╝`);
});

module.exports = app;
