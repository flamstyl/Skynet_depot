#!/usr/bin/env node
/**
 * Utilitaires pour le MCP FileWatcher
 * Fonctions pour le calcul de hash SHA-256, gestion des fichiers, etc.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';

/**
 * Calcule le hash SHA-256 d'un fichier
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<string|null>} Hash SHA-256 ou null si erreur
 */
export async function calculateFileHash(filePath) {
  try {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(`sha256:${hash.digest('hex')}`));
      stream.on('error', (err) => {
        console.error(`Erreur de lecture pour le hash de ${filePath}:`, err.message);
        resolve(null);
      });
    });
  } catch (error) {
    console.error(`Erreur de calcul de hash pour ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Obtient la taille d'un fichier en octets
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<number|null>} Taille en octets ou null si erreur
 */
export async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Erreur de lecture de taille pour ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Vérifie si un fichier existe
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<boolean>} true si le fichier existe
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Crée un dossier s'il n'existe pas
 * @param {string} dirPath - Chemin du dossier
 */
export async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Erreur de création du dossier ${dirPath}:`, error.message);
  }
}

/**
 * Lit les événements du fichier JSONL
 * @param {string} logPath - Chemin du fichier de log
 * @param {Object} filters - Filtres optionnels
 * @returns {Promise<Array>} Liste des événements
 */
export async function readEvents(logPath, filters = {}) {
  try {
    const exists = await fileExists(logPath);
    if (!exists) {
      return [];
    }

    const content = await fs.readFile(logPath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);

    let events = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.error('Erreur de parsing JSON:', error.message);
        return null;
      }
    }).filter(event => event !== null);

    // Filtrer par timestamp si fourni
    if (filters.since_timestamp) {
      const sinceDate = new Date(filters.since_timestamp);
      events = events.filter(event => new Date(event.timestamp) >= sinceDate);
    }

    // Filtrer par type d'événement si fourni
    if (filters.event_type) {
      events = events.filter(event => event.event_type === filters.event_type);
    }

    // Filtrer par chemin de fichier (pattern) si fourni
    if (filters.file_pattern) {
      const pattern = new RegExp(filters.file_pattern);
      events = events.filter(event => pattern.test(event.file_path));
    }

    // Limiter le nombre de résultats si fourni
    if (filters.limit && filters.limit > 0) {
      events = events.slice(-filters.limit);
    }

    return events;
  } catch (error) {
    console.error(`Erreur de lecture des événements depuis ${logPath}:`, error.message);
    return [];
  }
}

/**
 * Écrit un événement dans le fichier JSONL
 * @param {string} logPath - Chemin du fichier de log
 * @param {Object} event - Événement à logger
 */
export async function writeEvent(logPath, event) {
  try {
    // Assurer que le dossier existe
    const logDir = path.dirname(logPath);
    await ensureDir(logDir);

    // Ajouter l'événement au fichier
    const line = JSON.stringify(event) + '\n';
    await fs.appendFile(logPath, line, 'utf-8');
  } catch (error) {
    console.error(`Erreur d'écriture de l'événement dans ${logPath}:`, error.message);
  }
}

/**
 * Nettoie les vieux événements du fichier JSONL
 * @param {string} logPath - Chemin du fichier de log
 * @param {number} maxAge - Âge maximum en millisecondes
 * @returns {Promise<number>} Nombre d'événements supprimés
 */
export async function cleanOldEvents(logPath, maxAge) {
  try {
    const events = await readEvents(logPath);
    const now = Date.now();
    const cutoffTime = now - maxAge;

    const recentEvents = events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= cutoffTime;
    });

    const removed = events.length - recentEvents.length;

    if (removed > 0) {
      // Réécrire le fichier avec seulement les événements récents
      const content = recentEvents.map(e => JSON.stringify(e)).join('\n') + '\n';
      await fs.writeFile(logPath, content, 'utf-8');
    }

    return removed;
  } catch (error) {
    console.error(`Erreur de nettoyage des événements dans ${logPath}:`, error.message);
    return 0;
  }
}

/**
 * Formate une taille en octets en format lisible
 * @param {number} bytes - Taille en octets
 * @returns {string} Taille formatée
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Obtient des statistiques sur les événements
 * @param {Array} events - Liste des événements
 * @returns {Object} Statistiques
 */
export function getEventStats(events) {
  const stats = {
    total: events.length,
    by_type: {},
    date_range: {
      oldest: null,
      newest: null
    },
    total_size_changed: 0
  };

  events.forEach(event => {
    // Compter par type
    stats.by_type[event.event_type] = (stats.by_type[event.event_type] || 0) + 1;

    // Calculer la plage de dates
    const eventDate = new Date(event.timestamp);
    if (!stats.date_range.oldest || eventDate < new Date(stats.date_range.oldest)) {
      stats.date_range.oldest = event.timestamp;
    }
    if (!stats.date_range.newest || eventDate > new Date(stats.date_range.newest)) {
      stats.date_range.newest = event.timestamp;
    }

    // Calculer le total de changements de taille
    if (event.old_size !== null && event.new_size !== null) {
      stats.total_size_changed += Math.abs(event.new_size - event.old_size);
    }
  });

  return stats;
}
