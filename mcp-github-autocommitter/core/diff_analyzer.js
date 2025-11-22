/**
 * Analyseur de diff pour classification sémantique des changements
 */

import { logger } from '../utils/logger.js';

export class DiffAnalyzer {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Analyse un diff et détermine le type de changement sémantique
   */
  analyzeFileDiff(filePath, diffText) {
    const fileExt = filePath.split('.').pop();
    const fileName = filePath.split('/').pop();

    // Détection par nom de fichier
    if (fileName === 'README.md' || fileName.startsWith('README')) {
      return { type: 'docs', description: 'Documentation update' };
    }
    if (fileName.endsWith('.test.js') || fileName.endsWith('.spec.js')) {
      return { type: 'test', description: 'Test update' };
    }
    if (fileName === 'package.json' || fileName === 'package-lock.json') {
      return { type: 'build', description: 'Dependencies update' };
    }
    if (fileName.startsWith('.') || fileName.endsWith('.config.js')) {
      return { type: 'chore', description: 'Configuration change' };
    }

    // Analyse du contenu du diff
    if (diffText.includes('+function ') || diffText.includes('+export ') || diffText.includes('+class ')) {
      return { type: 'feat', description: 'New functionality added' };
    }
    if (diffText.includes('fix') || diffText.includes('bug') || diffText.includes('error')) {
      return { type: 'fix', description: 'Bug fix' };
    }
    if (diffText.includes('-function ') || diffText.includes('-export ') || diffText.includes('-class ')) {
      return { type: 'refactor', description: 'Code refactoring' };
    }

    // Par extension de fichier
    if (['md', 'txt', 'rst', 'adoc'].includes(fileExt)) {
      return { type: 'docs', description: 'Documentation' };
    }
    if (['css', 'scss', 'sass', 'less'].includes(fileExt)) {
      return { type: 'style', description: 'Styling changes' };
    }
    if (['yml', 'yaml', 'json', 'toml'].includes(fileExt)) {
      return { type: 'chore', description: 'Configuration' };
    }

    // Défaut
    return { type: 'chore', description: 'General changes' };
  }

  /**
   * Analyse un ensemble de changements et génère un résumé
   */
  async analyzeDiff(files, diffStats) {
    const changesByType = {
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      perf: [],
      test: [],
      build: [],
      ci: [],
      chore: [],
    };

    const analyzedFiles = [];

    for (const file of files) {
      const stats = diffStats.find(s => s.path === file) || { insertions: 0, deletions: 0 };
      const analysis = this.analyzeFileDiff(file, ''); // On pourrait passer le diff complet si disponible

      changesByType[analysis.type].push(file);

      analyzedFiles.push({
        path: file,
        semantic_type: analysis.type,
        description: analysis.description,
        insertions: stats.insertions,
        deletions: stats.deletions,
      });
    }

    // Résumé
    const summary = {
      files_changed: files.length,
      insertions: diffStats.reduce((sum, s) => sum + s.insertions, 0),
      deletions: diffStats.reduce((sum, s) => sum + s.deletions, 0),
      changes_by_type: {},
    };

    // Convertir en descriptions lisibles
    for (const [type, fileList] of Object.entries(changesByType)) {
      if (fileList.length > 0) {
        summary.changes_by_type[type] = fileList;
      }
    }

    return {
      summary,
      files: analyzedFiles,
    };
  }

  /**
   * Détermine le type de commit principal basé sur les changements
   */
  getPrimaryCommitType(changesByType) {
    // Priorité : feat > fix > docs > autres
    const priority = ['feat', 'fix', 'docs', 'refactor', 'test', 'style', 'build', 'chore'];

    for (const type of priority) {
      if (changesByType[type] && changesByType[type].length > 0) {
        return type;
      }
    }

    return 'chore';
  }

  /**
   * Génère une description courte des changements
   */
  generateShortDescription(changesByType) {
    const descriptions = {
      feat: 'add new features',
      fix: 'fix bugs',
      docs: 'update documentation',
      style: 'style changes',
      refactor: 'refactor code',
      perf: 'improve performance',
      test: 'add/update tests',
      build: 'update build config',
      ci: 'update CI/CD',
      chore: 'general maintenance',
    };

    const primaryType = this.getPrimaryCommitType(changesByType);
    return descriptions[primaryType] || 'update project';
  }
}
