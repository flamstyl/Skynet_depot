#!/usr/bin/env node
/**
 * 🔍 Skynet FileWatcher MCP Server
 * Surveillance en temps réel de fichiers avec logs JSON structurés
 *
 * @author Skynet Depot
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

// Imports des modules internes
import { EventsStore } from './events-store.js';
import { WatcherManager } from './watcher.js';

// Imports des tools
import * as WatcherTools from './tools/watcher-tools.js';
import * as EventsTools from './tools/events-tools.js';

/**
 * Initialisation du serveur MCP
 */
const server = new Server(
  {
    name: 'skynet-filewatcher',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Initialisation des stores et managers
 */
const eventsStore = new EventsStore('./logs/events.jsonl');
const watcherManager = new WatcherManager(eventsStore);

/**
 * Définition des outils MCP disponibles
 */
const tools = [
  // ==================== WATCHER MANAGEMENT ====================
  {
    name: 'start_watching',
    description: '🔍 Démarre la surveillance d\'un dossier',
    inputSchema: WatcherTools.startWatchingSchema,
    handler: (args: any) => WatcherTools.startWatching(args, watcherManager),
  },
  {
    name: 'stop_watching',
    description: '🛑 Arrête un watcher',
    inputSchema: WatcherTools.stopWatchingSchema,
    handler: (args: any) => WatcherTools.stopWatching(args, watcherManager),
  },
  {
    name: 'list_watchers',
    description: '📋 Liste tous les watchers actifs',
    inputSchema: WatcherTools.listWatchersSchema,
    handler: (args: any) => WatcherTools.listWatchers(args, watcherManager),
  },
  {
    name: 'get_watcher',
    description: '🔎 Récupère les détails d\'un watcher',
    inputSchema: WatcherTools.getWatcherSchema,
    handler: (args: any) => WatcherTools.getWatcher(args, watcherManager),
  },
  {
    name: 'update_watcher',
    description: '⚙️  Met à jour la configuration d\'un watcher',
    inputSchema: WatcherTools.updateWatcherSchema,
    handler: (args: any) => WatcherTools.updateWatcher(args, watcherManager),
  },

  // ==================== EVENTS MANAGEMENT ====================
  {
    name: 'get_events',
    description: '📊 Récupère les événements de surveillance avec filtres',
    inputSchema: EventsTools.getEventsSchema,
    handler: (args: any) => EventsTools.getEvents(args, eventsStore),
  },
  {
    name: 'get_event_stats',
    description: '📈 Calcule des statistiques sur les événements',
    inputSchema: EventsTools.getEventStatsSchema,
    handler: (args: any) => EventsTools.getEventStats(args, eventsStore),
  },
  {
    name: 'export_events',
    description: '💾 Exporte les événements dans un fichier',
    inputSchema: EventsTools.exportEventsSchema,
    handler: (args: any) => EventsTools.exportEvents(args, eventsStore),
  },
  {
    name: 'clear_events',
    description: '🗑️  Nettoie les événements avant une date',
    inputSchema: EventsTools.clearEventsSchema,
    handler: (args: any) => EventsTools.clearEvents(args, eventsStore),
  },
  {
    name: 'get_file_hash',
    description: '🔐 Calcule le hash d\'un fichier',
    inputSchema: EventsTools.getFileHashSchema,
    handler: (args: any) => EventsTools.getFileHash(args),
  },
];

/**
 * Handler pour lister les outils disponibles
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema as any, { $refStrategy: 'none' }) as any,
    })),
  };
});

/**
 * Handler pour appeler un outil
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((t) => t.name === request.params.name);

  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Outil inconnu: ${request.params.name}`);
  }

  try {
    // Valider les arguments
    const validatedArgs = tool.inputSchema.parse(request.params.arguments);

    // Exécuter le handler
    const result = await tool.handler(validatedArgs);

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new McpError(ErrorCode.InternalError, `Erreur d'exécution: ${error.message}`);
    }
    throw error;
  }
});

/**
 * Fonction principale
 */
async function main() {
  console.error('🔍 Skynet FileWatcher MCP Server');
  console.error('================================');
  console.error(`📦 Version: 1.0.0`);
  console.error(`📁 Events store: ./logs/events.jsonl`);
  console.error(`🛠️  ${tools.length} outils disponibles`);
  console.error('================================\n');

  // Initialiser le store d'événements
  await eventsStore.initialize();

  // Créer le transport stdio
  const transport = new StdioServerTransport();

  // Connecter le serveur
  await server.connect(transport);

  console.error('✅ Serveur MCP démarré et prêt\n');
}

/**
 * Gestion de l'arrêt propre
 */
process.on('SIGINT', async () => {
  console.error('\n🛑 Arrêt du serveur...');
  await watcherManager.stopAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n🛑 Arrêt du serveur...');
  await watcherManager.stopAll();
  process.exit(0);
});

// Lancer le serveur
main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
