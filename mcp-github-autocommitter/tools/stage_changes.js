/**
 * Tool MCP: stage_changes
 * Stage des fichiers pour commit
 */

import micromatch from 'micromatch';

export const stage_changes = {
  name: 'stage_changes',
  description: 'Stage des fichiers pour commit (supporte patterns glob)',

  inputSchema: {
    type: 'object',
    properties: {
      repo_path: {
        type: 'string',
        description: 'Chemin vers le dépôt',
      },
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Fichiers à stager (vide = tous)',
        default: [],
      },
      pattern: {
        type: 'string',
        description: 'Pattern glob (ex: "*.js")',
      },
      exclude_patterns: {
        type: 'array',
        items: { type: 'string' },
        description: 'Patterns à exclure',
        default: [],
      },
      dry_run: {
        type: 'boolean',
        description: 'Simulation sans exécution',
        default: false,
      },
    },
    required: ['repo_path'],
  },

  async execute(params, context) {
    const { gitManager, logger } = context;
    const startTime = Date.now();

    try {
      logger.info('stage_changes', `Staging files in: ${params.repo_path}`);

      // Récupérer les fichiers modifiés
      const status = await gitManager.getStatus(params.repo_path);
      let filesToStage = [];

      if (params.files && params.files.length > 0) {
        // Fichiers spécifiques
        filesToStage = params.files;
      } else if (params.pattern) {
        // Pattern glob
        const allFiles = [
          ...status.changes.unstaged,
          ...status.changes.untracked,
        ];
        filesToStage = micromatch(allFiles, params.pattern);
      } else {
        // Tous les fichiers
        filesToStage = [
          ...status.changes.unstaged,
          ...status.changes.untracked,
        ];
      }

      // Exclure patterns
      if (params.exclude_patterns && params.exclude_patterns.length > 0) {
        filesToStage = micromatch(filesToStage, ['*', ...params.exclude_patterns.map(p => `!${p}`)]);
      }

      if (filesToStage.length === 0) {
        return {
          success: true,
          message: 'No files to stage',
          staged_files: [],
        };
      }

      // Dry run
      if (params.dry_run) {
        logger.info('stage_changes', `Dry run: would stage ${filesToStage.length} file(s)`);
        return {
          success: true,
          dry_run: true,
          files_to_stage: filesToStage,
          total: filesToStage.length,
        };
      }

      // Stage files
      await gitManager.stageFiles(params.repo_path, filesToStage);

      const duration = Date.now() - startTime;
      logger.success('stage_changes', `Staged ${filesToStage.length} file(s) in ${duration}ms`);

      return {
        success: true,
        staged_files: filesToStage,
        total_staged: filesToStage.length,
        duration,
      };

    } catch (error) {
      logger.error('stage_changes', error.message);
      return error.toJSON ? error.toJSON() : {
        success: false,
        error: error.message,
      };
    }
  },
};
