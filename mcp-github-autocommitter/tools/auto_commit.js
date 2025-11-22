/**
 * Tool MCP: auto_commit
 * Crée un commit automatique avec message intelligent
 */

export const auto_commit = {
  name: 'auto_commit',
  description: 'Crée un commit automatique avec génération intelligente du message',

  inputSchema: {
    type: 'object',
    properties: {
      repo_path: {
        type: 'string',
        description: 'Chemin vers le dépôt',
      },
      message: {
        type: 'string',
        description: 'Message personnalisé (optionnel)',
      },
      auto_message: {
        type: 'boolean',
        description: 'Générer le message automatiquement',
        default: true,
      },
      style: {
        type: 'string',
        enum: ['conventional', 'simple', 'detailed'],
        description: 'Style du message auto-généré',
        default: 'conventional',
      },
      author: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
        },
        description: 'Auteur du commit (optionnel)',
      },
      amend: {
        type: 'boolean',
        description: 'Amend le dernier commit',
        default: false,
      },
      allow_empty: {
        type: 'boolean',
        description: 'Autoriser commit vide',
        default: false,
      },
    },
    required: ['repo_path'],
  },

  async execute(params, context) {
    const { gitManager, commitMessageAI, securityChecker, logger } = context;
    const startTime = Date.now();

    try {
      logger.info('auto_commit', `Creating commit in: ${params.repo_path}`);

      // Vérifier qu'il y a des changements stagés
      const status = await gitManager.getStatus(params.repo_path);

      if (status.changes.staged.length === 0 && !params.allow_empty) {
        logger.warning('auto_commit', 'No staged changes');
        return {
          success: false,
          error: 'No staged changes to commit',
          code: 'NO_CHANGES',
          hint: 'Use stage_changes tool first',
        };
      }

      // Vérification de sécurité
      if (context.config.security.scanForSecrets && status.changes.staged.length > 0) {
        logger.info('auto_commit', 'Running security scan...');

        const securityCheck = await securityChecker.validateFilesForCommit(
          params.repo_path,
          status.changes.staged
        );

        if (!securityCheck.safe) {
          logger.error('auto_commit', 'Security violations detected!');
          return {
            success: false,
            error: 'Security violations detected',
            code: 'SECURITY_VIOLATION',
            issues: securityCheck.issues,
            recommendation: 'Fix security issues before committing',
          };
        }

        logger.success('auto_commit', `Security scan passed (${securityCheck.scanned} files)`);
      }

      // Générer ou utiliser le message
      let commitMessage = params.message;

      if (params.auto_message && !commitMessage) {
        logger.info('auto_commit', 'Generating commit message...');

        const diffStats = await gitManager.getDiffStats(params.repo_path);
        commitMessage = await commitMessageAI.generateMessage(
          status.changes.staged,
          diffStats.files,
          params.style
        );

        logger.info('auto_commit', `Generated message: ${commitMessage.split('\n')[0]}`);
      }

      if (!commitMessage) {
        return {
          success: false,
          error: 'No commit message provided',
          code: 'NO_MESSAGE',
        };
      }

      // Créer le commit
      const commitOptions = {
        author: params.author || {
          name: context.config.git.author.name,
          email: context.config.git.author.email,
        },
        amend: params.amend,
        allowEmpty: params.allow_empty,
      };

      const result = await gitManager.commit(params.repo_path, commitMessage, commitOptions);

      const duration = Date.now() - startTime;
      logger.success('auto_commit', `Commit created: ${result.commit.hash} in ${duration}ms`);

      return {
        success: true,
        commit: {
          ...result.commit,
          files_committed: status.changes.staged.length,
        },
        duration,
      };

    } catch (error) {
      logger.error('auto_commit', error.message);
      return error.toJSON ? error.toJSON() : {
        success: false,
        error: error.message,
      };
    }
  },
};
