import express from 'express';
import { runCode, stopExecution } from '../modules/docker_runner.js';
import { getWorkspaceFiles, readFile, saveFile, deleteFile } from '../modules/file_manager.js';
import { autoFixCode } from '../modules/autofix_engine.js';
import { getRunHistory, getRunDetails } from '../modules/logging.js';
import { testInVM } from '../modules/vm_manager.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ============= EXECUTION ENDPOINTS =============

/**
 * POST /api/run
 * Execute code in Docker sandbox
 */
router.post('/run', async (req, res) => {
  try {
    const { code, language, filename, autoFix = false } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    logger.info(`Executing ${language} code${filename ? ` (${filename})` : ''}`);

    const result = await runCode({
      code,
      language,
      filename,
      autoFix
    });

    res.json(result);
  } catch (error) {
    logger.error('Execution failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/exec
 * Execute arbitrary command in Docker sandbox
 * Note: Commands are executed in isolated Docker container for security
 */
router.post('/exec', async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Basic input validation to prevent command injection
    if (typeof command !== 'string') {
      return res.status(400).json({ error: 'Command must be a string' });
    }

    // Reject commands that attempt to escape the sandbox
    const dangerousPatterns = [
      /\$\(/g,           // Command substitution
      /`/g,              // Backticks
      /\|\|/g,           // OR operator
      /&&/g,             // AND operator  
      /;/g,              // Command separator
      />/g,              // Redirection
      /<\(/g,            // Process substitution
      /\n/g,             // Newlines
      /\r/g              // Carriage returns
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        logger.warn(`Rejected potentially dangerous command: ${command}`);
        return res.status(400).json({ 
          error: 'Command contains potentially dangerous characters or patterns',
          hint: 'Commands are limited to simple single commands for security'
        });
      }
    }

    logger.info(`Executing command: ${command}`);

    const result = await runCode({
      code: command,
      language: 'shell',
      isCommand: true
    });

    res.json(result);
  } catch (error) {
    logger.error('Command execution failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/stop
 * Stop current execution
 */
router.post('/stop', async (req, res) => {
  try {
    await stopExecution();
    res.json({ success: true, message: 'Execution stopped' });
  } catch (error) {
    logger.error('Failed to stop execution:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= AUTO-FIX ENDPOINTS =============

/**
 * POST /api/autofix
 * Request Claude to fix code based on errors
 */
router.post('/autofix', async (req, res) => {
  try {
    const { code, stderr, language } = req.body;

    if (!code || !stderr) {
      return res.status(400).json({ error: 'Code and stderr are required' });
    }

    logger.info('Requesting auto-fix from Claude');

    const fixedCode = await autoFixCode({
      code,
      stderr,
      language
    });

    res.json({ fixedCode });
  } catch (error) {
    logger.error('Auto-fix failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= WORKSPACE ENDPOINTS =============

/**
 * GET /api/workspace/files
 * Get all files in workspace
 */
router.get('/workspace/files', async (req, res) => {
  try {
    const files = await getWorkspaceFiles();
    res.json({ files });
  } catch (error) {
    logger.error('Failed to get workspace files:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/workspace/file
 * Read a specific file
 */
router.get('/workspace/file', async (req, res) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const content = await readFile(path);
    res.json({ content });
  } catch (error) {
    logger.error('Failed to read file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/workspace/save
 * Save a file to workspace
 */
router.post('/workspace/save', async (req, res) => {
  try {
    const { filename, content } = req.body;

    if (!filename || content === undefined) {
      return res.status(400).json({ error: 'Filename and content are required' });
    }

    await saveFile(filename, content);
    res.json({ success: true, message: `Saved ${filename}` });
  } catch (error) {
    logger.error('Failed to save file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/workspace/file
 * Delete a file from workspace
 */
router.delete('/workspace/file', async (req, res) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }

    await deleteFile(path);
    res.json({ success: true, message: `Deleted ${path}` });
  } catch (error) {
    logger.error('Failed to delete file:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= VM TESTING ENDPOINTS =============

/**
 * POST /api/vm/test
 * Test code in Linux/Windows VM
 */
router.post('/vm/test', async (req, res) => {
  try {
    const { code, os, language } = req.body;

    if (!code || !os) {
      return res.status(400).json({ error: 'Code and OS are required' });
    }

    logger.info(`Testing in ${os} VM`);

    const result = await testInVM({
      code,
      os,
      language
    });

    res.json(result);
  } catch (error) {
    logger.error('VM test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= LOGGING ENDPOINTS =============

/**
 * GET /api/runs
 * Get execution history
 */
router.get('/runs', async (req, res) => {
  try {
    const history = await getRunHistory();
    res.json({ runs: history });
  } catch (error) {
    logger.error('Failed to get run history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/runs/:id
 * Get details of a specific run
 */
router.get('/runs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const details = await getRunDetails(id);

    if (!details) {
      return res.status(404).json({ error: 'Run not found' });
    }

    res.json(details);
  } catch (error) {
    logger.error('Failed to get run details:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= MCP BRIDGE ENDPOINTS =============

/**
 * POST /api/mcp/claude
 * Send request to Claude via MCP
 */
router.post('/mcp/claude', async (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // TODO: Implement MCP bridge to Claude
    logger.info('MCP request to Claude');

    res.json({
      response: 'MCP bridge not yet implemented',
      status: 'pending'
    });
  } catch (error) {
    logger.error('MCP request failed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
