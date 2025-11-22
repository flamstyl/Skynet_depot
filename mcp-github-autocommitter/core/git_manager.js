/**
 * Gestionnaire Git basé sur simple-git
 */

import simpleGit from 'simple-git';
import { GitOperationError, RemoteError, CredentialsError } from '../utils/errors.js';
import { validateGitRepo } from '../utils/path_validator.js';
import { logger } from '../utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitManager {
  constructor(config = {}) {
    this.config = config;
    this.gitInstances = new Map(); // Cache des instances git par repo
  }

  /**
   * Récupère ou crée une instance simple-git pour un repo
   */
  async getGit(repoPath) {
    const validPath = await validateGitRepo(repoPath);

    if (!this.gitInstances.has(validPath)) {
      const git = simpleGit(validPath);
      this.gitInstances.set(validPath, git);
    }

    return this.gitInstances.get(validPath);
  }

  /**
   * Récupère le statut complet du repo
   */
  async getStatus(repoPath) {
    try {
      const git = await this.getGit(repoPath);
      const status = await git.status();
      const branch = await git.branch();
      const remotes = await git.getRemotes(true);

      return {
        success: true,
        repo: {
          path: repoPath,
          current_branch: status.current,
          tracking_branch: status.tracking || null,
          is_clean: status.isClean(),
          ahead: status.ahead,
          behind: status.behind,
          diverged: status.ahead > 0 && status.behind > 0,
        },
        changes: {
          staged: status.staged,
          unstaged: status.modified.concat(status.deleted),
          untracked: status.not_added,
          deleted: status.deleted,
          renamed: status.renamed.map(r => ({ from: r.from, to: r.to })),
          conflicted: status.conflicted,
        },
        branches: {
          local: branch.all.filter(b => !b.startsWith('remotes/')),
          remote: branch.all.filter(b => b.startsWith('remotes/')),
          current: branch.current,
        },
        remotes: remotes.map(r => ({
          name: r.name,
          fetch_url: r.refs.fetch,
          push_url: r.refs.push,
        })),
      };
    } catch (error) {
      logger.error('GitManager', `Failed to get status: ${error.message}`);
      throw new GitOperationError(error.message, 'getStatus');
    }
  }

  /**
   * Récupère un diff détaillé
   */
  async getDiff(repoPath, options = {}) {
    try {
      const git = await this.getGit(repoPath);

      const diffOptions = [];
      if (options.staged) diffOptions.push('--cached');
      if (options.stat) diffOptions.push('--stat');
      if (options.nameOnly) diffOptions.push('--name-only');
      if (options.numstat) diffOptions.push('--numstat');

      const diff = await git.diff(diffOptions);

      return {
        success: true,
        diff_text: diff,
      };
    } catch (error) {
      throw new GitOperationError(error.message, 'getDiff');
    }
  }

  /**
   * Récupère les stats de diff (insertions/deletions par fichier)
   */
  async getDiffStats(repoPath) {
    try {
      const git = await this.getGit(repoPath);
      const diff = await git.diff(['--numstat']);

      const stats = {
        files: [],
        total_insertions: 0,
        total_deletions: 0,
      };

      const lines = diff.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        const [insertions, deletions, file] = line.split('\t');
        const ins = parseInt(insertions) || 0;
        const del = parseInt(deletions) || 0;

        stats.files.push({
          path: file,
          insertions: ins,
          deletions: del,
        });

        stats.total_insertions += ins;
        stats.total_deletions += del;
      }

      return stats;
    } catch (error) {
      throw new GitOperationError(error.message, 'getDiffStats');
    }
  }

  /**
   * Stage des fichiers
   */
  async stageFiles(repoPath, files = []) {
    try {
      const git = await this.getGit(repoPath);

      if (files.length === 0) {
        // Stage all
        await git.add('.');
        logger.success('GitManager', 'Staged all changes');
      } else {
        await git.add(files);
        logger.success('GitManager', `Staged ${files.length} file(s)`);
      }

      return {
        success: true,
        staged_files: files.length === 0 ? ['all'] : files,
      };
    } catch (error) {
      throw new GitOperationError(error.message, 'stageFiles');
    }
  }

  /**
   * Crée un commit
   */
  async commit(repoPath, message, options = {}) {
    try {
      const git = await this.getGit(repoPath);

      const commitOptions = {};
      if (options.author) {
        commitOptions['--author'] = `"${options.author.name} <${options.author.email}>"`;
      }
      if (options.amend) {
        commitOptions['--amend'] = null;
      }
      if (options.allowEmpty) {
        commitOptions['--allow-empty'] = null;
      }

      const result = await git.commit(message, undefined, commitOptions);

      logger.success('GitManager', `Created commit: ${result.commit}`);

      return {
        success: true,
        commit: {
          hash: result.commit,
          message: message,
          branch: result.branch,
          author: result.author || null,
        },
      };
    } catch (error) {
      throw new GitOperationError(error.message, 'commit');
    }
  }

  /**
   * Push vers remote
   */
  async push(repoPath, options = {}) {
    try {
      const git = await this.getGit(repoPath);
      const remote = options.remote || this.config.defaultRemote || 'origin';
      const branch = options.branch || (await git.status()).current;

      const pushOptions = [];
      if (options.force) {
        pushOptions.push('--force');
      }
      if (options.setUpstream) {
        pushOptions.push('--set-upstream');
      }

      logger.info('GitManager', `Pushing to ${remote}/${branch}...`);

      // Check credentials avant push
      await this.checkCredentials(repoPath);

      const result = await git.push(remote, branch, pushOptions);

      logger.success('GitManager', `Successfully pushed to ${remote}/${branch}`);

      return {
        success: true,
        push: {
          remote,
          branch,
          pushed: true,
        },
      };
    } catch (error) {
      logger.error('GitManager', `Push failed: ${error.message}`);
      throw new RemoteError(error.message, options.remote || 'origin');
    }
  }

  /**
   * Pull depuis remote
   */
  async pull(repoPath, options = {}) {
    try {
      const git = await this.getGit(repoPath);
      const remote = options.remote || this.config.defaultRemote || 'origin';
      const branch = options.branch || (await git.status()).current;

      const pullOptions = {};
      if (options.rebase) {
        pullOptions['--rebase'] = null;
      }

      logger.info('GitManager', `Pulling from ${remote}/${branch}...`);

      const result = await git.pull(remote, branch, pullOptions);

      logger.success('GitManager', 'Pull completed');

      return {
        success: true,
        pull: {
          files_updated: result.files.length,
          insertions: result.insertions,
          deletions: result.deletions,
        },
      };
    } catch (error) {
      throw new RemoteError(error.message, options.remote || 'origin');
    }
  }

  /**
   * Reset commit(s)
   */
  async reset(repoPath, options = {}) {
    try {
      const git = await this.getGit(repoPath);
      const mode = options.mode || 'soft'; // soft, mixed, hard
      const steps = options.steps || 1;

      await git.reset([`--${mode}`, `HEAD~${steps}`]);

      logger.warning('GitManager', `Reset ${steps} commit(s) (mode: ${mode})`);

      return {
        success: true,
        reset: {
          mode,
          steps,
        },
      };
    } catch (error) {
      throw new GitOperationError(error.message, 'reset');
    }
  }

  /**
   * Vérifie les credentials disponibles
   */
  async checkCredentials(repoPath) {
    try {
      // Tester SSH
      try {
        await execAsync('ssh -T git@github.com', { timeout: 5000 });
        return { type: 'ssh', available: true };
      } catch (sshError) {
        // SSH peut échouer mais avec message de succès
        if (sshError.stderr && sshError.stderr.includes('successfully authenticated')) {
          return { type: 'ssh', available: true };
        }
      }

      // Tester gh CLI
      try {
        const { stdout } = await execAsync('gh auth status', { timeout: 3000 });
        if (stdout.includes('Logged in')) {
          return { type: 'gh-cli', available: true };
        }
      } catch {}

      // Vérifier token env
      if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {
        return { type: 'token', available: true };
      }

      logger.warning('GitManager', 'No credentials found (SSH, gh CLI, or GITHUB_TOKEN)');
      throw new CredentialsError('No credentials available for push. Configure SSH keys, GitHub CLI, or GITHUB_TOKEN.');

    } catch (error) {
      if (error instanceof CredentialsError) throw error;
      logger.warning('GitManager', 'Could not verify credentials');
      return { type: 'unknown', available: false };
    }
  }

  /**
   * Récupère la liste des derniers commits
   */
  async getLog(repoPath, limit = 10) {
    try {
      const git = await this.getGit(repoPath);
      const log = await git.log({ maxCount: limit });

      return {
        success: true,
        commits: log.all.map(c => ({
          hash: c.hash,
          message: c.message,
          author: c.author_name,
          email: c.author_email,
          date: c.date,
        })),
      };
    } catch (error) {
      throw new GitOperationError(error.message, 'getLog');
    }
  }
}
