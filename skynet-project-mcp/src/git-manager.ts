/**
 * 🔧 Git Manager
 * Wrapper pour simple-git avec gestion d'erreurs
 */

import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { existsSync } from 'fs';

export class GitManager {
  private git: SimpleGit;

  constructor(baseDir: string = process.cwd()) {
    const options: Partial<SimpleGitOptions> = {
      baseDir,
      binary: 'git',
      maxConcurrentProcesses: 6,
    };
    this.git = simpleGit(options);
  }

  /**
   * Initialise un nouveau dépôt
   */
  async init(path: string): Promise<string> {
    if (existsSync(`${path}/.git`)) {
      return 'Repository already initialized';
    }
    await this.git.cwd(path).init();
    return `Initialized Git repository in ${path}`;
  }

  /**
   * Status du repo
   */
  async status(): Promise<any> {
    return await this.git.status();
  }

  /**
   * Ajouter des fichiers
   */
  async add(files: string[] | string): Promise<string> {
    await this.git.add(files);
    return `Added: ${Array.isArray(files) ? files.join(', ') : files}`;
  }

  /**
   * Commit
   */
  async commit(message: string): Promise<string> {
    const result = await this.git.commit(message);
    return `Commit: ${result.commit} - ${message}`;
  }

  /**
   * Liste des branches
   */
  async listBranches(): Promise<any> {
    return await this.git.branch();
  }

  /**
   * Créer une branche
   */
  async createBranch(branchName: string, startPoint?: string): Promise<string> {
    await this.git.checkoutBranch(branchName, startPoint || 'HEAD');
    return `Created and switched to branch: ${branchName}`;
  }

  /**
   * Changer de branche
   */
  async checkout(branchName: string): Promise<string> {
    await this.git.checkout(branchName);
    return `Switched to branch: ${branchName}`;
  }

  /**
   * Merge
   */
  async merge(branchName: string): Promise<string> {
    const result = await this.git.merge([branchName]);
    return `Merged ${branchName}: ${JSON.stringify(result)}`;
  }

  /**
   * Pull
   */
  async pull(remote?: string, branch?: string): Promise<string> {
    const result = await this.git.pull(remote, branch);
    return `Pulled from ${remote || 'origin'}/${branch || 'current'}: ${result.summary.changes} changes`;
  }

  /**
   * Push
   */
  async push(remote?: string, branch?: string, setUpstream?: boolean): Promise<string> {
    const args: string[] = [];
    if (setUpstream) args.push('-u');
    if (remote) args.push(remote);
    if (branch) args.push(branch);

    await this.git.push(args);
    return `Pushed to ${remote || 'origin'}/${branch || 'current'}`;
  }

  /**
   * Remote add
   */
  async addRemote(name: string, url: string): Promise<string> {
    await this.git.addRemote(name, url);
    return `Added remote ${name}: ${url}`;
  }

  /**
   * Log
   */
  async log(options?: { maxCount?: number; from?: string; to?: string }): Promise<any> {
    return await this.git.log(options);
  }

  /**
   * Diff
   */
  async diff(options?: string[]): Promise<string> {
    return await this.git.diff(options);
  }

  /**
   * Stash
   */
  async stash(command?: 'push' | 'pop' | 'list'): Promise<string> {
    if (command === 'list') {
      const result = await this.git.stashList();
      return JSON.stringify(result, null, 2);
    } else if (command === 'pop') {
      await this.git.stash(['pop']);
      return 'Stash popped';
    } else {
      await this.git.stash();
      return 'Changes stashed';
    }
  }
}
