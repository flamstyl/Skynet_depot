/**
 * Tool MCP: generate_diff_summary
 * Génère un résumé détaillé des changements
 */

export const generate_diff_summary = {
  name: 'generate_diff_summary',
  description: 'Génère un résumé détaillé des changements dans le dépôt',

  inputSchema: {
    type: 'object',
    properties: {
      repo_path: {
        type: 'string',
        description: 'Chemin vers le dépôt',
      },
      format: {
        type: 'string',
        enum: ['unified', 'stat', 'name-only', 'semantic'],
        description: 'Format du diff',
        default: 'semantic',
      },
      ignore_whitespace: {
        type: 'boolean',
        description: 'Ignorer les changements de whitespace',
        default: true,
      },
    },
    required: ['repo_path'],
  },

  async execute(params, context) {
    const { gitManager, diffAnalyzer, logger } = context;
    const startTime = Date.now();

    try {
      logger.info('generate_diff_summary', `Analyzing diff for: ${params.repo_path}`);

      // Récupérer les fichiers modifiés
      const status = await gitManager.getStatus(params.repo_path);
      const allFiles = [
        ...status.changes.staged,
        ...status.changes.unstaged,
      ];

      if (allFiles.length === 0) {
        return {
          success: true,
          summary: {
            files_changed: 0,
            insertions: 0,
            deletions: 0,
            message: 'No changes detected',
          },
          files: [],
        };
      }

      // Récupérer les stats de diff
      const diffStats = await gitManager.getDiffStats(params.repo_path);

      // Analyse sémantique si demandée
      let analysis = null;
      if (params.format === 'semantic') {
        analysis = await diffAnalyzer.analyzeDiff(allFiles, diffStats.files);
      }

      const duration = Date.now() - startTime;
      logger.success('generate_diff_summary', `Analysis completed in ${duration}ms`);

      return {
        success: true,
        summary: analysis ? analysis.summary : {
          files_changed: allFiles.length,
          insertions: diffStats.total_insertions,
          deletions: diffStats.total_deletions,
        },
        files: analysis ? analysis.files : diffStats.files,
        duration,
      };

    } catch (error) {
      logger.error('generate_diff_summary', error.message);
      return error.toJSON ? error.toJSON() : {
        success: false,
        error: error.message,
      };
    }
  },
};
