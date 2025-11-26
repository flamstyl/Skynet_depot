/**
 * API Routes
 * REST API endpoints for Claude DevBox
 */

import express from 'express';
import logger from '../services/logger.js';
import { broadcastFixAttempt, broadcastFixSuccess } from '../services/ws.js';

const router = express.Router();

// Middleware to attach services
router.use((req, res, next) => {
    req.services = req.app.locals.services;
    next();
});

// ============================================================================
// EXECUTION ENDPOINTS
// ============================================================================

/**
 * POST /api/run
 * Execute code in Docker sandbox
 */
router.post('/run', async (req, res) => {
    try {
        const { code, language, args, env, timeout, autofix, maxRetries } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                error: 'Missing required fields: code, language'
            });
        }

        logger.info(`Running ${language} code${autofix ? ' with autofix' : ''}...`);

        let result;

        if (autofix) {
            // Use auto-fixer
            result = await req.services.autoFixer.fix(code, language, {
                maxRetries: maxRetries || 5,
                timeout: timeout || 300000
            });

            // Broadcast fix attempts
            if (result.history) {
                result.history.forEach((attempt, index) => {
                    if (attempt.error || attempt.stderr) {
                        broadcastFixAttempt(
                            index + 1,
                            maxRetries || 5,
                            attempt.stderr || attempt.error,
                            'fixing'
                        );
                    }
                });
            }

            if (result.success) {
                broadcastFixSuccess(result.attempts, result.finalCode, result.duration);
            }

        } else {
            // Direct execution
            result = await req.services.docker.execute(code, language, {
                args,
                env,
                timeout: timeout || 30000
            });
        }

        // Create snapshot
        const snapshotDir = await req.services.fileManager.createSnapshot(
            result.runId || 'unknown',
            code,
            language
        );

        // Save logs
        await req.services.fileManager.saveRunLogs(snapshotDir, result);

        res.json(result);

    } catch (error) {
        logger.error('Run error:', error);
        res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * POST /api/exec
 * Execute command in container
 */
router.post('/exec', async (req, res) => {
    try {
        const { command, workdir, containerId } = req.body;

        if (!command) {
            return res.status(400).json({
                error: 'Missing required field: command'
            });
        }

        const result = await req.services.docker.exec(containerId, command);

        res.json(result);

    } catch (error) {
        logger.error('Exec error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/lint
 * Run linters on code
 */
router.post('/lint', async (req, res) => {
    try {
        const { code, language, linters } = req.body;

        // TODO: Implement linting logic
        // For now, return a stub

        res.json({
            results: {
                message: 'Linting not yet implemented',
                language,
                linters: linters || []
            }
        });

    } catch (error) {
        logger.error('Lint error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/build
 * Build project
 */
router.post('/build', async (req, res) => {
    try {
        const { language, buildTool, command } = req.body;

        logger.info(`Building ${language} project with ${buildTool}...`);

        // Execute build command
        const fullCommand = `${buildTool} ${command}`;
        const result = await req.services.docker.execute(
            fullCommand,
            'bash',
            { timeout: 120000 }
        );

        res.json({
            success: result.exitCode === 0,
            stdout: result.stdout,
            stderr: result.stderr,
            artifacts: [], // TODO: Detect build artifacts
            duration: result.duration
        });

    } catch (error) {
        logger.error('Build error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// AUTO-FIX ENDPOINTS
// ============================================================================

/**
 * POST /api/autofix
 * Trigger auto-correction loop
 */
router.post('/autofix', async (req, res) => {
    try {
        const { code, language, maxRetries, timeout, context } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                error: 'Missing required fields: code, language'
            });
        }

        logger.info(`Starting auto-fix for ${language} code...`);

        const result = await req.services.autoFixer.fix(code, language, {
            maxRetries: maxRetries || 5,
            timeout: timeout || 300000,
            context: context || ''
        });

        // Broadcast progress
        if (result.history) {
            result.history.forEach((attempt, index) => {
                if (attempt.error || attempt.stderr) {
                    broadcastFixAttempt(
                        index + 1,
                        maxRetries || 5,
                        attempt.stderr || attempt.error,
                        'fixing'
                    );
                }
            });
        }

        if (result.success) {
            broadcastFixSuccess(result.attempts, result.finalCode, result.duration);
        }

        res.json(result);

    } catch (error) {
        logger.error('Autofix error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// FILE MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/files
 * List files in workspace
 */
router.get('/files', async (req, res) => {
    try {
        const { path } = req.query;

        const files = await req.services.fileManager.listFiles(path);

        res.json({ files });

    } catch (error) {
        logger.error('List files error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/files/read
 * Read file content
 */
router.get('/files/read', async (req, res) => {
    try {
        const { path } = req.query;

        if (!path) {
            return res.status(400).json({ error: 'Missing required parameter: path' });
        }

        const fileData = await req.services.fileManager.readFile(path);

        res.json(fileData);

    } catch (error) {
        logger.error('Read file error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/files/write
 * Write file to workspace
 */
router.post('/files/write', async (req, res) => {
    try {
        const { path, content, encoding } = req.body;

        if (!path || content === undefined) {
            return res.status(400).json({
                error: 'Missing required fields: path, content'
            });
        }

        const result = await req.services.fileManager.writeFile(path, content, encoding);

        res.json(result);

    } catch (error) {
        logger.error('Write file error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/files
 * Delete file or directory
 */
router.delete('/files', async (req, res) => {
    try {
        const { path } = req.body;

        if (!path) {
            return res.status(400).json({ error: 'Missing required field: path' });
        }

        const result = await req.services.fileManager.deleteFile(path);

        res.json(result);

    } catch (error) {
        logger.error('Delete file error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// LOGS & HISTORY ENDPOINTS
// ============================================================================

/**
 * GET /api/logs/:runId
 * Retrieve logs for specific run
 */
router.get('/logs/:runId', async (req, res) => {
    try {
        const { runId } = req.params;

        // TODO: Implement log retrieval from runs directory

        res.json({
            runId,
            logs: [],
            message: 'Log retrieval not yet implemented'
        });

    } catch (error) {
        logger.error('Get logs error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/runs
 * List recent runs
 */
router.get('/runs', async (req, res) => {
    try {
        const { limit = 20, offset = 0, success } = req.query;

        // TODO: Implement runs listing from runs directory

        res.json({
            runs: [],
            total: 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            message: 'Runs listing not yet implemented'
        });

    } catch (error) {
        logger.error('List runs error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// VM TESTING ENDPOINTS
// ============================================================================

/**
 * POST /api/vm/test/linux
 * Test code in Linux VM
 */
router.post('/vm/test/linux', async (req, res) => {
    try {
        const { code, distribution, testScript, snapshot } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Missing required field: code' });
        }

        // TODO: Implement Linux VM testing
        logger.info(`Testing on Linux VM (${distribution || 'ubuntu-22.04'})...`);

        res.json({
            success: true,
            vmId: 'linux-vm-1',
            stdout: 'VM testing not yet implemented\n',
            stderr: '',
            testResults: {
                passed: 0,
                failed: 0,
                skipped: 0
            },
            message: 'Linux VM testing stub - implementation pending'
        });

    } catch (error) {
        logger.error('Linux VM test error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/vm/test/windows
 * Test code in Windows VM
 */
router.post('/vm/test/windows', async (req, res) => {
    try {
        const { code, version, testScript, snapshot } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Missing required field: code' });
        }

        // TODO: Implement Windows VM testing
        logger.info(`Testing on Windows VM (${version || 'Windows-10'})...`);

        res.json({
            success: true,
            vmId: 'windows-vm-1',
            stdout: 'VM testing not yet implemented\n',
            stderr: '',
            testResults: {
                passed: 0,
                failed: 0,
                skipped: 0
            },
            message: 'Windows VM testing stub - implementation pending'
        });

    } catch (error) {
        logger.error('Windows VM test error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
    try {
        const dockerStatus = req.services.docker.getStatus();
        const workspaceInfo = req.services.fileManager.getWorkspaceInfo();

        res.json({
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            docker: dockerStatus,
            workspace: workspaceInfo,
            vms: {
                linux: 'not_implemented',
                windows: 'not_implemented'
            }
        });

    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

export default router;
