import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';
import { logger } from './logger.js';

interface CacheEntry {
  fileId: string;
  fileName: string;
  content: string;
  embedding: number[];
  modifiedTime: string;
}

export class EmbeddingCache {
  private cacheFilePath: string;
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.cacheFilePath = join(config.cacheDir, 'embeddings.json');
  }

  async initialize() {
    // Créer le dossier cache
    if (!existsSync(config.cacheDir)) {
      await mkdir(config.cacheDir, { recursive: true });
    }

    // Charger le cache existant
    if (existsSync(this.cacheFilePath)) {
      try {
        const cacheData = await readFile(this.cacheFilePath, 'utf-8');
        const entries: CacheEntry[] = JSON.parse(cacheData);

        for (const entry of entries) {
          this.cache.set(entry.fileId, entry);
        }

        logger.info('Embedding cache loaded', { entries: this.cache.size });
      } catch (error) {
        logger.warn('Failed to load embedding cache', { error });
      }
    }
  }

  get(fileId: string, modifiedTime: string): CacheEntry | null {
    const entry = this.cache.get(fileId);

    if (entry && entry.modifiedTime === modifiedTime) {
      return entry;
    }

    return null;
  }

  set(entry: CacheEntry) {
    this.cache.set(entry.fileId, entry);
  }

  async save() {
    try {
      const entries = Array.from(this.cache.values());
      await writeFile(this.cacheFilePath, JSON.stringify(entries, null, 2));

      logger.info('Embedding cache saved', { entries: entries.length });
    } catch (error) {
      logger.error('Failed to save embedding cache', { error });
    }
  }

  clear() {
    this.cache.clear();
  }
}
