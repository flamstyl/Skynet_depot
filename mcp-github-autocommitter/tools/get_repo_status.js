/**
 * Tool MCP: get_repo_status
 * État complet du repo (santé, branches, remotes)
 */

export const get_repo_status = {
  name: 'get_repo_status',
  description: 'Récupère l\'état complet du dépôt Git (santé, branches, remotes, changements)',

  inputSchema: {
    type: 'object',
    properties: {
      repo_path: {
        type: 'string',
        description: 'Chemin vers le dépôt',
      },
      include_log: {
        type: 'boolean',
        description: 'Inclure les derniers commits',
        default: false,
      },
      log_limit: {
        type: 'number',
        description: 'Nombre de commits à récupérer',
        default: 10,
      },
    },
    required: ['repo_path'],
  },

  async execute(params, context) {
    const { gitManager, logger } = context;
    const startTime = Date.now();

    try {
      logger.info('get_repo_status', `Getting status for: ${params.repo_path}`);

      // Status complet
      const status = await gitManager.getStatus(params.repo_path);

      // Health check
      const health = {
        can_commit: status.changes.staged.length > 0 || status.changes.unstaged.length > 0,
        can_push: status.repo.ahead > 0,
        needs_pull: status.repo.behind > 0,
        has_conflicts: status.changes.conflicted.length > 0,
        is_clean: status.repo.is_clean,
        issues: [],
      };

      if (status.repo.diverged) {
        health.issues.push('Branch has diverged from remote');
      }
      if (!status.remotes || status.remotes.length === 0) {
        health.issues.push('No remote configured');
      }
      if (status.changes.conflicted.length > 0) {
        health.issues.push(`${status.changes.conflicted.length} conflicted file(s)`);
      }

      // Log optionnel
      let log = null;
      if (params.include_log) {
        const logResult = await gitManager.getLog(params.repo_path, params.log_limit);
        log = logResult.commits;
      }

      const duration = Date.now() - startTime;
      logger.success('get_repo_status', `Status retrieved in ${duration}ms`);

      return {
        success: true,
        repo: {
          ...status.repo,
          has_remote: status.remotes.length > 0,
        },
        changes: status.changes,
        branches: status.branches,
        remotes: status.remotes,
        health,
        ...(log && { recent_commits: log }),
        duration,
      };

    } catch (error) {
      logger.error('get_repo_status', error.message);
      return error.toJSON ? error.toJSON() : {
        success: false,
        error: error.message,
      };
    }
  },
};
