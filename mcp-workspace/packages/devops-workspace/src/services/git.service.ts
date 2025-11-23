import simpleGit, { SimpleGit, StatusResult, LogResult } from 'simple-git';
import { logger } from '../utils/logger.js';
import { GitStatus, GitCommit } from '../models/types.js';

/**
 * Service Git (wrapper de simple-git)
 */
export class GitService {
  private getGit(cwd: string): SimpleGit {
    return simpleGit(cwd);
  }

  /**
   * Init un repo Git
   */
  async init(path: string, defaultBranch = 'main'): Promise<void> {
    const git = this.getGit(path);
    await git.init();
    await git.checkoutLocalBranch(defaultBranch);
    logger.info(`Git init : ${path}, branch: ${defaultBranch}`);
  }

  /**
   * Status Git
   */
  async status(path: string): Promise<GitStatus> {
    const git = this.getGit(path);
    const status: StatusResult = await git.status();

    return {
      branch: status.current || 'unknown',
      tracking: status.tracking || undefined,
      ahead: status.ahead,
      behind: status.behind,
      modified: status.modified,
      created: status.not_added,
      deleted: status.deleted,
      renamed: status.renamed.map((r) => `${r.from} -> ${r.to}`),
      staged: status.staged,
      conflicted: status.conflicted,
    };
  }

  /**
   * Add fichiers
   */
  async add(path: string, files: string[]): Promise<void> {
    const git = this.getGit(path);
    await git.add(files);
    logger.info(`Git add : ${files.length} fichier(s)`);
  }

  /**
   * Commit
   */
  async commit(
    path: string,
    message: string,
    author?: { name: string; email: string }
  ): Promise<{ hash: string; message: string }> {
    const git = this.getGit(path);

    if (author) {
      await git.addConfig('user.name', author.name);
      await git.addConfig('user.email', author.email);
    }

    const result = await git.commit(message);
    logger.info(`Git commit : ${result.commit}`);

    return {
      hash: result.commit,
      message,
    };
  }

  /**
   * Liste des branches
   */
  async listBranches(path: string): Promise<string[]> {
    const git = this.getGit(path);
    const result = await git.branchLocal();
    return result.all;
  }

  /**
   * Crée une branche
   */
  async createBranch(path: string, name: string): Promise<void> {
    const git = this.getGit(path);
    await git.checkoutLocalBranch(name);
    logger.info(`Branche créée : ${name}`);
  }

  /**
   * Supprime une branche
   */
  async deleteBranch(path: string, name: string): Promise<void> {
    const git = this.getGit(path);
    await git.deleteLocalBranch(name);
    logger.info(`Branche supprimée : ${name}`);
  }

  /**
   * Checkout une branche
   */
  async checkout(path: string, branch: string, create = false): Promise<void> {
    const git = this.getGit(path);

    if (create) {
      await git.checkoutLocalBranch(branch);
    } else {
      await git.checkout(branch);
    }

    logger.info(`Checkout : ${branch}`);
  }

  /**
   * Pull
   */
  async pull(path: string, remote = 'origin', branch?: string): Promise<void> {
    const git = this.getGit(path);
    await git.pull(remote, branch);
    logger.info(`Pull : ${remote}/${branch || 'current'}`);
  }

  /**
   * Push
   */
  async push(
    path: string,
    remote = 'origin',
    branch?: string,
    force = false
  ): Promise<void> {
    const git = this.getGit(path);
    const options: string[] = [];

    if (force) {
      logger.warn('Force push demandé !');
      options.push('--force');
    }

    await git.push(remote, branch, options);
    logger.info(`Push : ${remote}/${branch || 'current'}`);
  }

  /**
   * Log
   */
  async log(path: string, limit = 10): Promise<GitCommit[]> {
    const git = this.getGit(path);
    const log: LogResult = await git.log({ maxCount: limit });

    return log.all.map((commit) => ({
      hash: commit.hash,
      message: commit.message,
      author: `${commit.author_name} <${commit.author_email}>`,
      date: commit.date,
    }));
  }
}

export const gitService = new GitService();
