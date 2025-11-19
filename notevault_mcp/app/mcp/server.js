/**
 * NoteVault MCP Server
 * Model Context Protocol server for NoteVault
 *
 * Tools:
 * - sync_push / sync_pull / sync_resolve
 * - ai_summarize / ai_classify / ai_extract_memory / ai_rag_summary
 * - convert_to_markdown
 * - rag_backup / rag_restore
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import tools
import { syncPush, syncPull, syncResolve } from './tools/sync.js';
import { aiSummarize, aiClassify, aiExtractMemory, aiRagSummary } from './tools/ai_bridge.js';
import { convertToMarkdown } from './tools/converter.js';
import { ragBackup, ragRestore } from './tools/rag_backup.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config
const configPath = path.join(__dirname, 'config.mcp.json');
let config = {};

try {
  const configData = await fs.readFile(configPath, 'utf-8');
  config = JSON.parse(configData);
} catch (err) {
  console.warn('⚠️ Config file not found, using defaults');
  config = {
    name: 'notevault-mcp',
    version: '1.0.0',
    sync_channel: 'skynet_notevault',
    encrypted_only: true,
    ia_backend: 'claude_api',
    storage: {
      type: 'local',
      path: './data/sync/'
    }
  };
}

// Create Express app
const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.MCP_PORT || 3000;

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NoteVault MCP Server',
    version: config.version
  });
});

// MCP Tools Endpoints

// ===== SYNC TOOLS =====

app.post('/tools/sync/push', async (req, res) => {
  try {
    const { vault_blob, version, device_id } = req.body;

    if (!vault_blob || !version || !device_id) {
      return res.status(400).json({
        error: 'Missing required fields: vault_blob, version, device_id'
      });
    }

    const result = await syncPush(vault_blob, version, device_id, config);

    res.json(result);
  } catch (error) {
    console.error('Sync push error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/tools/sync/pull', async (req, res) => {
  try {
    const { device_id, last_version } = req.body;

    if (!device_id) {
      return res.status(400).json({
        error: 'Missing required field: device_id'
      });
    }

    const result = await syncPull(device_id, last_version, config);

    res.json(result);
  } catch (error) {
    console.error('Sync pull error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/tools/sync/resolve', async (req, res) => {
  try {
    const { local_version, remote_version, strategy } = req.body;

    if (!local_version || !remote_version) {
      return res.status(400).json({
        error: 'Missing required fields: local_version, remote_version'
      });
    }

    const result = await syncResolve(
      local_version,
      remote_version,
      strategy || 'merge',
      config
    );

    res.json(result);
  } catch (error) {
    console.error('Sync resolve error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== AI TOOLS =====

app.post('/tools/ai/summarize', async (req, res) => {
  try {
    const { content, format } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Missing required field: content'
      });
    }

    const result = await aiSummarize(content, format || 'medium', config);

    res.json(result);
  } catch (error) {
    console.error('AI summarize error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/tools/ai/classify', async (req, res) => {
  try {
    const { content, existing_tags } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Missing required field: content'
      });
    }

    const result = await aiClassify(content, existing_tags || [], config);

    res.json(result);
  } catch (error) {
    console.error('AI classify error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/tools/ai/extract_memory', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Missing required field: content'
      });
    }

    const result = await aiExtractMemory(content, config);

    res.json(result);
  } catch (error) {
    console.error('AI extract memory error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/tools/ai/rag_summary', async (req, res) => {
  try {
    const { note_ids, query } = req.body;

    if (!note_ids || !query) {
      return res.status(400).json({
        error: 'Missing required fields: note_ids, query'
      });
    }

    const result = await aiRagSummary(note_ids, query, config);

    res.json(result);
  } catch (error) {
    console.error('AI RAG summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== CONVERTER TOOLS =====

app.post('/tools/convert/to_markdown', async (req, res) => {
  try {
    const { content, format } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Missing required field: content'
      });
    }

    const result = await convertToMarkdown(content, format || 'txt', config);

    res.json(result);
  } catch (error) {
    console.error('Converter error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== RAG BACKUP TOOLS =====

app.post('/tools/rag/backup', async (req, res) => {
  try {
    const { index_blob } = req.body;

    if (!index_blob) {
      return res.status(400).json({
        error: 'Missing required field: index_blob'
      });
    }

    const result = await ragBackup(index_blob, config);

    res.json(result);
  } catch (error) {
    console.error('RAG backup error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/tools/rag/restore', async (req, res) => {
  try {
    const { backup_id } = req.body;

    if (!backup_id) {
      return res.status(400).json({
        error: 'Missing required field: backup_id'
      });
    }

    const result = await ragRestore(backup_id, config);

    res.json(result);
  } catch (error) {
    console.error('RAG restore error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🟣 ════════════════════════════════════════');
  console.log('   NoteVault MCP Server');
  console.log('🟣 ════════════════════════════════════════');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔧 Channel: ${config.sync_channel}`);
  console.log(`🔒 Encrypted only: ${config.encrypted_only}`);
  console.log(`🧠 AI backend: ${config.ia_backend}`);
  console.log('🟣 ════════════════════════════════════════');
  console.log('\n📦 Available tools:');
  console.log('  🔄 /tools/sync/push');
  console.log('  🔄 /tools/sync/pull');
  console.log('  🔄 /tools/sync/resolve');
  console.log('  🧠 /tools/ai/summarize');
  console.log('  🧠 /tools/ai/classify');
  console.log('  🧠 /tools/ai/extract_memory');
  console.log('  🧠 /tools/ai/rag_summary');
  console.log('  🔧 /tools/convert/to_markdown');
  console.log('  💾 /tools/rag/backup');
  console.log('  💾 /tools/rag/restore');
  console.log('\n✅ Server ready\n');
});

export default app;
