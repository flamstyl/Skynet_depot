/**
 * Service pour les opérations Git
 */

import { shell } from "./shell-executor.js";
import { GitStatus } from "../models/types.js";
import { GitError } from "../models/errors.js";
import { validatePath } from "../utils/validators.js";
import { logger } from "../utils/logger.js";

export class GitService {
  /**
   * Vérifie que Git est disponible
   */
  async checkGit(): Promise<void> {
    const exists = await shell.commandExists("git");
    if (!exists) {
      throw new GitError("Git is not installed or not in PATH");
    }
  }

  /**
   * Initialise un dépôt Git
   */
  async init(projectPath: string): Promise<void> {
    const validPath = validatePath(projectPath);
    await this.checkGit();

    await shell.run("git init", { cwd: validPath });
    logger.info(`Git repository initialized: ${validPath}`);
  }

  /**
   * Récupère le statut Git
   */
  async getStatus(projectPath: string): Promise<GitStatus> {
    const validPath = validatePath(projectPath);
    await this.checkGit();

    // Vérifier que c'est un repo git
    try {
      await shell.run("git rev-parse --git-dir", { cwd: validPath });
    } catch {
      throw new GitError(`Not a git repository: ${validPath}`);
    }

    // Branch actuelle
    const branch = await shell.run("git branch --show-current", {
      cwd: validPath,
    });

    // Commits ahead/behind
    let ahead = 0;
    let behind = 0;
    try {
      const upstream = await shell.run("git rev-parse --abbrev-ref @{u}", {
        cwd: validPath,
      });
      const counts = await shell.run(
        `git rev-list --left-right --count ${upstream}...HEAD`,
        { cwd: validPath }
      );
      const [behindStr, aheadStr] = counts.split("\t");
      behind = parseInt(behindStr, 10);
      ahead = parseInt(aheadStr, 10);
    } catch {
      // Pas d'upstream configuré
    }

    // Fichiers modifiés
    const modifiedOutput = await shell.run(
      "git diff --name-only",
      { cwd: validPath }
    );
    const modified = modifiedOutput ? modifiedOutput.split("\n") : [];

    // Fichiers staged
    const stagedOutput = await shell.run(
      "git diff --cached --name-only",
      { cwd: validPath }
    );
    const staged = stagedOutput ? stagedOutput.split("\n") : [];

    // Fichiers untracked
    const untrackedOutput = await shell.run(
      "git ls-files --others --exclude-standard",
      { cwd: validPath }
    );
    const untracked = untrackedOutput ? untrackedOutput.split("\n") : [];

    const clean = modified.length === 0 && staged.length === 0 && untracked.length === 0;

    return {
      branch,
      ahead,
      behind,
      modified,
      staged,
      untracked,
      clean,
    };
  }

  /**
   * Commit des changements
   */
  async commit(
    projectPath: string,
    message: string,
    addAll = true
  ): Promise<string> {
    const validPath = validatePath(projectPath);
    await this.checkGit();

    if (addAll) {
      await shell.run("git add -A", { cwd: validPath });
    }

    // Échapper le message pour éviter l'injection
    const escapedMessage = message.replace(/"/g, '\\"');
    await shell.run(`git commit -m "${escapedMessage}"`, { cwd: validPath });

    // Récupérer le hash du commit
    const commitHash = await shell.run("git rev-parse HEAD", {
      cwd: validPath,
    });

    logger.info(`Git commit created: ${commitHash.substring(0, 7)}`);

    return commitHash;
  }

  /**
   * Push vers le remote
   */
  async push(
    projectPath: string,
    remote = "origin",
    branch?: string,
    setUpstream = false
  ): Promise<void> {
    const validPath = validatePath(projectPath);
    await this.checkGit();

    let command = `git push ${remote}`;

    if (branch) {
      command += ` ${branch}`;
    }

    if (setUpstream) {
      command += " -u";
    }

    await shell.run(command, { cwd: validPath });
    logger.info(`Git push successful to ${remote}`);
  }

  /**
   * Pull depuis le remote
   */
  async pull(projectPath: string, remote = "origin", branch?: string): Promise<void> {
    const validPath = validatePath(projectPath);
    await this.checkGit();

    let command = `git pull ${remote}`;
    if (branch) {
      command += ` ${branch}`;
    }

    await shell.run(command, { cwd: validPath });
    logger.info(`Git pull successful from ${remote}`);
  }
}

export const gitService = new GitService();
