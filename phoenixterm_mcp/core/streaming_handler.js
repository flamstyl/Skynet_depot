/**
 * 🔥 PhoenixTerm Streaming Handler
 * Gestion du streaming en temps réel de l'output des commandes
 */

import { EventEmitter } from 'events';

export class StreamingHandler extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config.streaming || {};
    this.enabled = this.config.enabled !== false;
    this.bufferSize = this.config.bufferSize || 4096;
    this.flushInterval = this.config.flushInterval || 100;
    this.streams = new Map();
  }

  /**
   * Crée un nouveau stream pour une session
   */
  createStream(sessionId, options = {}) {
    const stream = {
      sessionId,
      buffer: [],
      totalBytes: 0,
      startTime: Date.now(),
      lastFlush: Date.now(),
      subscribers: new Set(),
      metadata: {
        encoding: options.encoding || 'utf8',
        bufferSize: options.bufferSize || this.bufferSize,
      },
      stats: {
        linesReceived: 0,
        bytesReceived: 0,
        flushCount: 0,
      },
    };

    this.streams.set(sessionId, stream);

    // Auto-flush périodique
    if (this.enabled) {
      stream.flushTimer = setInterval(() => {
        this.flush(sessionId);
      }, this.flushInterval);
    }

    console.error(`[Stream] Created stream for session ${sessionId}`);
    return stream;
  }

  /**
   * Récupère un stream
   */
  getStream(sessionId) {
    return this.streams.get(sessionId);
  }

  /**
   * Ajoute des données au stream
   */
  push(sessionId, data, type = 'stdout') {
    let stream = this.getStream(sessionId);
    if (!stream) {
      stream = this.createStream(sessionId);
    }

    const entry = {
      type,
      data,
      timestamp: Date.now(),
      size: Buffer.byteLength(data, stream.metadata.encoding),
    };

    stream.buffer.push(entry);
    stream.totalBytes += entry.size;
    stream.stats.bytesReceived += entry.size;
    stream.stats.linesReceived += (data.match(/\n/g) || []).length;

    // Flush si le buffer est plein
    if (stream.buffer.length >= stream.metadata.bufferSize) {
      this.flush(sessionId);
    }

    // Emit aux subscribers
    this.notifySubscribers(sessionId, entry);

    return entry;
  }

  /**
   * Flush le buffer
   */
  flush(sessionId, force = false) {
    const stream = this.getStream(sessionId);
    if (!stream || stream.buffer.length === 0) {
      return null;
    }

    const flushedData = [...stream.buffer];
    stream.buffer = [];
    stream.lastFlush = Date.now();
    stream.stats.flushCount++;

    this.emit('flush', sessionId, flushedData);

    console.error(`[Stream] Flushed ${flushedData.length} entries for session ${sessionId}`);
    return flushedData;
  }

  /**
   * Souscrit aux updates d'un stream
   */
  subscribe(sessionId, callback) {
    let stream = this.getStream(sessionId);
    if (!stream) {
      stream = this.createStream(sessionId);
    }

    stream.subscribers.add(callback);

    return () => {
      stream.subscribers.delete(callback);
    };
  }

  /**
   * Notifie les subscribers
   */
  notifySubscribers(sessionId, entry) {
    const stream = this.getStream(sessionId);
    if (!stream) return;

    for (const callback of stream.subscribers) {
      try {
        callback(entry);
      } catch (error) {
        console.error(`[Stream] Subscriber callback error:`, error);
      }
    }
  }

  /**
   * Lit le stream complet
   */
  read(sessionId, options = {}) {
    const stream = this.getStream(sessionId);
    if (!stream) {
      return [];
    }

    // Flush d'abord pour avoir les dernières données
    this.flush(sessionId);

    let data = stream.buffer;

    // Filtrer par type
    if (options.type) {
      data = data.filter(entry => entry.type === options.type);
    }

    // Filtrer par timestamp
    if (options.since) {
      data = data.filter(entry => entry.timestamp >= options.since);
    }

    // Limiter le nombre d'entrées
    if (options.limit) {
      data = data.slice(-options.limit);
    }

    return data;
  }

  /**
   * Détecte les patterns dans le stream (ex: prompts, barres de progression)
   */
  detectPatterns(sessionId, patterns = {}) {
    const stream = this.getStream(sessionId);
    if (!stream || stream.buffer.length === 0) {
      return [];
    }

    const detected = [];

    // Pattern de prompt (ex: [sudo] password for user:)
    const promptPattern = patterns.prompt || /\[sudo\]\s+password\s+for\s+.*:|Password:|password:/i;

    // Pattern de barre de progression
    const progressPattern = patterns.progress || /\d+%|\[#+\s*\]|\d+\/\d+/;

    // Analyser le buffer
    for (const entry of stream.buffer) {
      // Vérifier prompt
      if (promptPattern.test(entry.data)) {
        detected.push({
          type: 'prompt',
          pattern: 'password_prompt',
          data: entry.data,
          timestamp: entry.timestamp,
        });
      }

      // Vérifier progression
      if (progressPattern.test(entry.data)) {
        const match = entry.data.match(/(\d+)%/);
        detected.push({
          type: 'progress',
          pattern: 'percentage',
          value: match ? parseInt(match[1]) : null,
          data: entry.data,
          timestamp: entry.timestamp,
        });
      }
    }

    return detected;
  }

  /**
   * Agrège le stream en texte continu
   */
  aggregate(sessionId, options = {}) {
    const entries = this.read(sessionId, options);

    const text = entries
      .map(entry => entry.data)
      .join('');

    return {
      text,
      entries: entries.length,
      bytes: Buffer.byteLength(text, 'utf8'),
      timestamp: Date.now(),
    };
  }

  /**
   * Statistiques du stream
   */
  getStats(sessionId) {
    const stream = this.getStream(sessionId);
    if (!stream) {
      return null;
    }

    return {
      sessionId,
      uptime: Date.now() - stream.startTime,
      bufferSize: stream.buffer.length,
      totalBytes: stream.totalBytes,
      stats: stream.stats,
      subscribers: stream.subscribers.size,
      lastFlush: stream.lastFlush,
      metadata: stream.metadata,
    };
  }

  /**
   * Détruit un stream
   */
  destroyStream(sessionId) {
    const stream = this.getStream(sessionId);
    if (!stream) {
      return false;
    }

    // Flush final
    this.flush(sessionId, true);

    // Clear le timer
    if (stream.flushTimer) {
      clearInterval(stream.flushTimer);
    }

    // Clear subscribers
    stream.subscribers.clear();

    this.streams.delete(sessionId);
    console.error(`[Stream] Destroyed stream for session ${sessionId}`);
    return true;
  }

  /**
   * Exporte le stream vers un format
   */
  export(sessionId, format = 'json') {
    const stream = this.getStream(sessionId);
    if (!stream) {
      return null;
    }

    const data = this.read(sessionId);

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'text':
        return data.map(entry => entry.data).join('');

      case 'lines':
        return data.map(entry => entry.data.trim()).filter(line => line);

      case 'ansi':
        // Garder les séquences ANSI
        return data.map(entry => entry.data).join('');

      default:
        return data;
    }
  }

  /**
   * Détruit tous les streams
   */
  destroyAll() {
    const sessions = Array.from(this.streams.keys());
    sessions.forEach(sessionId => this.destroyStream(sessionId));
    return sessions.length;
  }
}

export default StreamingHandler;
