#!/usr/bin/env node

import { runServer } from './server.js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Lancer le serveur MCP
runServer().catch((error) => {
  console.error('Erreur fatale lors du démarrage du serveur MCP :', error);
  process.exit(1);
});
