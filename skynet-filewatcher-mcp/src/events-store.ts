/**
 * 📊 Events Store
 * Stockage et gestion des événements de surveillance fichiers
 * Format JSONL (JSON Lines) pour efficacité
 */

import { appendFile, readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileEvent {
  event_id: string;
  watcher_id: string;
  timestamp: string; // ISO 8601
  event_type: 'created' | 'modified' | 'deleted' | 'renamed';
  file_path: string;
  relative_path: string;
  old_path?: string; // Pour renamed
  file_size?: number;
  old_size?: number; // Pour modified
  hash_before?: string;
  hash_after?: string;
  mime_type?: string;
}

export interface EventStats {
  total: number;
  by_type: Record<string, number>;
  by_hour: Record<string, number>;
  size_changed: number;
}

export class EventsStore {
  private eventsFile: string;
  private events: FileEvent[] = [];

  constructor(eventsFile: string = './logs/events.jsonl') {
    this.eventsFile = eventsFile;
  }

  /**
   * Initialise le store
   */
  async initialize(): Promise<void> {
    // Créer le dossier logs si nécessaire
    const dir = dirname(this.eventsFile);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Créer le fichier s'il n'existe pas
    if (!existsSync(this.eventsFile)) {
      await writeFile(this.eventsFile, '', 'utf-8');
    }

    // Charger les événements existants
    await this.loadEvents();
  }

  /**
   * Charge les événements depuis le fichier JSONL
   */
  private async loadEvents(): Promise<void> {
    try {
      const content = await readFile(this.eventsFile, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim());

      this.events = lines.map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter((e): e is FileEvent => e !== null);

      console.error(`📚 Loaded ${this.events.length} events from store`);
    } catch (error) {
      console.error('⚠️  Error loading events:', error);
      this.events = [];
    }
  }

  /**
   * Ajoute un nouvel événement
   */
  async addEvent(event: Omit<FileEvent, 'event_id' | 'timestamp'>): Promise<FileEvent> {
    const fullEvent: FileEvent = {
      event_id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    // Ajouter à la mémoire
    this.events.push(fullEvent);

    // Persister dans le fichier (append)
    try {
      await appendFile(this.eventsFile, JSON.stringify(fullEvent) + '\n', 'utf-8');
    } catch (error) {
      console.error('⚠️  Error writing event:', error);
    }

    return fullEvent;
  }

  /**
   * Récupère les événements avec filtres
   */
  getEvents(options: {
    since?: string;
    until?: string;
    event_type?: FileEvent['event_type'];
    watcher_id?: string;
    limit?: number;
  } = {}): FileEvent[] {
    let filtered = [...this.events];

    // Filtre par date de début
    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = filtered.filter((e) => new Date(e.timestamp) >= sinceDate);
    }

    // Filtre par date de fin
    if (options.until) {
      const untilDate = new Date(options.until);
      filtered = filtered.filter((e) => new Date(e.timestamp) <= untilDate);
    }

    // Filtre par type d'événement
    if (options.event_type) {
      filtered = filtered.filter((e) => e.event_type === options.event_type);
    }

    // Filtre par watcher
    if (options.watcher_id) {
      filtered = filtered.filter((e) => e.watcher_id === options.watcher_id);
    }

    // Trier par timestamp décroissant (plus récents en premier)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limiter le nombre de résultats
    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Calcule des statistiques sur les événements
   */
  getStats(watcherId?: string): EventStats {
    const events = watcherId
      ? this.events.filter((e) => e.watcher_id === watcherId)
      : this.events;

    const stats: EventStats = {
      total: events.length,
      by_type: {},
      by_hour: {},
      size_changed: 0,
    };

    events.forEach((event) => {
      // Stats par type
      stats.by_type[event.event_type] = (stats.by_type[event.event_type] || 0) + 1;

      // Stats par heure
      const hour = event.timestamp.substring(0, 13); // YYYY-MM-DDTHH
      stats.by_hour[hour] = (stats.by_hour[hour] || 0) + 1;

      // Taille changée
      if (event.event_type === 'modified' && event.old_size && event.file_size) {
        stats.size_changed += Math.abs(event.file_size - event.old_size);
      }
    });

    return stats;
  }

  /**
   * Nettoie les événements avant une certaine date
   */
  async clearEventsBefore(beforeDate: string): Promise<number> {
    const before = new Date(beforeDate);
    const kept = this.events.filter((e) => new Date(e.timestamp) >= before);
    const deleted = this.events.length - kept.length;

    this.events = kept;

    // Réécrire le fichier
    try {
      const content = this.events.map((e) => JSON.stringify(e)).join('\n') + '\n';
      await writeFile(this.eventsFile, content, 'utf-8');
    } catch (error) {
      console.error('⚠️  Error rewriting events file:', error);
    }

    return deleted;
  }

  /**
   * Exporte les événements dans un format
   */
  exportEvents(format: 'json' | 'jsonl' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.events, null, 2);
    } else if (format === 'jsonl') {
      return this.events.map((e) => JSON.stringify(e)).join('\n');
    } else if (format === 'csv') {
      const headers = [
        'event_id',
        'watcher_id',
        'timestamp',
        'event_type',
        'file_path',
        'relative_path',
        'file_size',
      ];
      const rows = this.events.map((e) =>
        [
          e.event_id,
          e.watcher_id,
          e.timestamp,
          e.event_type,
          e.file_path,
          e.relative_path,
          e.file_size || '',
        ].join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }
    return '';
  }

  /**
   * Retourne le nombre total d'événements
   */
  getCount(): number {
    return this.events.length;
  }
}
