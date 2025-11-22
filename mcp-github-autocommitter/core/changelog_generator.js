/**
 * Générateur de changelog (JSON, Markdown, Conventional Commits)
 */

import { logger } from '../utils/logger.js';

export class ChangelogGenerator {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Génère un changelog à partir de l'analyse de diff
   */
  async generate(diffAnalysis, format = 'markdown', style = 'conventional-commits') {
    const { summary, files } = diffAnalysis;

    const changelog = {
      version: this.inferVersion(summary.changes_by_type),
      date: new Date().toISOString().split('T')[0],
      categories: this.categorizeChanges(summary.changes_by_type, files),
      stats: {
        files_changed: summary.files_changed,
        insertions: summary.insertions,
        deletions: summary.deletions,
      },
    };

    let formattedChangelog = '';

    switch (format) {
      case 'json':
        formattedChangelog = JSON.stringify(changelog, null, 2);
        break;
      case 'markdown':
        formattedChangelog = this.formatMarkdown(changelog, style);
        break;
      case 'conventional':
        formattedChangelog = this.formatConventional(changelog);
        break;
      default:
        formattedChangelog = this.formatSimple(changelog);
    }

    return {
      success: true,
      changelog,
      formatted: formattedChangelog,
      format,
    };
  }

  /**
   * Infère le numéro de version (simpliste, basé sur les types de changements)
   */
  inferVersion(changesByType) {
    // Si feat → minor bump
    if (changesByType.feat && changesByType.feat.length > 0) {
      return 'minor'; // ex: 1.1.0 -> 1.2.0
    }
    // Si fix → patch bump
    if (changesByType.fix && changesByType.fix.length > 0) {
      return 'patch'; // ex: 1.1.0 -> 1.1.1
    }
    // Sinon patch
    return 'patch';
  }

  /**
   * Catégorise les changements avec descriptions
   */
  categorizeChanges(changesByType, files) {
    const categories = {};

    const typeLabels = {
      feat: { label: 'Features', emoji: '✨' },
      fix: { label: 'Bug Fixes', emoji: '🐛' },
      docs: { label: 'Documentation', emoji: '📚' },
      style: { label: 'Styles', emoji: '💄' },
      refactor: { label: 'Code Refactoring', emoji: '♻️' },
      perf: { label: 'Performance Improvements', emoji: '⚡' },
      test: { label: 'Tests', emoji: '✅' },
      build: { label: 'Build System', emoji: '🔧' },
      ci: { label: 'CI/CD', emoji: '👷' },
      chore: { label: 'Chores', emoji: '🔨' },
    };

    for (const [type, fileList] of Object.entries(changesByType)) {
      if (fileList && fileList.length > 0) {
        const typeInfo = typeLabels[type] || { label: type, emoji: '📦' };

        // Créer des descriptions basées sur les fichiers
        const descriptions = fileList.map(file => {
          const fileInfo = files.find(f => f.path === file);
          return fileInfo ? fileInfo.description : `Updated ${file}`;
        });

        categories[type] = {
          label: typeInfo.label,
          emoji: typeInfo.emoji,
          items: [...new Set(descriptions)], // Unique descriptions
          files: fileList,
        };
      }
    }

    return categories;
  }

  /**
   * Formate en Markdown (style Keep a Changelog)
   */
  formatMarkdown(changelog, style) {
    let md = `## [${changelog.version}] - ${changelog.date}\n\n`;

    // Stats
    if (this.config.includeStats) {
      md += `**Changes:** ${changelog.stats.files_changed} files changed, `;
      md += `+${changelog.stats.insertions} insertions, `;
      md += `-${changelog.stats.deletions} deletions\n\n`;
    }

    // Catégories
    for (const [type, data] of Object.entries(changelog.categories)) {
      md += `### ${data.emoji} ${data.label}\n\n`;

      for (const item of data.items) {
        md += `- ${item}\n`;
      }

      md += '\n';
    }

    return md.trim();
  }

  /**
   * Formate en style Conventional Commits
   */
  formatConventional(changelog) {
    const lines = [];

    for (const [type, data] of Object.entries(changelog.categories)) {
      for (const item of data.items) {
        lines.push(`${type}: ${item}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Formate en texte simple
   */
  formatSimple(changelog) {
    let text = `Changes (${changelog.date}):\n\n`;

    for (const [type, data] of Object.entries(changelog.categories)) {
      text += `${data.label}:\n`;
      for (const item of data.items) {
        text += `  - ${item}\n`;
      }
      text += '\n';
    }

    return text.trim();
  }
}
