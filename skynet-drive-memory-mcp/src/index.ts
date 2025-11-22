#!/usr/bin/env node

import { DriveMemoryMcpServer } from './server.js';
import { logger } from './lib/logger.js';

async function main() {
  try {
    const server = new DriveMemoryMcpServer();
    await server.initialize();
    await server.start();
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

main();
