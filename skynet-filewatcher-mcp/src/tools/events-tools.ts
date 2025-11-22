/**
 * 📊 Events Tools
 * MCP Tools pour gérer les événements de surveillance
 */

import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { EventsStore } from '../events-store.js';
import { calculateFileHash } from '../hash-utils.js';

// ==================== SCHEMAS ====================

export const getEventsSchema = z.object({
  since: z.string().optional().describe('Date de début (ISO 8601)'),
  until: z.string().optional().describe('Date de fin (ISO 8601)'),
  event_type: z
    .enum(['created', 'modified', 'deleted', 'renamed'])
    .optional()
    .describe("Type d'événement"),
  watcher_id: z.string().optional().describe('Filtrer par watcher ID'),
  limit: z.number().optional().describe('Nombre maximum de résultats (défaut: 100)'),
});

export const getEventStatsSchema = z.object({
  watcher_id: z.string().optional().describe('Statistiques pour un watcher spécifique'),
}).passthrough();

export const exportEventsSchema = z.object({
  format: z.enum(['json', 'jsonl', 'csv']).optional().describe('Format d\'export (défaut: json)'),
  since: z.string().optional().describe('Date de début'),
  until: z.string().optional().describe('Date de fin'),
  output_path: z.string().optional().describe('Chemin du fichier de sortie (optionnel)'),
});

export const clearEventsSchema = z.object({
  before_date: z.string().describe('Supprimer les événements avant cette date (ISO 8601)'),
});

export const getFileHashSchema = z.object({
  file_path: z.string().describe('Chemin du fichier'),
  algorithm: z
    .enum(['sha256', 'sha1', 'md5'])
    .optional()
    .describe('Algorithme de hash (défaut: sha256)'),
});

// ==================== HANDLERS ====================

/**
 * Récupère les événements avec filtres
 */
export async function getEvents(
  args: z.infer<typeof getEventsSchema>,
  eventsStore: EventsStore
): Promise<string> {
  try {
    const events = eventsStore.getEvents({
      since: args.since,
      until: args.until,
      event_type: args.event_type,
      watcher_id: args.watcher_id,
      limit: args.limit || 100,
    });

    return JSON.stringify(
      {
        success: true,
        count: events.length,
        total_stored: eventsStore.getCount(),
        events: events,
      },
      null,
      2
    );
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Calcule des statistiques sur les événements
 */
export async function getEventStats(
  args: z.infer<typeof getEventStatsSchema>,
  eventsStore: EventsStore
): Promise<string> {
  try {
    const stats = eventsStore.getStats(args.watcher_id);

    return JSON.stringify(
      {
        success: true,
        watcher_id: args.watcher_id || 'all',
        stats,
      },
      null,
      2
    );
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Exporte les événements dans un fichier
 */
export async function exportEvents(
  args: z.infer<typeof exportEventsSchema>,
  eventsStore: EventsStore
): Promise<string> {
  try {
    const format = args.format || 'json';
    const content = eventsStore.exportEvents(format);

    let outputPath = args.output_path;
    if (!outputPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      outputPath = join(process.cwd(), `events-export-${timestamp}.${format}`);
    }

    await writeFile(outputPath, content, 'utf-8');

    return JSON.stringify({
      success: true,
      file_path: outputPath,
      format,
      size_bytes: content.length,
      message: `Événements exportés vers ${outputPath}`,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Nettoie les événements avant une date
 */
export async function clearEvents(
  args: z.infer<typeof clearEventsSchema>,
  eventsStore: EventsStore
): Promise<string> {
  try {
    const deleted = await eventsStore.clearEventsBefore(args.before_date);

    return JSON.stringify({
      success: true,
      deleted_count: deleted,
      remaining_count: eventsStore.getCount(),
      message: `${deleted} événements supprimés`,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Calcule le hash d'un fichier
 */
export async function getFileHash(
  args: z.infer<typeof getFileHashSchema>
): Promise<string> {
  try {
    const hash = await calculateFileHash(args.file_path, args.algorithm || 'sha256');

    return JSON.stringify({
      success: true,
      file_path: args.file_path,
      algorithm: args.algorithm || 'sha256',
      hash,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
