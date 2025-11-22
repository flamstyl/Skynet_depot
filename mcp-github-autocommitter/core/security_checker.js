/**
 * Vérification de sécurité : détection de secrets, fichiers sensibles
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { SecurityViolationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SecurityChecker {
  constructor(config = {}) {
    this.config = config;
    this.patterns = null;
  }

  /**
   * Charge les patterns de secrets depuis le fichier de config
   */
  async loadPatterns() {
    if (this.patterns) return this.patterns;

    try {
      const patternsPath = path.join(__dirname, '..', 'config', 'patterns.json');
      const data = await fs.readFile(patternsPath, 'utf8');
      this.patterns = JSON.parse(data);
      return this.patterns;
    } catch (error) {
      logger.warning('SecurityChecker', 'Failed to load patterns, using defaults');
      this.patterns = { secrets: [] };
      return this.patterns;
    }
  }

  /**
   * Vérifie si un fichier doit être bloqué (par nom ou extension)
   */
  shouldBlockFile(filePath) {
    const blocked = this.config.blockedPatterns || [];
    const fileName = path.basename(filePath);

    for (const pattern of blocked) {
      // Pattern exact
      if (fileName === pattern) {
        return { blocked: true, reason: `Blocked file: ${pattern}` };
      }

      // Pattern wildcard
      if (pattern.startsWith('*.')) {
        const ext = pattern.slice(1);
        if (fileName.endsWith(ext)) {
          return { blocked: true, reason: `Blocked extension: ${ext}` };
        }
      }

      // Pattern avec wildcard au milieu
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(fileName)) {
          return { blocked: true, reason: `Blocked pattern: ${pattern}` };
        }
      }
    }

    return { blocked: false };
  }

  /**
   * Scanne un fichier à la recherche de secrets
   */
  async scanFileForSecrets(filePath) {
    try {
      await this.loadPatterns();

      const content = await fs.readFile(filePath, 'utf8');
      const secrets = [];

      for (const secretDef of this.patterns.secrets) {
        const regex = new RegExp(secretDef.pattern, 'gi');
        let match;

        while ((match = regex.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index);
          const snippet = match[0].substring(0, 50);

          secrets.push({
            name: secretDef.name,
            severity: secretDef.severity,
            line: lineNumber,
            snippet: snippet + (match[0].length > 50 ? '...' : ''),
            file: path.basename(filePath),
          });
        }
      }

      return secrets;
    } catch (error) {
      // Fichier binaire ou non lisible, skip
      if (error.code === 'ENOENT' || error.message.includes('ENOENT')) {
        return [];
      }
      logger.debug('SecurityChecker', `Could not scan ${filePath}: ${error.message}`);
      return [];
    }
  }

  /**
   * Scanne plusieurs fichiers
   */
  async scanFiles(repoPath, files) {
    const results = {
      scanned: 0,
      secrets_found: [],
      blocked_files: [],
    };

    for (const file of files) {
      const fullPath = path.join(repoPath, file);

      // Vérifier si le fichier est bloqué
      const blockCheck = this.shouldBlockFile(file);
      if (blockCheck.blocked) {
        results.blocked_files.push({
          file,
          reason: blockCheck.reason,
        });
        continue;
      }

      // Scanner pour secrets
      const secrets = await this.scanFileForSecrets(fullPath);
      if (secrets.length > 0) {
        results.secrets_found.push(...secrets);
      }

      results.scanned++;
    }

    return results;
  }

  /**
   * Valide que les fichiers peuvent être committés en toute sécurité
   */
  async validateFilesForCommit(repoPath, files) {
    if (!this.config.scanForSecrets && !this.config.blockedPatterns) {
      return { safe: true, issues: [] };
    }

    const scanResults = await this.scanFiles(repoPath, files);
    const issues = [];

    // Fichiers bloqués
    for (const blocked of scanResults.blocked_files) {
      issues.push({
        type: 'blocked_file',
        severity: 'critical',
        file: blocked.file,
        message: blocked.reason,
        recommendation: 'Add this file to .gitignore',
      });
    }

    // Secrets détectés
    for (const secret of scanResults.secrets_found) {
      issues.push({
        type: 'secret_detected',
        severity: secret.severity,
        file: secret.file,
        line: secret.line,
        secret_type: secret.name,
        message: `Potential ${secret.name} detected`,
        snippet: secret.snippet,
        recommendation: 'Remove secret or use environment variables',
      });
    }

    const safe = issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0;

    if (!safe) {
      logger.error('SecurityChecker', `Found ${issues.length} security issue(s)`);
    }

    return {
      safe,
      issues,
      scanned: scanResults.scanned,
    };
  }

  /**
   * Obtient le numéro de ligne d'une position dans le texte
   */
  getLineNumber(text, position) {
    const beforePosition = text.substring(0, position);
    return beforePosition.split('\n').length;
  }
}
