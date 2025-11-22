/**
 * Système de logging pour le MCP GitHub Auto-Committer
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Logger {
  constructor(config = {}) {
    this.config = config;
    this.logFile = config.logFile || path.join(__dirname, '..', 'data', 'commit_history.json');
    this.maxEntries = config.maxLogEntries || 1000;
  }

  /**
   * Log vers stderr (visible dans Claude Code)
   */
  log(level, tool, message, data = {}) {
    const timestamp = new Date().toISOString();
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍',
    }[level] || 'ℹ️';

    const logMessage = `[${timestamp}] ${emoji} [${tool}] ${message}`;
    console.error(logMessage);

    // Log data supplémentaires si présentes
    if (Object.keys(data).length > 0) {
      console.error(`  Data:`, JSON.stringify(data, null, 2));
    }
  }

  info(tool, message, data) {
    this.log('info', tool, message, data);
  }

  success(tool, message, data) {
    this.log('success', tool, message, data);
  }

  warning(tool, message, data) {
    this.log('warning', tool, message, data);
  }

  error(tool, message, data) {
    this.log('error', tool, message, data);
  }

  debug(tool, message, data) {
    this.log('debug', tool, message, data);
  }

  /**
   * Enregistre une opération dans le fichier de log JSON
   */
  async logOperation(tool, params, result, duration) {
    if (!this.config.enabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      tool,
      params: this.sanitizeParams(params),
      result: {
        success: result.success,
        ...(result.commit && { commit_hash: result.commit.hash }),
        ...(result.error && { error: result.error }),
      },
      duration,
    };

    try {
      // Charger les logs existants
      let logs = [];
      try {
        const data = await fs.readFile(this.logFile, 'utf8');
        logs = JSON.parse(data);
      } catch {
        // Fichier n'existe pas encore
      }

      // Ajouter la nouvelle entrée
      logs.push(logEntry);

      // Limiter le nombre d'entrées
      if (logs.length > this.maxEntries) {
        logs = logs.slice(-this.maxEntries);
      }

      // Écrire
      await fs.writeFile(this.logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('[Logger] Failed to write log file:', error.message);
    }
  }

  /**
   * Masque les informations sensibles
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    const sensitiveKeys = ['token', 'password', 'secret', 'key'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Récupère l'historique des commits
   */
  async getHistory(limit = 50) {
    try {
      const data = await fs.readFile(this.logFile, 'utf8');
      const logs = JSON.parse(data);
      return logs.slice(-limit);
    } catch {
      return [];
    }
  }
}

// Instance globale
export const logger = new Logger({ enabled: true });
