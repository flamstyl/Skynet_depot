/**
 * Workspace MCP Server - Point d'entrée principal
 * Serveur MCP pour Claude Code CLI
 */

import express from 'express';
import dotenv from 'dotenv';
import { log } from './core/logger.js';
import { ToolRegistry } from './core/registry.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Import des modules
import { registerDevEnvTools, devEnvHandlers } from './modules/dev_env/index.js';
import { registerDockerAdminTools, dockerAdminHandlers } from './modules/docker_admin/index.js';
import { registerServerAdminTools, serverAdminHandlers } from './modules/server_admin/index.js';
import { registerProjectOpsTools, projectOpsHandlers } from './modules/project_ops/index.js';
import { registerGraphicsToolsTools, graphicsToolsHandlers } from './modules/graphics_tools/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

// Configuration
const PORT = parseInt(process.env.MCP_PORT || '3100');
const NODE_ENV = process.env.NODE_ENV || 'development';

// Créer l'app Express
const app = express();
app.use(express.json({ limit: '50mb' }));

// Middleware de logging
app.use((req, res, next) => {
  log.debug(`${req.method} ${req.path}`, { body: req.body });
  next();
});

// Créer les dossiers data si nécessaire
async function ensureDataDirectories() {
  const dirs = [
    process.env.DATA_DIR || './data',
    process.env.CACHE_DIR || './data/cache',
    process.env.LOGS_DIR || './data/logs'
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      log.warn(`Impossible de créer le dossier: ${dir}`);
    }
  }
}

// Enregistrer tous les tools
function registerAllTools() {
  log.info('Enregistrement des tools MCP...');

  registerDevEnvTools();
  registerDockerAdminTools();
  registerServerAdminTools();
  registerProjectOpsTools();
  registerGraphicsToolsTools();

  log.info(`${ToolRegistry.count()} tools enregistrés`);
}

// ========== ENDPOINTS MCP ==========

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'workspace-mcp',
    version: '1.0.0',
    uptime: process.uptime(),
    tools: ToolRegistry.count()
  });
});

/**
 * Liste tous les tools disponibles
 */
app.get('/tools', (req, res) => {
  try {
    const tools = ToolRegistry.list();
    res.json({
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    });
  } catch (error: any) {
    log.error('Erreur lors de la liste des tools', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Appeler un tool MCP
 */
app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Le nom du tool est requis' });
    }

    // Vérifier que le tool existe
    if (!ToolRegistry.exists(name)) {
      return res.status(404).json({ error: `Tool non trouvé: ${name}` });
    }

    log.info(`Appel du tool: ${name}`, { arguments: args });

    // Dispatcher vers le bon handler
    const allHandlers = {
      ...devEnvHandlers,
      ...dockerAdminHandlers,
      ...serverAdminHandlers,
      ...projectOpsHandlers,
      ...graphicsToolsHandlers
    };

    const handler = allHandlers[name as keyof typeof allHandlers];

    if (!handler) {
      return res.status(500).json({ error: `Handler non trouvé pour: ${name}` });
    }

    const result = await handler(args || {});

    res.json(result);
  } catch (error: any) {
    log.error('Erreur lors de l\'appel du tool', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Info sur un tool spécifique
 */
app.get('/tools/:name', (req, res) => {
  const tool = ToolRegistry.get(req.params.name);

  if (!tool) {
    return res.status(404).json({ error: 'Tool non trouvé' });
  }

  res.json(tool);
});

/**
 * Statistiques du serveur
 */
app.get('/stats', (req, res) => {
  res.json({
    tools: ToolRegistry.count(),
    tools_by_module: {
      dev_env: ToolRegistry.listByModule('dev_env').length,
      docker_admin: ToolRegistry.listByModule('docker').length,
      server_admin: ToolRegistry.listByModule('server').length,
      project_ops: ToolRegistry.listByModule('project').length,
      graphics_tools: ToolRegistry.listByModule('graphics').length
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: NODE_ENV
  });
});

// ========== DÉMARRAGE ==========

async function start() {
  try {
    log.info('🚀 Démarrage du Workspace MCP Server...');

    // Créer les dossiers nécessaires
    await ensureDataDirectories();

    // Enregistrer les tools
    registerAllTools();

    // Démarrer le serveur
    app.listen(PORT, () => {
      log.info(`✅ Workspace MCP Server démarré sur http://localhost:${PORT}`);
      log.info(`📊 Environnement: ${NODE_ENV}`);
      log.info(`🔧 Tools disponibles: ${ToolRegistry.count()}`);
      log.info(``);
      log.info(`Endpoints:`);
      log.info(`  GET  /health           - Health check`);
      log.info(`  GET  /tools            - Liste des tools`);
      log.info(`  POST /tools/call       - Appeler un tool`);
      log.info(`  GET  /tools/:name      - Info sur un tool`);
      log.info(`  GET  /stats            - Statistiques`);
    });
  } catch (error: any) {
    log.error('❌ Erreur fatale au démarrage', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection', { reason });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM reçu, arrêt gracieux...');
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT reçu, arrêt gracieux...');
  process.exit(0);
});

// Démarrer le serveur
start();
