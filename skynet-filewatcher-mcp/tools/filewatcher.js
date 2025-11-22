#!/usr/bin/env node
/**
 * Module de surveillance de fichiers pour Skynet MCP
 * Utilise chokidar pour détecter les changements en temps réel
 */

import chokidar from 'chokidar';
import { v4 as uuidv4 } from 'uuid';
import { calculateFileHash, getFileSize, writeEvent } from './utils.js';

/**
 * Classe FileWatcher
 * Gère la surveillance des fichiers et le logging des événements
 */
export class FileWatcher {
  constructor(config) {
    this.config = config;
    this.watcher = null;
    this.isWatching = false;
    this.stats = {
      started_at: null,
      events_count: 0,
      files_created: 0,
      files_modified: 0,
      files_deleted: 0,
      files_renamed: 0
    };

    // Cache pour détecter les renommages
    this.deletionCache = new Map();
    this.deletionTimeout = 500; // ms pour corréler suppression/création
  }

  /**
   * Démarre la surveillance
   */
  async start() {
    if (this.isWatching) {
      console.log('⚠️  Le watcher est déjà actif');
      return;
    }

    const { watchPath, options } = this.config;

    console.log(`🚀 Démarrage de la surveillance sur: ${watchPath}`);
    console.log(`📝 Logs enregistrés dans: ${this.config.logPath}`);

    this.watcher = chokidar.watch(watchPath, options);

    this.watcher
      .on('add', (path) => this.handleAdd(path))
      .on('change', (path) => this.handleChange(path))
      .on('unlink', (path) => this.handleUnlink(path))
      .on('addDir', (path) => this.handleAddDir(path))
      .on('unlinkDir', (path) => this.handleUnlinkDir(path))
      .on('error', (error) => this.handleError(error))
      .on('ready', () => this.handleReady());

    this.isWatching = true;
    this.stats.started_at = new Date().toISOString();
  }

  /**
   * Arrête la surveillance
   */
  async stop() {
    if (!this.isWatching) {
      return;
    }

    console.log('🛑 Arrêt de la surveillance...');

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    this.isWatching = false;
    console.log('✅ Surveillance arrêtée');
  }

  /**
   * Gère la création de fichier
   */
  async handleAdd(filePath) {
    console.log(`➕ Fichier créé: ${filePath}`);

    // Vérifier si c'est un renommage
    const isRenamed = this.checkForRename(filePath);

    const event = await this.createEvent({
      event_type: isRenamed ? 'renamed' : 'created',
      file_path: filePath,
      old_size: 0,
      new_size: await getFileSize(filePath),
      hash_before: null,
      hash_after: this.config.features.calculateHash ? await calculateFileHash(filePath) : null
    });

    await writeEvent(this.config.logPath, event);

    if (isRenamed) {
      this.stats.files_renamed++;
    } else {
      this.stats.files_created++;
    }
    this.stats.events_count++;
  }

  /**
   * Gère la modification de fichier
   */
  async handleChange(filePath) {
    console.log(`✏️  Fichier modifié: ${filePath}`);

    const newSize = await getFileSize(filePath);
    const newHash = this.config.features.calculateHash ? await calculateFileHash(filePath) : null;

    const event = await this.createEvent({
      event_type: 'modified',
      file_path: filePath,
      old_size: null, // Nous ne stockons pas l'ancienne taille en mémoire
      new_size: newSize,
      hash_before: null,
      hash_after: newHash
    });

    await writeEvent(this.config.logPath, event);
    this.stats.files_modified++;
    this.stats.events_count++;
  }

  /**
   * Gère la suppression de fichier
   */
  async handleUnlink(filePath) {
    console.log(`🗑️  Fichier supprimé: ${filePath}`);

    // Ajouter au cache de suppression pour détecter les renommages
    this.deletionCache.set(filePath, Date.now());

    // Nettoyer le cache après un délai
    setTimeout(() => {
      this.deletionCache.delete(filePath);
    }, this.deletionTimeout);

    const event = await this.createEvent({
      event_type: 'deleted',
      file_path: filePath,
      old_size: null, // Impossible d'obtenir la taille d'un fichier supprimé
      new_size: 0,
      hash_before: null,
      hash_after: null
    });

    await writeEvent(this.config.logPath, event);
    this.stats.files_deleted++;
    this.stats.events_count++;
  }

  /**
   * Gère la création de dossier
   */
  async handleAddDir(dirPath) {
    console.log(`📁 Dossier créé: ${dirPath}`);

    const event = await this.createEvent({
      event_type: 'created',
      file_path: dirPath,
      old_size: null,
      new_size: null,
      hash_before: null,
      hash_after: null,
      is_directory: true
    });

    await writeEvent(this.config.logPath, event);
    this.stats.events_count++;
  }

  /**
   * Gère la suppression de dossier
   */
  async handleUnlinkDir(dirPath) {
    console.log(`📁 Dossier supprimé: ${dirPath}`);

    const event = await this.createEvent({
      event_type: 'deleted',
      file_path: dirPath,
      old_size: null,
      new_size: null,
      hash_before: null,
      hash_after: null,
      is_directory: true
    });

    await writeEvent(this.config.logPath, event);
    this.stats.events_count++;
  }

  /**
   * Gère les erreurs
   */
  handleError(error) {
    console.error('❌ Erreur du watcher:', error);
  }

  /**
   * Appelé quand le watcher est prêt
   */
  handleReady() {
    console.log('✅ Surveillance active et prête');
  }

  /**
   * Vérifie si une création est en fait un renommage
   */
  checkForRename(filePath) {
    const now = Date.now();

    // Chercher une suppression récente dans le cache
    for (const [deletedPath, deletedTime] of this.deletionCache.entries()) {
      if (now - deletedTime < this.deletionTimeout) {
        // C'est probablement un renommage
        this.deletionCache.delete(deletedPath);
        return true;
      }
    }

    return false;
  }

  /**
   * Crée un objet événement normalisé
   */
  async createEvent(eventData) {
    return {
      event_id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...eventData
    };
  }

  /**
   * Obtient le statut actuel du watcher
   */
  getStatus() {
    return {
      is_watching: this.isWatching,
      watch_path: this.config.watchPath,
      log_path: this.config.logPath,
      stats: this.stats,
      features: this.config.features
    };
  }

  /**
   * Réinitialise les statistiques
   */
  resetStats() {
    this.stats = {
      started_at: this.stats.started_at,
      events_count: 0,
      files_created: 0,
      files_modified: 0,
      files_deleted: 0,
      files_renamed: 0
    };
  }
}
