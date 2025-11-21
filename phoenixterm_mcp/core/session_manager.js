/**
 * 🔥 PhoenixTerm Session Manager
 * Gestion des sessions persistantes avec état et contexte
 */

import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class SessionManager {
  constructor(config = {}) {
    this.config = config;
    this.sessions = new Map();
    this.stateDir = config.sessions?.stateDir || './data/sessions';
    this.maxSessions = config.sessions?.maxActiveSessions || 10;
    this.inactivityTimeout = config.sessions?.inactivityTimeout || 1800000; // 30 min

    this.init();
  }

  async init() {
    // Créer le répertoire d'état si nécessaire
    try {
      await fs.mkdir(this.stateDir, { recursive: true });
    } catch (error) {
      console.error(`[Session] Failed to create state dir:`, error);
    }

    // Charger les sessions persistées
    if (this.config.sessions?.persistState) {
      await this.loadPersistedSessions();
    }

    // Démarrer le cleanup périodique
    this.startCleanupInterval();
  }

  /**
   * Crée une nouvelle session
   */
  createSession(options = {}) {
    const sessionId = options.sessionId || `session_${randomUUID()}`;

    // Vérifier limite de sessions
    if (this.sessions.size >= this.maxSessions) {
      throw new Error(`Maximum sessions limit reached (${this.maxSessions})`);
    }

    const session = {
      id: sessionId,
      created: Date.now(),
      lastActivity: Date.now(),
      shell: options.shell || 'auto',
      cwd: options.cwd || process.env.HOME || process.cwd(),
      env: options.env || {},
      state: {
        commandHistory: [],
        variables: {},
        workingDirectory: options.cwd || process.env.HOME || process.cwd(),
        exitCodes: [],
      },
      metadata: {
        user: options.user || process.env.USER,
        hostname: options.hostname || require('os').hostname(),
        platform: process.platform,
      },
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    console.error(`[Session] Created session ${sessionId}`);

    return session;
  }

  /**
   * Récupère une session
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Met à jour l'activité d'une session
   */
  updateActivity(sessionId) {
    const session = this.getSession(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Ajoute une commande à l'historique
   */
  addCommand(sessionId, command, exitCode = null, output = '') {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const entry = {
      command,
      timestamp: Date.now(),
      exitCode,
      output: output.substring(0, 1000), // Limiter la taille
      cwd: session.state.workingDirectory,
    };

    session.state.commandHistory.push(entry);

    // Limiter l'historique à 1000 commandes
    if (session.state.commandHistory.length > 1000) {
      session.state.commandHistory = session.state.commandHistory.slice(-1000);
    }

    if (exitCode !== null) {
      session.state.exitCodes.push(exitCode);
    }

    this.updateActivity(sessionId);
    return true;
  }

  /**
   * Met à jour le répertoire de travail
   */
  updateWorkingDirectory(sessionId, cwd) {
    const session = this.getSession(sessionId);
    if (session) {
      session.state.workingDirectory = cwd;
      session.cwd = cwd;
      return true;
    }
    return false;
  }

  /**
   * Met à jour une variable d'environnement
   */
  setVariable(sessionId, key, value) {
    const session = this.getSession(sessionId);
    if (session) {
      session.state.variables[key] = value;
      return true;
    }
    return false;
  }

  /**
   * Récupère l'état complet d'une session
   */
  getSessionState(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      created: session.created,
      lastActivity: session.lastActivity,
      uptime: Date.now() - session.created,
      inactive: Date.now() - session.lastActivity,
      shell: session.shell,
      cwd: session.state.workingDirectory,
      env: session.env,
      commandCount: session.state.commandHistory.length,
      recentCommands: session.state.commandHistory.slice(-10),
      recentExitCodes: session.state.exitCodes.slice(-10),
      variables: session.state.variables,
      metadata: session.metadata,
      status: session.status,
    };
  }

  /**
   * Persiste l'état d'une session sur disque
   */
  async persistSession(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    try {
      const filePath = path.join(this.stateDir, `${sessionId}.json`);
      await fs.writeFile(filePath, JSON.stringify(session, null, 2));
      console.error(`[Session] Persisted session ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`[Session] Failed to persist session:`, error);
      return false;
    }
  }

  /**
   * Charge les sessions persistées depuis le disque
   */
  async loadPersistedSessions() {
    try {
      const files = await fs.readdir(this.stateDir);
      const sessionFiles = files.filter(f => f.endsWith('.json'));

      for (const file of sessionFiles) {
        try {
          const filePath = path.join(this.stateDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const session = JSON.parse(data);

          // Ne charger que les sessions récentes (< 24h)
          if (Date.now() - session.lastActivity < 86400000) {
            session.status = 'restored';
            this.sessions.set(session.id, session);
            console.error(`[Session] Restored session ${session.id}`);
          } else {
            // Supprimer les vieilles sessions
            await fs.unlink(filePath);
          }
        } catch (error) {
          console.error(`[Session] Failed to load session from ${file}:`, error);
        }
      }
    } catch (error) {
      console.error(`[Session] Failed to load persisted sessions:`, error);
    }
  }

  /**
   * Détruit une session
   */
  async destroySession(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    // Persister avant de détruire
    if (this.config.sessions?.persistState) {
      await this.persistSession(sessionId);
    }

    this.sessions.delete(sessionId);
    console.error(`[Session] Destroyed session ${sessionId}`);
    return true;
  }

  /**
   * Nettoyage des sessions inactives
   */
  cleanupInactiveSessions() {
    const now = Date.now();
    const toCleanup = [];

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity > this.inactivityTimeout) {
        toCleanup.push(sessionId);
      }
    }

    toCleanup.forEach(async sessionId => {
      console.error(`[Session] Cleaning up inactive session ${sessionId}`);
      await this.destroySession(sessionId);
    });

    return toCleanup.length;
  }

  /**
   * Démarre l'intervalle de nettoyage
   */
  startCleanupInterval() {
    const interval = this.config.sessions?.cleanupInterval || 300000; // 5 min

    this.cleanupTimer = setInterval(() => {
      const cleaned = this.cleanupInactiveSessions();
      if (cleaned > 0) {
        console.error(`[Session] Cleaned up ${cleaned} inactive sessions`);
      }
    }, interval);
  }

  /**
   * Liste toutes les sessions actives
   */
  listActiveSessions() {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      created: session.created,
      lastActivity: session.lastActivity,
      uptime: Date.now() - session.created,
      commandCount: session.state.commandHistory.length,
      cwd: session.state.workingDirectory,
      status: session.status,
    }));
  }

  /**
   * Arrête le gestionnaire de sessions
   */
  async shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Persister toutes les sessions actives
    if (this.config.sessions?.persistState) {
      const promises = Array.from(this.sessions.keys()).map(
        sessionId => this.persistSession(sessionId)
      );
      await Promise.all(promises);
    }

    this.sessions.clear();
  }
}

export default SessionManager;
