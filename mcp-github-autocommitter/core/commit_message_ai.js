/**
 * Générateur intelligent de messages de commit
 */

import { DiffAnalyzer } from './diff_analyzer.js';
import { logger } from '../utils/logger.js';

export class CommitMessageAI {
  constructor(config = {}) {
    this.config = config;
    this.diffAnalyzer = new DiffAnalyzer(config);
  }

  /**
   * Génère un message de commit intelligent basé sur les changements
   */
  async generateMessage(files, diffStats, style = 'conventional') {
    try {
      // Analyser les changements
      const analysis = await this.diffAnalyzer.analyzeDiff(files, diffStats);

      switch (style) {
        case 'conventional':
          return this.generateConventionalMessage(analysis);
        case 'detailed':
          return this.generateDetailedMessage(analysis);
        case 'simple':
          return this.generateSimpleMessage(analysis);
        default:
          return this.generateConventionalMessage(analysis);
      }
    } catch (error) {
      logger.error('CommitMessageAI', `Failed to generate message: ${error.message}`);
      return 'chore: update project files';
    }
  }

  /**
   * Génère un message Conventional Commits
   * Format: <type>(<scope>): <subject>
   */
  generateConventionalMessage(analysis) {
    const { summary, files } = analysis;
    const primaryType = this.diffAnalyzer.getPrimaryCommitType(summary.changes_by_type);

    // Sujet (subject) : description courte
    let subject = this.diffAnalyzer.generateShortDescription(summary.changes_by_type);

    // Capitaliser première lettre
    subject = subject.charAt(0).toLowerCase() + subject.slice(1);

    // Header
    let message = `${primaryType}: ${subject}`;

    // Body (optionnel) : détails des changements
    const bodyParts = [];

    for (const [type, fileList] of Object.entries(summary.changes_by_type)) {
      if (fileList.length > 0 && type !== primaryType) {
        const typeLabel = {
          feat: 'Features',
          fix: 'Fixes',
          docs: 'Documentation',
          style: 'Style',
          refactor: 'Refactoring',
          perf: 'Performance',
          test: 'Tests',
          build: 'Build',
          ci: 'CI',
          chore: 'Chores',
        }[type] || type;

        bodyParts.push(`- ${typeLabel}: ${fileList.slice(0, 3).map(f => this.getFileName(f)).join(', ')}`);
      }
    }

    // Ajouter le body si présent
    if (bodyParts.length > 0) {
      message += '\n\n' + bodyParts.join('\n');
    }

    // Footer : stats
    if (this.config.includeStats) {
      message += `\n\nFiles changed: ${summary.files_changed}`;
      message += ` | +${summary.insertions} -${summary.deletions}`;
    }

    return message;
  }

  /**
   * Génère un message détaillé
   */
  generateDetailedMessage(analysis) {
    const { summary, files } = analysis;

    let message = `Update project with ${summary.files_changed} file(s)\n\n`;

    // Lister tous les fichiers avec leur type de changement
    const grouped = {};
    for (const file of files) {
      const type = file.semantic_type;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(file);
    }

    for (const [type, fileList] of Object.entries(grouped)) {
      const typeEmoji = {
        feat: '✨',
        fix: '🐛',
        docs: '📚',
        style: '💄',
        refactor: '♻️',
        perf: '⚡',
        test: '✅',
        build: '🔧',
        ci: '👷',
        chore: '🔨',
      }[type] || '📦';

      message += `${typeEmoji} ${type.toUpperCase()}:\n`;
      for (const file of fileList) {
        message += `  - ${file.path} (+${file.insertions} -${file.deletions})\n`;
      }
      message += '\n';
    }

    message += `Total: +${summary.insertions} insertions, -${summary.deletions} deletions`;

    return message.trim();
  }

  /**
   * Génère un message simple
   */
  generateSimpleMessage(analysis) {
    const { summary } = analysis;
    const description = this.diffAnalyzer.generateShortDescription(summary.changes_by_type);

    return `${description.charAt(0).toUpperCase() + description.slice(1)} (${summary.files_changed} files)`;
  }

  /**
   * Extrait le nom du fichier sans le chemin
   */
  getFileName(filePath) {
    return filePath.split('/').pop();
  }

  /**
   * Valide un message de commit
   */
  validateMessage(message) {
    const maxLength = this.config.maxMessageLength || 200;

    if (!message || message.trim().length === 0) {
      return { valid: false, error: 'Commit message cannot be empty' };
    }

    // Vérifier la longueur de la première ligne (header)
    const firstLine = message.split('\n')[0];
    if (firstLine.length > maxLength) {
      return {
        valid: false,
        error: `First line too long (${firstLine.length} > ${maxLength})`,
      };
    }

    return { valid: true };
  }
}
