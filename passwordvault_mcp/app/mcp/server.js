/**
 * PasswordVault MCP — Main Server
 * Skynet Secure Vault v1.0
 *
 * Hub central pour:
 * - Synchronisation chiffrée
 * - Bridge IA (Claude)
 * - Proxy HIBP
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const syncTools = require('./tools/sync');
const iaBridge = require('./tools/ia_bridge');
const hibpTools = require('./tools/hibp');

const app = express();
const PORT = process.env.MCP_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ==================== Health Check ====================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'PasswordVault MCP Server',
        version: '1.0',
        timestamp: new Date().toISOString()
    });
});

// ==================== Sync Endpoints ====================

app.post('/sync/push', async (req, res) => {
    /**
     * Upload vault chiffré
     *
     * Body: {
     *   device_id: "...",
     *   vault: {...},  // Vault complet chiffré
     *   timestamp: "..."
     * }
     */
    try {
        const { device_id, vault, timestamp } = req.body;

        if (!device_id || !vault) {
            return res.status(400).json({ error: 'device_id and vault required' });
        }

        const result = await syncTools.pushVault(device_id, vault, timestamp);

        res.json({
            success: true,
            message: 'Vault synchronized',
            sync_id: result.sync_id,
            timestamp: result.timestamp
        });

    } catch (error) {
        console.error('Sync push error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/sync/pull', async (req, res) => {
    /**
     * Récupère vault chiffré
     *
     * Query: ?device_id=...
     */
    try {
        const { device_id } = req.query;

        if (!device_id) {
            return res.status(400).json({ error: 'device_id required' });
        }

        const vault = await syncTools.pullVault(device_id);

        if (vault) {
            res.json({
                success: true,
                vault: vault.data,
                timestamp: vault.timestamp,
                sync_id: vault.sync_id
            });
        } else {
            res.status(404).json({ error: 'No vault found for this device' });
        }

    } catch (error) {
        console.error('Sync pull error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/sync/status', async (req, res) => {
    /**
     * Statut de synchronisation
     *
     * Query: ?device_id=...
     */
    try {
        const { device_id } = req.query;

        if (!device_id) {
            return res.status(400).json({ error: 'device_id required' });
        }

        const status = await syncTools.getSyncStatus(device_id);

        res.json({
            success: true,
            ...status
        });

    } catch (error) {
        console.error('Sync status error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/sync/resolve', async (req, res) => {
    /**
     * Résolution de conflit
     *
     * Body: {
     *   vault1: {...},
     *   vault2: {...}
     * }
     */
    try {
        const { vault1, vault2 } = req.body;

        if (!vault1 || !vault2) {
            return res.status(400).json({ error: 'vault1 and vault2 required' });
        }

        const merged = await syncTools.resolveConflict(vault1, vault2);

        res.json({
            success: true,
            merged_vault: merged
        });

    } catch (error) {
        console.error('Conflict resolution error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== IA Bridge Endpoints ====================

app.post('/ai/audit', async (req, res) => {
    /**
     * Audit de sécurité via IA
     *
     * Body: {
     *   metadata: {
     *     password_length: 12,
     *     has_uppercase: true,
     *     has_lowercase: true,
     *     has_digits: true,
     *     has_special: true,
     *     age_days: 180
     *   }
     * }
     *
     * NOTE: Ne jamais envoyer le password en clair !
     */
    try {
        const { metadata } = req.body;

        if (!metadata) {
            return res.status(400).json({ error: 'metadata required' });
        }

        const report = await iaBridge.assessSecurity(metadata);

        res.json({
            success: true,
            report: report
        });

    } catch (error) {
        console.error('IA audit error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/ai/improve', async (req, res) => {
    /**
     * Suggestions d'amélioration
     *
     * Body: {
     *   context: {
     *     current_strength: "weak",
     *     website: "github.com",
     *     username: "user@example.com"
     *   }
     * }
     */
    try {
        const { context } = req.body;

        if (!context) {
            return res.status(400).json({ error: 'context required' });
        }

        const suggestions = await iaBridge.improvePassword(context);

        res.json({
            success: true,
            suggestions: suggestions
        });

    } catch (error) {
        console.error('IA improve error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/ai/detect-risks', async (req, res) => {
    /**
     * Détection de risques
     *
     * Body: {
     *   patterns: {
     *     reused_passwords: 3,
     *     weak_passwords: 5,
     *     old_passwords: 2
     *   }
     * }
     */
    try {
        const { patterns } = req.body;

        if (!patterns) {
            return res.status(400).json({ error: 'patterns required' });
        }

        const risks = await iaBridge.detectRisks(patterns);

        res.json({
            success: true,
            risks: risks
        });

    } catch (error) {
        console.error('Risk detection error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== HIBP Proxy ====================

app.post('/hibp/check', async (req, res) => {
    /**
     * Vérification HIBP avec cache
     *
     * Body: {
     *   hash: "..."  // SHA-1 hash (prefix 5 chars)
     * }
     */
    try {
        const { hash } = req.body;

        if (!hash) {
            return res.status(400).json({ error: 'hash required' });
        }

        const result = await hibpTools.checkHash(hash);

        res.json({
            success: true,
            result: result
        });

    } catch (error) {
        console.error('HIBP check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== Error Handling ====================

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
    });
});

// ==================== Startup ====================

async function startServer() {
    try {
        // Initialiser les modules
        await syncTools.init();
        await iaBridge.init();
        await hibpTools.init();

        // Démarrer le serveur
        app.listen(PORT, '127.0.0.1', () => {
            console.log('🔐 PasswordVault MCP Server');
            console.log('=' .repeat(50));
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📡 Endpoints:`);
            console.log(`   - GET  /health`);
            console.log(`   - POST /sync/push`);
            console.log(`   - GET  /sync/pull`);
            console.log(`   - POST /ai/audit`);
            console.log(`   - POST /ai/improve`);
            console.log(`   - POST /hibp/check`);
            console.log('');
            console.log('Press Ctrl+C to stop');
            console.log('');
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down MCP server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down MCP server...');
    process.exit(0);
});

// Start
startServer();
