/**
 * MCP Forge Backend Server
 * Handles agent export, validation, and dry-run operations
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const Exporter = require('./exporter');
const Validator = require('./validator');
const DryRunner = require('./dry_runner');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Initialize modules
const exporter = new Exporter();
const validator = new Validator();
const dryRunner = new DryRunner();

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'MCP Forge Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Export agent to YAML
 */
app.post('/api/export/yaml', async (req, res) => {
  try {
    const { agentData } = req.body;

    if (!agentData) {
      return res.status(400).json({ error: 'Agent data is required' });
    }

    const yaml = exporter.exportToYAML(agentData);

    res.json({
      success: true,
      content: yaml,
      format: 'yaml',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('YAML export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Export agent to JSON
 */
app.post('/api/export/json', async (req, res) => {
  try {
    const { agentData } = req.body;

    if (!agentData) {
      return res.status(400).json({ error: 'Agent data is required' });
    }

    const json = exporter.exportToJSON(agentData);

    res.json({
      success: true,
      content: json,
      format: 'json',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Export agent to n8n workflow
 */
app.post('/api/export/n8n', async (req, res) => {
  try {
    const { agentData } = req.body;

    if (!agentData) {
      return res.status(400).json({ error: 'Agent data is required' });
    }

    const workflow = exporter.exportToN8N(agentData);

    res.json({
      success: true,
      content: workflow,
      format: 'n8n',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('n8n export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate agent structure
 */
app.post('/api/validate/structure', async (req, res) => {
  try {
    const { agentData } = req.body;

    if (!agentData) {
      return res.status(400).json({ error: 'Agent data is required' });
    }

    const validation = validator.validateStructure(agentData);

    res.json({
      success: true,
      validation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate agent with AI
 */
app.post('/api/validate/ai', async (req, res) => {
  try {
    const { agentData, model, prompt, task } = req.body;

    if (!agentData) {
      return res.status(400).json({ error: 'Agent data is required' });
    }

    // TODO: Integrate with Claude/GPT/Gemini API
    const response = await validator.validateWithAI(agentData, model, prompt, task);

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Run dry-run simulation
 */
app.post('/api/dry-run', async (req, res) => {
  try {
    const { agentData, testInput } = req.body;

    if (!agentData) {
      return res.status(400).json({ error: 'Agent data is required' });
    }

    const results = await dryRunner.simulate(agentData, testInput);

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dry-run error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Save agent project
 */
app.post('/api/save', async (req, res) => {
  try {
    const { agentData, filename } = req.body;

    if (!agentData) {
      return res.status(400).json({ error: 'Agent data is required' });
    }

    const savePath = path.join(__dirname, '../../data/agents_preview', filename || `agent_${Date.now()}.json`);
    fs.writeFileSync(savePath, JSON.stringify(agentData, null, 2));

    res.json({
      success: true,
      path: savePath,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Load agent project
 */
app.get('/api/load/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const loadPath = path.join(__dirname, '../../data/agents_preview', `${id}.json`);

    if (!fs.existsSync(loadPath)) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agentData = JSON.parse(fs.readFileSync(loadPath, 'utf-8'));

    res.json({
      success: true,
      data: agentData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List agent templates
 */
app.get('/api/templates', async (req, res) => {
  try {
    const templatesPath = path.join(__dirname, 'agent_templates');
    const templates = fs.readdirSync(templatesPath)
      .filter(file => file.endsWith('.yaml'))
      .map(file => ({
        id: file.replace('.yaml', ''),
        name: file.replace('.yaml', '').replace(/_/g, ' '),
        path: path.join(templatesPath, file)
      }));

    res.json({
      success: true,
      templates,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Templates list error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Deploy agent to Skynet
 */
app.post('/api/deploy', async (req, res) => {
  try {
    const { agentData, targetPath } = req.body;

    if (!agentData) {
      return res.status(400).json({ error: 'Agent data is required' });
    }

    // Export to YAML
    const yaml = exporter.exportToYAML(agentData);

    // Save to target path
    const deployPath = targetPath || process.env.SKYNET_AGENTS_PATH || '/agents/';
    const filename = `${agentData.metadata?.name || 'agent'}.yaml`;
    const fullPath = path.join(deployPath, filename);

    fs.writeFileSync(fullPath, yaml);

    res.json({
      success: true,
      path: fullPath,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Error handling
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.url
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log('🔥 MCP Forge Backend Server');
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`⏰ Started at ${new Date().toISOString()}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/export/yaml');
  console.log('  POST /api/export/json');
  console.log('  POST /api/export/n8n');
  console.log('  POST /api/validate/structure');
  console.log('  POST /api/validate/ai');
  console.log('  POST /api/dry-run');
  console.log('  POST /api/save');
  console.log('  GET  /api/load/:id');
  console.log('  GET  /api/templates');
  console.log('  POST /api/deploy');
  console.log('');
});

module.exports = app;
