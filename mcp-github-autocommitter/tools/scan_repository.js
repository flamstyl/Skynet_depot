/**
 * Tool MCP: scan_repository
 * Scanne un repo Git et récupère son état actuel
 */

export const scan_repository = {
  name: 'scan_repository',
  description: 'Scanne un dépôt Git et récupère son état actuel (branches, changements, stats)',

  inputSchema: {
    type: 'object',
    properties: {
      repo_path: {
        type: 'string',
        description: 'Chemin absolu vers le dépôt Git',
      },
      include_untracked: {
        type: 'boolean',
        description: 'Inclure les fichiers non trackés',
        default: true,
      },
      max_files: {
        type: 'number',
        description: 'Limite de fichiers à scanner',
        default: 1000,
      },
    },
    required: ['repo_path'],
  },

  async execute(params, context) {
    const { gitManager, logger } = context;
    const startTime = Date.now();

    try {
      logger.info('scan_repository', `Scanning repository: ${params.repo_path}`);

      // Récupérer le statut via GitManager
      const status = await gitManager.getStatus(params.repo_path);

      // Compter les changements
      const totalChanges =
        status.changes.staged.length +
        status.changes.unstaged.length +
        (params.include_untracked ? status.changes.untracked.length : 0);

      // Vérifier la limite
      if (totalChanges > params.max_files) {
        logger.warning('scan_repository', `Too many files (${totalChanges} > ${params.max_files})`);
      }

      const duration = Date.now() - startTime;
      logger.success('scan_repository', `Scan completed in ${duration}ms`);

      return {
        success: true,
        repo: status.repo,
        changes: status.changes,
        branches: status.branches,
        remotes: status.remotes,
        stats: {
          total_files_changed: totalChanges,
          staged: status.changes.staged.length,
          unstaged: status.changes.unstaged.length,
          untracked: status.changes.untracked.length,
        },
        duration,
      };

    } catch (error) {
      logger.error('scan_repository', error.message);
      return error.toJSON ? error.toJSON() : {
        success: false,
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR',
      };
    }
  },
};
