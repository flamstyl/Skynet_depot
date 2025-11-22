/**
 * Tool MCP: auto_push
 * Push vers remote GitHub avec retry automatique
 */

export const auto_push = {
  name: 'auto_push',
  description: 'Push vers remote GitHub avec retry automatique et validation',

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
      force: {
        type: 'boolean',
        description: 'Force push (dangereux!)',
        default: false,
      },
      set_upstream: {
        type: 'boolean',
        description: 'Set upstream branch',
        default: true,
      },
    },
    required: ['repo_path'],
  },

  async execute(params, context) {
    const { gitManager, retryEngine, logger } = context;
    const startTime = Date.now();

    try {
      logger.info('auto_push', `Pushing to remote: ${params.remote || 'origin'}`);

      // Récupérer le statut
      const status = await gitManager.getStatus(params.repo_path);
      const branch = params.branch || status.repo.current_branch;
      const remote = params.remote || context.config.git.defaultRemote || 'origin';

      // Vérifier protection des branches
      const protectedBranches = context.config.push.forcePushProtectedBranches || [];
      if (params.force && protectedBranches.includes(branch)) {
        logger.error('auto_push', `Force push blocked on protected branch: ${branch}`);
        return {
          success: false,
          error: `Force push is not allowed on protected branch: ${branch}`,
          code: 'FORCE_PUSH_BLOCKED',
          protected_branches: protectedBranches,
        };
      }

      // Vérifier qu'il y a des commits à pusher
      if (status.repo.ahead === 0 && !params.force) {
        logger.info('auto_push', 'No commits to push (branch up to date)');
        return {
          success: true,
          message: 'Already up to date',
          push: {
            remote,
            branch,
            commits_pushed: 0,
          },
        };
      }

      // Vérifier divergence
      if (status.repo.diverged && !params.force) {
        logger.error('auto_push', 'Branch has diverged from remote');
        return {
          success: false,
          error: 'Branch has diverged from remote',
          code: 'BRANCH_DIVERGED',
          recommendation: 'Pull from remote first or use force push (dangerous)',
          status: {
            ahead: status.repo.ahead,
            behind: status.repo.behind,
          },
        };
      }

      // Push avec retry
      const pushFn = async () => {
        return await gitManager.push(params.repo_path, {
          remote,
          branch,
          force: params.force,
          setUpstream: params.set_upstream,
        });
      };

      const result = await retryEngine.executeWithRetry(pushFn, `push to ${remote}/${branch}`);

      const duration = Date.now() - startTime;
      logger.success('auto_push', `Push completed in ${duration}ms`);

      return {
        success: true,
        push: {
          remote,
          branch,
          url: status.remotes.find(r => r.name === remote)?.push_url || 'unknown',
          commits_pushed: status.repo.ahead,
        },
        duration,
      };

    } catch (error) {
      logger.error('auto_push', error.message);
      return error.toJSON ? error.toJSON() : {
        success: false,
        error: error.message,
        code: error.code || 'PUSH_FAILED',
      };
    }
  },
};
