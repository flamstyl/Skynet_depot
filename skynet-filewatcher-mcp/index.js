#!/usr/bin/env node
/**
 * Skynet FileWatcher MCP Server
 * Serveur MCP pour surveiller les changements de fichiers en temps réel
 *
 * @author Skynet Project
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileWatcher } from './tools/filewatcher.js';
import {
  readEvents,
  cleanOldEvents,
  getEventStats,
  formatBytes,
  ensureDir
} from './tools/utils.js';

// Obtenir le répertoire courant en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Charge la configuration depuis config.json
 */
async function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ Erreur de chargement de la configuration:', error.message);
    console.error('💡 Utilisation de la configuration par défaut');

    return {
      watchPath: process.env.WATCH_PATH || '/tmp/skynet-watch',
      logPath: './logs/events.jsonl',
      options: {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        },
        ignored: ['**/node_modules/**', '**/.git/**'],
        depth: 99
      },
      features: {
        calculateHash: true,
        trackFileSize: true,
        maxEventsInMemory: 10000
      }
    };
  }
}

/**
 * Initialisation du serveur MCP
 */
async function main() {
  console.log('🚀 Démarrage de Skynet FileWatcher MCP Server...\n');

  // Charger la configuration
  const config = await loadConfig();

  // Résoudre le chemin absolu du log
  config.logPath = path.resolve(__dirname, config.logPath);

  // Assurer que le dossier de logs existe
  await ensureDir(path.dirname(config.logPath));

  console.log('📋 Configuration chargée:');
  console.log(`   - Dossier surveillé: ${config.watchPath}`);
  console.log(`   - Fichier de log: ${config.logPath}`);
  console.log(`   - Calcul de hash: ${config.features.calculateHash ? 'Activé' : 'Désactivé'}`);
  console.log('');

  // Créer l'instance du FileWatcher
  const fileWatcher = new FileWatcher(config);

  // Démarrer la surveillance
  await fileWatcher.start();

  // Créer le serveur MCP
  const server = new Server(
    {
      name: 'skynet-filewatcher-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * Handler pour lister les outils disponibles
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'detect_changes',
          description: 'Récupère les événements de changement de fichiers détectés. Peut être filtré par timestamp, type d\'événement, pattern de fichier, ou limité en nombre.',
          inputSchema: {
            type: 'object',
            properties: {
              since_timestamp: {
                type: 'string',
                description: 'Timestamp ISO 8601 optionnel pour filtrer les événements depuis une date (ex: 2025-11-22T20:00:00Z)',
              },
              event_type: {
                type: 'string',
                description: 'Type d\'événement à filtrer: created, modified, deleted, renamed',
                enum: ['created', 'modified', 'deleted', 'renamed'],
              },
              file_pattern: {
                type: 'string',
                description: 'Expression régulière pour filtrer les chemins de fichiers (ex: ".*\\.js$" pour les fichiers JS)',
              },
              limit: {
                type: 'number',
                description: 'Nombre maximum d\'événements à retourner (par défaut: tous)',
              },
            },
          },
        },
        {
          name: 'get_watch_status',
          description: 'Retourne le statut actuel du système de surveillance de fichiers, incluant les statistiques et la configuration.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_event_stats',
          description: 'Calcule des statistiques détaillées sur les événements enregistrés (nombre total, répartition par type, plage de dates, etc.).',
          inputSchema: {
            type: 'object',
            properties: {
              since_timestamp: {
                type: 'string',
                description: 'Timestamp ISO 8601 optionnel pour calculer les stats depuis une date',
              },
            },
          },
        },
        {
          name: 'clean_old_events',
          description: 'Supprime les événements plus anciens qu\'une durée spécifiée pour libérer de l\'espace disque.',
          inputSchema: {
            type: 'object',
            properties: {
              max_age_hours: {
                type: 'number',
                description: 'Âge maximum des événements à conserver en heures (par défaut: 24h)',
              },
            },
            required: [],
          },
        },
        {
          name: 'search_events',
          description: 'Recherche avancée dans les événements avec support de multiples filtres combinés.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Terme de recherche dans les chemins de fichiers',
              },
              event_types: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['created', 'modified', 'deleted', 'renamed'],
                },
                description: 'Liste des types d\'événements à inclure',
              },
              start_date: {
                type: 'string',
                description: 'Date de début (ISO 8601)',
              },
              end_date: {
                type: 'string',
                description: 'Date de fin (ISO 8601)',
              },
              limit: {
                type: 'number',
                description: 'Nombre maximum de résultats',
              },
            },
          },
        },
      ],
    };
  });

  /**
   * Handler pour exécuter les outils
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'detect_changes': {
          const events = await readEvents(config.logPath, args || {});

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  count: events.length,
                  events: events,
                  filters_applied: args || {},
                }, null, 2),
              },
            ],
          };
        }

        case 'get_watch_status': {
          const status = fileWatcher.getStatus();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  status: status,
                }, null, 2),
              },
            ],
          };
        }

        case 'get_event_stats': {
          const filters = args || {};
          const events = await readEvents(config.logPath, filters);
          const stats = getEventStats(events);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  stats: {
                    ...stats,
                    total_size_changed_formatted: formatBytes(stats.total_size_changed),
                  },
                  period: filters.since_timestamp ? `Depuis ${filters.since_timestamp}` : 'Tous les événements',
                }, null, 2),
              },
            ],
          };
        }

        case 'clean_old_events': {
          const maxAgeHours = args?.max_age_hours || 24;
          const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
          const removed = await cleanOldEvents(config.logPath, maxAgeMs);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  removed_count: removed,
                  max_age_hours: maxAgeHours,
                  message: `${removed} événement(s) supprimé(s)`,
                }, null, 2),
              },
            ],
          };
        }

        case 'search_events': {
          let events = await readEvents(config.logPath, {});

          // Filtrer par requête de recherche
          if (args?.query) {
            const query = args.query.toLowerCase();
            events = events.filter(e => e.file_path.toLowerCase().includes(query));
          }

          // Filtrer par types d'événements
          if (args?.event_types && args.event_types.length > 0) {
            events = events.filter(e => args.event_types.includes(e.event_type));
          }

          // Filtrer par plage de dates
          if (args?.start_date) {
            const startDate = new Date(args.start_date);
            events = events.filter(e => new Date(e.timestamp) >= startDate);
          }

          if (args?.end_date) {
            const endDate = new Date(args.end_date);
            events = events.filter(e => new Date(e.timestamp) <= endDate);
          }

          // Limiter le nombre de résultats
          if (args?.limit && args.limit > 0) {
            events = events.slice(-args.limit);
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  count: events.length,
                  events: events,
                  search_params: args || {},
                }, null, 2),
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `Outil inconnu: ${name}`,
                }),
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              stack: error.stack,
            }),
          },
        ],
        isError: true,
      };
    }
  });

  // Créer et démarrer le transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log('✅ Serveur MCP démarré avec succès');
  console.log('📡 Écoute sur stdio pour les connexions MCP...\n');

  // Gestion propre de l'arrêt
  process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du serveur...');
    await fileWatcher.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Arrêt du serveur...');
    await fileWatcher.stop();
    process.exit(0);
  });
}

// Démarrer le serveur
main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
