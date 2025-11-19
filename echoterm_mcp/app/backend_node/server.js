const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;

const shellRunner = require('./shell_runner');
const iaBridge = require('./ia_bridge');
const aliasEngine = require('./alias_engine');
const memoryManager = require('./memory_manager');
const historyManager = require('./history_manager');

const app = express();
const PORT = 3737;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ========== ROUTES ==========

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'EchoTerm backend is running' });
});

// Shell execution
app.post('/shell/run', async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required'
      });
    }

    console.log(`[SHELL] Executing: ${command}`);

    const result = await shellRunner.execute(command);

    // Log to history
    await historyManager.addEntry({
      command,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      duration: result.duration,
      timestamp: new Date().toISOString()
    });

    // Update session memory
    await memoryManager.addCommand(command, result);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[SHELL] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stdout: '',
      stderr: error.message,
      exitCode: 1
    });
  }
});

// IA suggestion
app.post('/ia/suggest', async (req, res) => {
  try {
    const { text, context } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    console.log(`[IA] Suggesting for: ${text}`);

    const suggestions = await iaBridge.getSuggestions(text, context);

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('[IA] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      suggestions: []
    });
  }
});

// Alias resolution
app.post('/alias/resolve', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    console.log(`[ALIAS] Resolving: ${text}`);

    const result = await aliasEngine.resolve(text);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[ALIAS] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      command: null
    });
  }
});

// Alias list
app.get('/alias/list', async (req, res) => {
  try {
    const aliases = await aliasEngine.listAliases();

    res.json({
      success: true,
      aliases
    });

  } catch (error) {
    console.error('[ALIAS] List error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      aliases: []
    });
  }
});

// Alias save
app.post('/alias/save', async (req, res) => {
  try {
    const alias = req.body;

    if (!alias.natural || !alias.command) {
      return res.status(400).json({
        success: false,
        error: 'Natural phrase and command are required'
      });
    }

    await aliasEngine.saveAlias(alias);

    res.json({
      success: true,
      message: 'Alias saved successfully'
    });

  } catch (error) {
    console.error('[ALIAS] Save error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Alias delete
app.post('/alias/delete', async (req, res) => {
  try {
    const { natural } = req.body;

    if (!natural) {
      return res.status(400).json({
        success: false,
        error: 'Natural phrase is required'
      });
    }

    await aliasEngine.deleteAlias(natural);

    res.json({
      success: true,
      message: 'Alias deleted successfully'
    });

  } catch (error) {
    console.error('[ALIAS] Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// History list
app.get('/history/list', async (req, res) => {
  try {
    const { limit, offset, filter } = req.query;

    const history = await historyManager.getHistory({
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      filter: filter || null
    });

    res.json({
      success: true,
      history
    });

  } catch (error) {
    console.error('[HISTORY] List error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      history: []
    });
  }
});

// Memory - session
app.get('/memory/session', async (req, res) => {
  try {
    const memory = await memoryManager.getSessionMemory();

    res.json({
      success: true,
      memory
    });

  } catch (error) {
    console.error('[MEMORY] Session error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      memory: null
    });
  }
});

// Memory - long term
app.get('/memory/longterm', async (req, res) => {
  try {
    const memory = await memoryManager.getLongtermMemory();

    res.json({
      success: true,
      memory
    });

  } catch (error) {
    console.error('[MEMORY] Longterm error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      memory: null
    });
  }
});

// Memory - update
app.post('/memory/update', async (req, res) => {
  try {
    const data = req.body;

    await memoryManager.updateMemory(data);

    res.json({
      success: true,
      message: 'Memory updated successfully'
    });

  } catch (error) {
    console.error('[MEMORY] Update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Session summary
app.post('/session/summary', async (req, res) => {
  try {
    const summary = await memoryManager.generateSessionSummary();

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('[SESSION] Summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      summary: ''
    });
  }
});

// ========== SERVER START ==========

app.listen(PORT, () => {
  console.log(`╔═══════════════════════════════════════════════╗`);
  console.log(`║  EchoTerm MCP - Backend Server                ║`);
  console.log(`║  Running on http://localhost:${PORT}          ║`);
  console.log(`╚═══════════════════════════════════════════════╝`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[SERVER] Shutting down gracefully...');

  // Save session memory
  await memoryManager.saveSession();

  process.exit(0);
});
