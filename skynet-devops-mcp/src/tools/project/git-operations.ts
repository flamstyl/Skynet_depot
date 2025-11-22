import simpleGit from 'simple-git';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { NotFoundError, ExecutionError } from '../../lib/errors.js';
import { GitStatusSchema, GitCommitSchema, GitPushSchema } from '../../schemas/project.js';
import { existsSync } from 'fs';

export async function gitStatus(input: unknown) {
  const params = validate(GitStatusSchema, input);

  logger.info('Getting git status', params);

  if (!existsSync(params.repositoryPath)) {
    throw new NotFoundError(`Repository path does not exist: ${params.repositoryPath}`);
  }

  try {
    const git = simpleGit(params.repositoryPath);
    const status = await git.status();

    const result = {
      branch: status.current || 'unknown',
      ahead: status.ahead,
      behind: status.behind,
      modified: status.modified,
      staged: status.staged,
      untracked: status.not_added,
      clean: status.isClean(),
    };

    logger.info('Git status retrieved', { branch: result.branch, clean: result.clean });

    return result;
  } catch (error: any) {
    logger.error('Failed to get git status', { error: error.message });
    throw new ExecutionError(`Failed to get git status: ${error.message}`);
  }
}

export async function gitCommit(input: unknown) {
  const params = validate(GitCommitSchema, input);

  logger.info('Creating git commit', params);

  if (!existsSync(params.repositoryPath)) {
    throw new NotFoundError(`Repository path does not exist: ${params.repositoryPath}`);
  }

  try {
    const git = simpleGit(params.repositoryPath);

    // Configurer l'auteur si fourni
    if (params.author) {
      await git.addConfig('user.name', params.author.name, false, 'local');
      await git.addConfig('user.email', params.author.email, false, 'local');
    }

    // Ajouter les fichiers
    if (params.files && params.files.length > 0) {
      await git.add(params.files);
    } else {
      await git.add('.');
    }

    // Créer le commit
    const commitResult = await git.commit(params.message);

    logger.info('Git commit created', { hash: commitResult.commit, message: params.message });

    return {
      success: true,
      hash: commitResult.commit,
      message: params.message,
      filesChanged: commitResult.summary.changes,
    };
  } catch (error: any) {
    logger.error('Failed to create git commit', { error: error.message });
    throw new ExecutionError(`Failed to create git commit: ${error.message}`);
  }
}

export async function gitPush(input: unknown) {
  const params = validate(GitPushSchema, input);

  logger.info('Pushing to git remote', params);

  if (!existsSync(params.repositoryPath)) {
    throw new NotFoundError(`Repository path does not exist: ${params.repositoryPath}`);
  }

  try {
    const git = simpleGit(params.repositoryPath);

    const remote = params.remote || 'origin';
    const branch = params.branch || (await git.branchLocal()).current;

    const pushOptions: string[] = [];
    if (params.force) {
      pushOptions.push('--force');
    }

    await git.push(remote, branch, pushOptions);

    logger.info('Git push successful', { remote, branch });

    return {
      success: true,
      remote,
      branch,
      pushed: true,
    };
  } catch (error: any) {
    logger.error('Failed to push to git remote', { error: error.message });
    throw new ExecutionError(`Failed to push to git remote: ${error.message}`);
  }
}
