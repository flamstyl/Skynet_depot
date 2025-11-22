/**
 * Tool MCP: generate_changelog
 * Génère un changelog structuré
 */

export const generate_changelog = {
  name: 'generate_changelog',
  description: 'Génère un changelog structuré (JSON, Markdown, Conventional Commits)',

  inputSchema: {
    type: 'object',
    properties: {
      repo_path: {
        type: 'string',
        description: 'Chemin vers le dépôt',
      },
      format: {
        type: 'string',
        enum: ['json', 'markdown', 'conventional'],
        description: 'Format du changelog',
        default: 'markdown',
      },
      style: {
        type: 'string',
        enum: ['keep-a-changelog', 'conventional-commits', 'simple'],
        description: 'Style du changelog',
        default: 'conventional-commits',
      },
      include_stats: {
        type: 'boolean',
        description: 'Inclure les statistiques',
        default: true,
      },
    },
    required: ['repo_path'],
  },

  async execute(params, context) {
    const { gitManager, diffAnalyzer, changelogGenerator, logger } = context;
    const startTime = Date.now();

    try {
      logger.info('generate_changelog', `Generating changelog for: ${params.repo_path}`);

      // Récupérer les fichiers modifiés
      const status = await gitManager.getStatus(params.repo_path);
      const allFiles = [
        ...status.changes.staged,
        ...status.changes.unstaged,
      ];

      if (allFiles.length === 0) {
        return {
          success: true,
          changelog: { message: 'No changes to document' },
          formatted: 'No changes',
        };
      }

      // Analyser les changements
      const diffStats = await gitManager.getDiffStats(params.repo_path);
      const analysis = await diffAnalyzer.analyzeDiff(allFiles, diffStats.files);

      // Générer le changelog
      const result = await changelogGenerator.generate(
        analysis,
        params.format,
        params.style
      );

      const duration = Date.now() - startTime;
      logger.success('generate_changelog', `Changelog generated in ${duration}ms`);

      return {
        ...result,
        duration,
      };

    } catch (error) {
      logger.error('generate_changelog', error.message);
      return error.toJSON ? error.toJSON() : {
        success: false,
        error: error.message,
      };
    }
  },
};
