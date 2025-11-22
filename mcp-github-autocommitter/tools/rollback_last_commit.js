/**
 * Tool MCP: rollback_last_commit
 * Annule le dernier commit (safety net)
 */

export const rollback_last_commit = {
  name: 'rollback_last_commit',
  description: 'Annule le dernier commit (soft, mixed, ou hard reset)',

  inputSchema: {
    type: 'object',
    properties: {
      repo_path: {
        type: 'string',
        description: 'Chemin vers le dépôt',
      },
      mode: {
        type: 'string',
        enum: ['soft', 'mixed', 'hard'],
        description: 'Mode de reset (soft=keep changes staged, mixed=keep changes unstaged, hard=discard changes)',
        default: 'soft',
      },
      steps: {
        type: 'number',
        description: 'Nombre de commits à annuler',
        default: 1,
        minimum: 1,
        maximum: 10,
      },
    },
    required: ['repo_path'],
  },

  async execute(params, context) {
    const { gitManager, logger } = context;
    const startTime = Date.now();

    try {
      logger.warning('rollback_last_commit', `Rolling back ${params.steps} commit(s) in ${params.mode} mode`);

      // Récupérer le log avant reset
      const beforeLog = await gitManager.getLog(params.repo_path, params.steps + 1);

      if (beforeLog.commits.length <= params.steps) {
        return {
          success: false,
          error: `Not enough commits to rollback (only ${beforeLog.commits.length} commit(s) in history)`,
          code: 'INSUFFICIENT_COMMITS',
        };
      }

      // Reset
      const result = await gitManager.reset(params.repo_path, {
        mode: params.mode,
        steps: params.steps,
      });

      // Récupérer le nouveau status
      const afterStatus = await gitManager.getStatus(params.repo_path);

      const duration = Date.now() - startTime;
      logger.success('rollback_last_commit', `Rollback completed in ${duration}ms`);

      return {
        success: true,
        rollback: {
          mode: params.mode,
          steps: params.steps,
          commits_removed: beforeLog.commits.slice(0, params.steps).map(c => ({
            hash: c.hash,
            message: c.message,
          })),
        },
        current_status: {
          branch: afterStatus.repo.current_branch,
          staged: afterStatus.changes.staged.length,
          unstaged: afterStatus.changes.unstaged.length,
        },
        duration,
      };

    } catch (error) {
      logger.error('rollback_last_commit', error.message);
      return error.toJSON ? error.toJSON() : {
        success: false,
        error: error.message,
      };
    }
  },
};
