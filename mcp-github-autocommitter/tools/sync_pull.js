/**
 * Tool MCP: sync_pull
 * Pull depuis remote pour synchroniser
 */

export const sync_pull = {
  name: 'sync_pull',
  description: 'Pull depuis remote pour synchroniser (merge ou rebase)',

  inputSchema: {
    type: 'object',
    properties: {
      repo_path: {
        type: 'string',
        description: 'Chemin vers le dépôt',
      },
      remote: {
        type: 'string',
        description: 'Nom du remote',
        default: 'origin',
      },
      branch: {
        type: 'string',
        description: 'Branche (vide = current)',
      },
      strategy: {
        type: 'string',
        enum: ['merge', 'rebase'],
        description: 'Stratégie de synchronisation',
        default: 'merge',
      },
    },
    required: ['repo_path'],
  },

  async execute(params, context) {
    const { gitManager, logger } = context;
    const startTime = Date.now();

    try {
      logger.info('sync_pull', `Pulling from: ${params.remote || 'origin'}`);

      // Vérifier l'état
      const status = await gitManager.getStatus(params.repo_path);

      if (status.repo.behind === 0) {
        logger.info('sync_pull', 'Already up to date');
        return {
          success: true,
          message: 'Already up to date',
          pull: {
            files_updated: 0,
          },
        };
      }

      // Pull
      const result = await gitManager.pull(params.repo_path, {
        remote: params.remote,
        branch: params.branch,
        rebase: params.strategy === 'rebase',
      });

      const duration = Date.now() - startTime;
      logger.success('sync_pull', `Pull completed in ${duration}ms`);

      return {
        success: true,
        pull: result.pull,
        duration,
      };

    } catch (error) {
      logger.error('sync_pull', error.message);

      // Détecter conflits
      if (error.message.includes('conflict') || error.message.includes('CONFLICT')) {
        return {
          success: false,
          error: 'Merge conflicts detected',
          code: 'MERGE_CONFLICT',
          recommendation: 'Resolve conflicts manually',
        };
      }

      return error.toJSON ? error.toJSON() : {
        success: false,
        error: error.message,
      };
    }
  },
};
