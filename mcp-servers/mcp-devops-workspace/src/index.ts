#!/usr/bin/env node

/**
 * Point d'entrée du serveur MCP DevOps Workspace
 */

import { MCPDevOpsServer } from "./server.js";
import { logger } from "./utils/logger.js";

async function main() {
  const server = new MCPDevOpsServer();

  // Gérer les signaux pour un arrêt propre
  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down...");
    await server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down...");
    await server.stop();
    process.exit(0);
  });

  // Gérer les erreurs non capturées
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    process.exit(1);
  });

  // Démarrer le serveur
  try {
    await server.start();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
