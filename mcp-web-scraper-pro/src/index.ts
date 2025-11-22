#!/usr/bin/env node

import { runServer } from './server.js';
import * as dotenv from 'dotenv';

dotenv.config();

runServer().catch((error) => {
  console.error('Erreur fatale lors du démarrage du serveur MCP :', error);
  process.exit(1);
});
