/**
 * 🔥 PhoenixTerm Security Manager
 * Validation et sécurisation des commandes
 */

import fs from 'fs/promises';
import path from 'path';

export class SecurityManager {
  constructor(config = {}) {
    this.config = config.security || {};
    this.rules = null;
    this.enabled = this.config.enabled !== false;
    this.loadSecurityRules();
  }

  /**
   * Charge les règles de sécurité
   */
  async loadSecurityRules() {
    try {
      const rulesPath = path.join(process.cwd(), 'config', 'security_rules.json');
      const data = await fs.readFile(rulesPath, 'utf8');
      this.rules = JSON.parse(data);
      console.error('[Security] Security rules loaded');
    } catch (error) {
      console.error('[Security] Failed to load security rules:', error.message);
      // Utiliser des règles par défaut minimales
      this.rules = { rules: { dangerousPatterns: [], suspiciousPatterns: [] } };
    }
  }

  /**
   * Valide une commande avant exécution
   */
  validateCommand(command, context = {}) {
    if (!this.enabled) {
      return { valid: true, severity: 'none', warnings: [] };
    }

    const result = {
      valid: true,
      severity: 'none',
      warnings: [],
      requiresConfirmation: false,
      blocked: false,
    };

    // Vérifier les commandes interdites
    if (this.config.forbiddenCommands) {
      for (const forbidden of this.config.forbiddenCommands) {
        if (command.includes(forbidden)) {
          result.valid = false;
          result.blocked = true;
          result.severity = 'critical';
          result.warnings.push({
            type: 'forbidden_command',
            message: `Command contains forbidden pattern: ${forbidden}`,
            severity: 'critical',
          });
          return result; // Bloquer immédiatement
        }
      }
    }

    // Vérifier les patterns dangereux
    if (this.rules?.rules?.dangerousPatterns) {
      for (const pattern of this.rules.rules.dangerousPatterns) {
        try {
          const regex = new RegExp(pattern.pattern, 'i');
          if (regex.test(command)) {
            result.warnings.push({
              type: 'dangerous_pattern',
              message: pattern.message,
              severity: pattern.severity,
              pattern: pattern.pattern,
            });

            if (pattern.severity === 'critical') {
              result.valid = false;
              result.blocked = true;
              result.severity = 'critical';
              return result;
            }

            if (pattern.severity === 'high' && result.severity !== 'critical') {
              result.severity = 'high';
              result.requiresConfirmation = true;
            }
          }
        } catch (error) {
          console.error(`[Security] Invalid regex pattern: ${pattern.pattern}`);
        }
      }
    }

    // Vérifier les patterns suspects
    if (this.rules?.rules?.suspiciousPatterns) {
      for (const pattern of this.rules.rules.suspiciousPatterns) {
        try {
          const regex = new RegExp(pattern.pattern, 'i');
          if (regex.test(command)) {
            result.warnings.push({
              type: 'suspicious_pattern',
              message: pattern.message,
              severity: pattern.severity,
              pattern: pattern.pattern,
            });

            if (result.severity === 'none' || result.severity === 'low') {
              result.severity = pattern.severity;
            }
          }
        } catch (error) {
          console.error(`[Security] Invalid regex pattern: ${pattern.pattern}`);
        }
      }
    }

    // Vérifier si la commande nécessite confirmation
    if (this.rules?.rules?.requireConfirmation) {
      for (const keyword of this.rules.rules.requireConfirmation) {
        if (command.includes(keyword)) {
          result.requiresConfirmation = true;
          result.warnings.push({
            type: 'requires_confirmation',
            message: `Command contains keyword requiring confirmation: ${keyword}`,
            severity: 'medium',
          });
        }
      }
    }

    // Vérifier les chemins protégés
    if (this.config.forbiddenPaths) {
      for (const forbiddenPath of this.config.forbiddenPaths) {
        if (command.includes(forbiddenPath)) {
          result.warnings.push({
            type: 'protected_path',
            message: `Command accesses protected path: ${forbiddenPath}`,
            severity: 'high',
          });
          result.requiresConfirmation = true;
          if (result.severity === 'none' || result.severity === 'low') {
            result.severity = 'high';
          }
        }
      }
    }

    // Mode whitelist
    if (this.config.whitelistMode && this.config.allowedCommands?.length > 0) {
      const commandName = command.trim().split(/\s+/)[0];
      if (!this.config.allowedCommands.includes(commandName)) {
        result.valid = false;
        result.blocked = true;
        result.severity = 'critical';
        result.warnings.push({
          type: 'not_whitelisted',
          message: `Command "${commandName}" is not in the whitelist`,
          severity: 'critical',
        });
      }
    }

    return result;
  }

  /**
   * Analyse l'impact potentiel d'une commande
   */
  analyzeImpact(command) {
    const impact = {
      filesystemChanges: false,
      networkActivity: false,
      systemModification: false,
      processSpawn: false,
      privilegeEscalation: false,
      estimatedRisk: 'low',
    };

    // Modifications du système de fichiers
    const fsPatterns = /\b(rm|mv|cp|dd|mkdir|rmdir|touch|chmod|chown)\b/i;
    if (fsPatterns.test(command)) {
      impact.filesystemChanges = true;
      impact.estimatedRisk = 'medium';
    }

    // Activité réseau
    const netPatterns = /\b(curl|wget|nc|netcat|ssh|scp|ftp|telnet)\b/i;
    if (netPatterns.test(command)) {
      impact.networkActivity = true;
      impact.estimatedRisk = 'medium';
    }

    // Modification système
    const sysPatterns = /\b(apt|yum|dnf|pacman|systemctl|service|reboot|shutdown)\b/i;
    if (sysPatterns.test(command)) {
      impact.systemModification = true;
      impact.estimatedRisk = 'high';
    }

    // Spawn de processus
    const procPatterns = /\b(exec|spawn|fork|&|\||xargs)\b/i;
    if (procPatterns.test(command)) {
      impact.processSpawn = true;
    }

    // Escalade de privilèges
    const privPatterns = /\b(sudo|su|doas|pkexec)\b/i;
    if (privPatterns.test(command)) {
      impact.privilegeEscalation = true;
      impact.estimatedRisk = 'high';
    }

    return impact;
  }

  /**
   * Dry-run: simule l'exécution sans l'exécuter
   */
  dryRun(command) {
    const validation = this.validateCommand(command);
    const impact = this.analyzeImpact(command);

    return {
      command,
      validation,
      impact,
      recommendation: this.getRecommendation(validation, impact),
      timestamp: Date.now(),
    };
  }

  /**
   * Génère une recommandation basée sur l'analyse
   */
  getRecommendation(validation, impact) {
    if (validation.blocked) {
      return 'BLOCK: Command is too dangerous to execute';
    }

    if (validation.severity === 'critical') {
      return 'DENY: Critical security risk detected';
    }

    if (validation.severity === 'high') {
      return 'CAUTION: High risk - requires user confirmation';
    }

    if (impact.estimatedRisk === 'high') {
      return 'WARNING: High impact operation - proceed with caution';
    }

    if (validation.requiresConfirmation || impact.estimatedRisk === 'medium') {
      return 'INFO: Medium risk - confirmation recommended';
    }

    return 'OK: Command appears safe to execute';
  }

  /**
   * Sanitize une commande (basique)
   */
  sanitizeCommand(command) {
    // Retirer les caractères de contrôle dangereux
    let sanitized = command.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Retirer les séquences d'échappement malicieuses
    sanitized = sanitized.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

    return sanitized.trim();
  }

  /**
   * Vérifie les limites de ressources (placeholder)
   */
  checkResourceLimits(context = {}) {
    const limits = {
      cpuOk: true,
      memoryOk: true,
      timeOk: true,
      warnings: [],
    };

    // TODO: Implémenter la vérification réelle des ressources
    // Pour l'instant, juste un placeholder

    return limits;
  }

  /**
   * Génère un rapport de sécurité complet
   */
  generateSecurityReport(command, context = {}) {
    const validation = this.validateCommand(command, context);
    const impact = this.analyzeImpact(command);
    const sanitized = this.sanitizeCommand(command);
    const recommendation = this.getRecommendation(validation, impact);

    return {
      command: {
        original: command,
        sanitized,
      },
      validation,
      impact,
      recommendation,
      safe: validation.valid && !validation.blocked && validation.severity !== 'critical',
      timestamp: Date.now(),
    };
  }
}

export default SecurityManager;
