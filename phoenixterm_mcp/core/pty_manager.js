/**
 * 🔥 PhoenixTerm PTY Manager
 * Gestion des pseudo-terminaux avec node-pty
 */

import pty from 'node-pty';
import os from 'os';
import { EventEmitter } from 'events';

export class PTYManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.activePTYs = new Map();
  }

  /**
   * Détecte le shell optimal selon l'OS
   */
  detectShell() {
    const platform = os.platform();
    const shell = this.config.shell?.defaultShell;

    if (shell && shell !== 'auto') {
      return this.config.shell.shells[shell] || shell;
    }

    // Auto-détection
    if (platform === 'win32') {
      return process.env.SHELL || 'powershell.exe';
    } else {
      return process.env.SHELL || '/bin/bash';
    }
  }

  /**
   * Crée un nouveau PTY
   */
  createPTY(sessionId, options = {}) {
    const shell = options.shell || this.detectShell();
    const cwd = options.cwd || process.env.HOME || process.cwd();

    const env = {
      ...process.env,
      ...this.config.shell?.env,
      ...options.env,
    };

    try {
      const ptyProcess = pty.spawn(shell, options.args || [], {
        name: 'xterm-256color',
        cols: options.cols || 80,
        rows: options.rows || 24,
        cwd,
        env,
        encoding: 'utf8',
      });

      const ptyInfo = {
        process: ptyProcess,
        sessionId,
        shell,
        cwd,
        created: Date.now(),
        lastActivity: Date.now(),
        outputBuffer: [],
        stderrBuffer: [],
      };

      // Event handlers
      ptyProcess.onData((data) => {
        ptyInfo.outputBuffer.push({
          type: 'stdout',
          data,
          timestamp: Date.now(),
        });
        ptyInfo.lastActivity = Date.now();
        this.emit('data', sessionId, data);
      });

      ptyProcess.onExit(({ exitCode, signal }) => {
        this.emit('exit', sessionId, exitCode, signal);
        this.destroyPTY(sessionId);
      });

      this.activePTYs.set(sessionId, ptyInfo);

      console.error(`[PTY] Created PTY for session ${sessionId} with shell ${shell}`);
      return ptyInfo;

    } catch (error) {
      console.error(`[PTY] Failed to create PTY:`, error);
      throw new Error(`Failed to spawn shell: ${error.message}`);
    }
  }

  /**
   * Récupère un PTY existant
   */
  getPTY(sessionId) {
    return this.activePTYs.get(sessionId);
  }

  /**
   * Écrit sur le stdin du PTY
   */
  write(sessionId, data) {
    const ptyInfo = this.getPTY(sessionId);
    if (!ptyInfo) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      ptyInfo.process.write(data);
      ptyInfo.lastActivity = Date.now();
      return true;
    } catch (error) {
      console.error(`[PTY] Write failed for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Redimensionne le PTY
   */
  resize(sessionId, cols, rows) {
    const ptyInfo = this.getPTY(sessionId);
    if (!ptyInfo) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      ptyInfo.process.resize(cols, rows);
      return true;
    } catch (error) {
      console.error(`[PTY] Resize failed:`, error);
      return false;
    }
  }

  /**
   * Envoie un signal au processus
   */
  kill(sessionId, signal = 'SIGTERM') {
    const ptyInfo = this.getPTY(sessionId);
    if (!ptyInfo) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      ptyInfo.process.kill(signal);
      return true;
    } catch (error) {
      console.error(`[PTY] Kill failed:`, error);
      return false;
    }
  }

  /**
   * Détruit un PTY
   */
  destroyPTY(sessionId) {
    const ptyInfo = this.activePTYs.get(sessionId);
    if (!ptyInfo) {
      return false;
    }

    try {
      if (ptyInfo.process) {
        ptyInfo.process.kill('SIGTERM');
      }
      this.activePTYs.delete(sessionId);
      console.error(`[PTY] Destroyed PTY for session ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`[PTY] Destroy failed:`, error);
      return false;
    }
  }

  /**
   * Récupère le buffer de sortie
   */
  getOutputBuffer(sessionId, options = {}) {
    const ptyInfo = this.getPTY(sessionId);
    if (!ptyInfo) {
      return [];
    }

    const { since, limit } = options;
    let buffer = ptyInfo.outputBuffer;

    if (since) {
      buffer = buffer.filter(item => item.timestamp > since);
    }

    if (limit) {
      buffer = buffer.slice(-limit);
    }

    return buffer;
  }

  /**
   * Clear le buffer de sortie
   */
  clearOutputBuffer(sessionId) {
    const ptyInfo = this.getPTY(sessionId);
    if (ptyInfo) {
      ptyInfo.outputBuffer = [];
      ptyInfo.stderrBuffer = [];
      return true;
    }
    return false;
  }

  /**
   * Récupère les statistiques
   */
  getStats(sessionId) {
    const ptyInfo = this.getPTY(sessionId);
    if (!ptyInfo) {
      return null;
    }

    return {
      sessionId,
      shell: ptyInfo.shell,
      cwd: ptyInfo.cwd,
      created: ptyInfo.created,
      lastActivity: ptyInfo.lastActivity,
      uptime: Date.now() - ptyInfo.created,
      bufferSize: ptyInfo.outputBuffer.length,
      pid: ptyInfo.process.pid,
    };
  }

  /**
   * Liste toutes les sessions actives
   */
  listActiveSessions() {
    return Array.from(this.activePTYs.keys()).map(sessionId =>
      this.getStats(sessionId)
    );
  }

  /**
   * Nettoyage des sessions inactives
   */
  cleanupInactiveSessions(timeout = 1800000) {
    const now = Date.now();
    const toCleanup = [];

    for (const [sessionId, ptyInfo] of this.activePTYs) {
      if (now - ptyInfo.lastActivity > timeout) {
        toCleanup.push(sessionId);
      }
    }

    toCleanup.forEach(sessionId => {
      console.error(`[PTY] Cleaning up inactive session ${sessionId}`);
      this.destroyPTY(sessionId);
    });

    return toCleanup.length;
  }

  /**
   * Détruit toutes les sessions
   */
  destroyAll() {
    const sessions = Array.from(this.activePTYs.keys());
    sessions.forEach(sessionId => this.destroyPTY(sessionId));
    return sessions.length;
  }
}

export default PTYManager;
