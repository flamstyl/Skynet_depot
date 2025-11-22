/**
 * 👁️  File Watcher Manager
 * Gestion de la surveillance de fichiers avec chokidar
 */

import chokidar, { FSWatcher } from 'chokidar';
import { v4 as uuidv4 } from 'uuid';
import { relative, resolve } from 'path';
import { lookup } from 'mime-types';
import { EventsStore, FileEvent } from './events-store.js';
import { calculateFileHash, getFileSize } from './hash-utils.js';

export interface WatcherConfig {
  path: string;
  recursive?: boolean;
  ignorePatterns?: string[];
  calculateHash?: boolean;
  hashAlgorithm?: 'sha256' | 'sha1' | 'md5';
}

export interface WatcherInfo extends WatcherConfig {
  id: string;
  status: 'active' | 'stopped' | 'error';
  startedAt: string;
  eventsCount: number;
  error?: string;
}

export class WatcherManager {
  private watchers: Map<string, { config: WatcherInfo; instance: FSWatcher }> = new Map();
  private eventsStore: EventsStore;
  private fileCache: Map<string, { size: number; hash?: string }> = new Map();

  constructor(eventsStore: EventsStore) {
    this.eventsStore = eventsStore;
  }

  /**
   * Démarre un nouveau watcher
   */
  async startWatcher(config: WatcherConfig): Promise<WatcherInfo> {
    const watcherId = uuidv4();
    const resolvedPath = resolve(config.path);

    const watcherInfo: WatcherInfo = {
      id: watcherId,
      path: resolvedPath,
      recursive: config.recursive ?? true,
      ignorePatterns: config.ignorePatterns || ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      calculateHash: config.calculateHash ?? true,
      hashAlgorithm: config.hashAlgorithm ?? 'sha256',
      status: 'active',
      startedAt: new Date().toISOString(),
      eventsCount: 0,
    };

    try {
      const watcher = chokidar.watch(resolvedPath, {
        ignored: watcherInfo.ignorePatterns,
        persistent: true,
        ignoreInitial: false,
        followSymlinks: false,
        usePolling: false,
        depth: watcherInfo.recursive ? undefined : 0,
      });

      // Handler pour 'add' (fichier créé)
      watcher.on('add', async (filePath) => {
        await this.handleEvent(watcherId, 'created', filePath, resolvedPath, watcherInfo);
      });

      // Handler pour 'change' (fichier modifié)
      watcher.on('change', async (filePath) => {
        await this.handleEvent(watcherId, 'modified', filePath, resolvedPath, watcherInfo);
      });

      // Handler pour 'unlink' (fichier supprimé)
      watcher.on('unlink', async (filePath) => {
        await this.handleEvent(watcherId, 'deleted', filePath, resolvedPath, watcherInfo);
      });

      // Handler d'erreur
      watcher.on('error', (error: unknown) => {
        console.error(`⚠️  Watcher ${watcherId} error:`, error);
        watcherInfo.status = 'error';
        watcherInfo.error = error instanceof Error ? error.message : String(error);
      });

      // Handler 'ready'
      watcher.on('ready', () => {
        console.error(`✅ Watcher ${watcherId} ready, watching: ${resolvedPath}`);
      });

      this.watchers.set(watcherId, { config: watcherInfo, instance: watcher });

      console.error(`🔍 Started watcher ${watcherId} on ${resolvedPath}`);
      return watcherInfo;
    } catch (error) {
      watcherInfo.status = 'error';
      watcherInfo.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Arrête un watcher
   */
  async stopWatcher(watcherId: string): Promise<boolean> {
    const watcher = this.watchers.get(watcherId);
    if (!watcher) {
      return false;
    }

    await watcher.instance.close();
    watcher.config.status = 'stopped';
    this.watchers.delete(watcherId);

    console.error(`🛑 Stopped watcher ${watcherId}`);
    return true;
  }

  /**
   * Liste tous les watchers
   */
  listWatchers(): WatcherInfo[] {
    return Array.from(this.watchers.values()).map((w) => w.config);
  }

  /**
   * Récupère un watcher par ID
   */
  getWatcher(watcherId: string): WatcherInfo | undefined {
    return this.watchers.get(watcherId)?.config;
  }

  /**
   * Met à jour la configuration d'un watcher
   */
  async updateWatcher(watcherId: string, newConfig: Partial<WatcherConfig>): Promise<boolean> {
    const watcher = this.watchers.get(watcherId);
    if (!watcher) {
      return false;
    }

    // Pour l'instant, on ne supporte que la mise à jour des patterns d'ignore
    if (newConfig.ignorePatterns) {
      watcher.config.ignorePatterns = newConfig.ignorePatterns;
      // Note: chokidar ne supporte pas la mise à jour dynamique des patterns
      // Il faudrait redémarrer le watcher
      console.error(`⚠️  Warning: ignore patterns updated but watcher needs restart`);
    }

    return true;
  }

  /**
   * Gère un événement de fichier
   */
  private async handleEvent(
    watcherId: string,
    eventType: 'created' | 'modified' | 'deleted',
    filePath: string,
    basePath: string,
    config: WatcherInfo
  ): Promise<void> {
    try {
      const relativePath = relative(basePath, filePath);
      const mimeType = lookup(filePath) || undefined;

      let fileSize: number | undefined;
      let hashAfter: string | undefined;
      let hashBefore: string | undefined;
      let oldSize: number | undefined;

      // Pour created et modified, calculer size et hash
      if (eventType === 'created' || eventType === 'modified') {
        try {
          fileSize = await getFileSize(filePath);

          if (config.calculateHash) {
            hashAfter = await calculateFileHash(filePath, config.hashAlgorithm);
          }
        } catch (error) {
          console.error(`⚠️  Error getting file info for ${filePath}:`, error);
        }
      }

      // Pour modified, récupérer l'ancienne taille et hash du cache
      if (eventType === 'modified') {
        const cached = this.fileCache.get(filePath);
        if (cached) {
          oldSize = cached.size;
          hashBefore = cached.hash;
        }
      }

      // Mettre à jour le cache
      if (eventType === 'deleted') {
        this.fileCache.delete(filePath);
      } else if (fileSize !== undefined) {
        this.fileCache.set(filePath, { size: fileSize, hash: hashAfter });
      }

      // Créer l'événement
      const event: Omit<FileEvent, 'event_id' | 'timestamp'> = {
        watcher_id: watcherId,
        event_type: eventType,
        file_path: filePath,
        relative_path: relativePath,
        file_size: fileSize,
        old_size: oldSize,
        hash_before: hashBefore,
        hash_after: hashAfter,
        mime_type: mimeType,
      };

      await this.eventsStore.addEvent(event);

      // Incrémenter le compteur d'événements du watcher
      config.eventsCount++;

      console.error(
        `📝 Event [${eventType}] ${relativePath} (watcher: ${watcherId.substring(0, 8)})`
      );
    } catch (error) {
      console.error(`⚠️  Error handling event:`, error);
    }
  }

  /**
   * Arrête tous les watchers
   */
  async stopAll(): Promise<void> {
    const promises = Array.from(this.watchers.keys()).map((id) => this.stopWatcher(id));
    await Promise.all(promises);
    console.error('🛑 All watchers stopped');
  }
}
