#!/usr/bin/env node
/**
 * Point d'entrée du serveur MCP Skynet Workspace
 */

import { startMCPServer } from './server.js';

// Démarrer le serveur
startMCPServer().catch((error) => {
  console.error('Erreur fatale lors du démarrage du serveur MCP:', error);
  process.exit(1);
});
