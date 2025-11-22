/**
 * 🔧 Watcher Tools
 * MCP Tools pour gérer les watchers de fichiers
 */

import { z } from 'zod';
import { WatcherManager, WatcherConfig } from '../watcher.js';

// ==================== SCHEMAS ====================

export const startWatchingSchema = z.object({
  path: z.string().describe('Chemin du dossier à surveiller'),
  recursive: z.boolean().optional().describe('Surveiller récursivement (défaut: true)'),
  ignorePatterns: z
    .array(z.string())
    .optional()
    .describe('Patterns à ignorer (glob patterns)'),
  calculateHash: z.boolean().optional().describe('Calculer les hash des fichiers (défaut: true)'),
  hashAlgorithm: z
    .enum(['sha256', 'sha1', 'md5'])
    .optional()
    .describe('Algorithme de hash (défaut: sha256)'),
});

export const stopWatchingSchema = z.object({
  watcher_id: z.string().describe('ID du watcher à arrêter'),
});

export const listWatchersSchema = z.any();

export const getWatcherSchema = z.object({
  watcher_id: z.string().describe('ID du watcher'),
});

export const updateWatcherSchema = z.object({
  watcher_id: z.string().describe('ID du watcher à mettre à jour'),
  ignorePatterns: z.array(z.string()).optional().describe('Nouveaux patterns à ignorer'),
});

// ==================== HANDLERS ====================

/**
 * Démarre la surveillance d'un dossier
 */
export async function startWatching(
  args: z.infer<typeof startWatchingSchema>,
  watcherManager: WatcherManager
): Promise<string> {
  try {
    const config: WatcherConfig = {
      path: args.path,
      recursive: args.recursive,
      ignorePatterns: args.ignorePatterns,
      calculateHash: args.calculateHash,
      hashAlgorithm: args.hashAlgorithm,
    };

    const watcherInfo = await watcherManager.startWatcher(config);

    return JSON.stringify(
      {
        success: true,
        watcher: {
          id: watcherInfo.id,
          path: watcherInfo.path,
          status: watcherInfo.status,
          startedAt: watcherInfo.startedAt,
          recursive: watcherInfo.recursive,
          ignorePatterns: watcherInfo.ignorePatterns,
        },
        message: `Watcher démarré avec succès sur ${watcherInfo.path}`,
      },
      null,
      2
    );
  } catch (error) {
    return JSON.stringify(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    );
  }
}

/**
 * Arrête un watcher
 */
export async function stopWatching(
  args: z.infer<typeof stopWatchingSchema>,
  watcherManager: WatcherManager
): Promise<string> {
  try {
    const stopped = await watcherManager.stopWatcher(args.watcher_id);

    if (!stopped) {
      return JSON.stringify({
        success: false,
        error: `Watcher ${args.watcher_id} non trouvé`,
      });
    }

    return JSON.stringify({
      success: true,
      message: `Watcher ${args.watcher_id} arrêté avec succès`,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Liste tous les watchers actifs
 */
export async function listWatchers(
  args: z.infer<typeof listWatchersSchema>,
  watcherManager: WatcherManager
): Promise<string> {
  try {
    const watchers = watcherManager.listWatchers();

    return JSON.stringify(
      {
        success: true,
        count: watchers.length,
        watchers: watchers.map((w) => ({
          id: w.id,
          path: w.path,
          status: w.status,
          startedAt: w.startedAt,
          eventsCount: w.eventsCount,
          recursive: w.recursive,
        })),
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
 * Récupère les détails d'un watcher
 */
export async function getWatcher(
  args: z.infer<typeof getWatcherSchema>,
  watcherManager: WatcherManager
): Promise<string> {
  try {
    const watcher = watcherManager.getWatcher(args.watcher_id);

    if (!watcher) {
      return JSON.stringify({
        success: false,
        error: `Watcher ${args.watcher_id} non trouvé`,
      });
    }

    return JSON.stringify(
      {
        success: true,
        watcher,
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
 * Met à jour la configuration d'un watcher
 */
export async function updateWatcher(
  args: z.infer<typeof updateWatcherSchema>,
  watcherManager: WatcherManager
): Promise<string> {
  try {
    const updated = await watcherManager.updateWatcher(args.watcher_id, {
      ignorePatterns: args.ignorePatterns,
    });

    if (!updated) {
      return JSON.stringify({
        success: false,
        error: `Watcher ${args.watcher_id} non trouvé`,
      });
    }

    return JSON.stringify({
      success: true,
      message: `Watcher ${args.watcher_id} mis à jour`,
      note: 'Le watcher doit être redémarré pour appliquer les changements',
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
