import * as fs from 'fs/promises';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import {
  ListDirectoryInput,
  ReadFileInput,
  WriteFileInput,
  DeleteFileInput,
  GitActionInput,
} from '../types/schemas.js';
import { validatePath, fileExists, createBackup, validateFileSize } from '../utils/security.js';
import { MCPError, NotFoundError, PermissionError } from '../utils/errors.js';

/**
 * Liste le contenu d'un répertoire
 */
export async function listDirectory(input: ListDirectoryInput) {
  const dirPath = await validatePath(input.path);

  if (!(await fileExists(dirPath))) {
    throw new NotFoundError(`Le répertoire ${dirPath} n'existe pas`);
  }

  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      throw new MCPError(`${dirPath} n'est pas un répertoire`);
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    const items = await Promise.all(
      entries
        .filter(entry => input.showHidden || !entry.name.startsWith('.'))
        .map(async entry => {
          const fullPath = path.join(dirPath, entry.name);
          const stat = await fs.stat(fullPath);

          return {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stat.size,
            sizeFormatted: formatBytes(stat.size),
            modified: stat.mtime.toISOString(),
            permissions: (stat.mode & 0o777).toString(8),
          };
        })
    );

    // Si récursif, traiter les sous-dossiers
    if (input.recursive) {
      const subdirs = items.filter(i => i.type === 'directory');
      for (const subdir of subdirs) {
        const subPath = path.join(dirPath, subdir.name);
        const subItems = await listDirectory({
          path: subPath,
          recursive: true,
          showHidden: input.showHidden,
        });
        items.push(...(subItems.items || []).map(item => ({
          ...item,
          name: path.join(subdir.name, item.name),
        })));
      }
    }

    return {
      path: dirPath,
      items,
      count: items.length,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la lecture du répertoire : ${error}`);
  }
}

/**
 * Lit un fichier texte
 */
export async function readFile(input: ReadFileInput) {
  const filePath = await validatePath(input.path);

  if (!(await fileExists(filePath))) {
    throw new NotFoundError(`Le fichier ${filePath} n'existe pas`);
  }

  // Vérifier la taille (max 10MB par défaut)
  await validateFileSize(filePath, 10);

  try {
    const content = await fs.readFile(filePath, { encoding: input.encoding as BufferEncoding });

    const stat = await fs.stat(filePath);

    return {
      path: filePath,
      content,
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      modified: stat.mtime.toISOString(),
      lines: content.split('\n').length,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la lecture du fichier : ${error}`);
  }
}

/**
 * Écrit dans un fichier
 */
export async function writeFile(input: WriteFileInput) {
  const filePath = await validatePath(input.path);

  try {
    // Créer backup si fichier existe et demandé
    if (input.createBackup && (await fileExists(filePath))) {
      const backupPath = await createBackup(filePath);
      console.log(`Backup créé : ${backupPath}`);
    }

    // Écrire le fichier
    await fs.writeFile(filePath, input.content, {
      encoding: 'utf-8',
      mode: input.mode ? parseInt(input.mode, 8) : undefined,
    });

    const stat = await fs.stat(filePath);

    return {
      success: true,
      path: filePath,
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      message: `Fichier écrit avec succès : ${filePath}`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de l'écriture du fichier : ${error}`);
  }
}

/**
 * Supprime un fichier
 */
export async function deleteFile(input: DeleteFileInput) {
  if (!input.confirm) {
    throw new MCPError(
      `Action dangereuse : la suppression du fichier ${input.path} nécessite une confirmation explicite (confirm: true)`
    );
  }

  const filePath = await validatePath(input.path);

  if (!(await fileExists(filePath))) {
    throw new NotFoundError(`Le fichier ${filePath} n'existe pas`);
  }

  try {
    await fs.unlink(filePath);

    return {
      success: true,
      path: filePath,
      message: `Fichier supprimé : ${filePath}`,
    };
  } catch (error) {
    throw new PermissionError(`Impossible de supprimer le fichier : ${error}`);
  }
}

// ============================================================================
// GIT OPERATIONS
// ============================================================================

/**
 * Initialise un dépôt Git
 */
export async function gitInit(input: GitActionInput) {
  const repoPath = await validatePath(input.repoPath);

  if (!(await fileExists(repoPath))) {
    throw new NotFoundError(`Le répertoire ${repoPath} n'existe pas`);
  }

  const git: SimpleGit = simpleGit(repoPath);

  try {
    await git.init();

    return {
      success: true,
      repoPath,
      message: `Dépôt Git initialisé à ${repoPath}`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de l'initialisation Git : ${error}`);
  }
}

/**
 * Git status
 */
export async function gitStatus(input: GitActionInput) {
  const repoPath = await validatePath(input.repoPath);
  const git: SimpleGit = simpleGit(repoPath);

  try {
    const status = await git.status();

    return {
      branch: status.current,
      ahead: status.ahead,
      behind: status.behind,
      staged: status.staged,
      modified: status.modified,
      notAdded: status.not_added,
      deleted: status.deleted,
      renamed: status.renamed,
      conflicted: status.conflicted,
      isClean: status.isClean(),
    };
  } catch (error) {
    throw new MCPError(`Erreur lors du git status : ${error}`);
  }
}

/**
 * Git add
 */
export async function gitAdd(input: GitActionInput) {
  const repoPath = await validatePath(input.repoPath);
  const git: SimpleGit = simpleGit(repoPath);

  try {
    const files = input.files && input.files.length > 0 ? input.files : ['.'];
    await git.add(files);

    return {
      success: true,
      files,
      message: `Fichiers ajoutés : ${files.join(', ')}`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors du git add : ${error}`);
  }
}

/**
 * Git commit
 */
export async function gitCommit(input: GitActionInput) {
  if (!input.message) {
    throw new MCPError('Un message de commit est requis');
  }

  const repoPath = await validatePath(input.repoPath);
  const git: SimpleGit = simpleGit(repoPath);

  try {
    const result = await git.commit(input.message);

    return {
      success: true,
      commit: result.commit,
      branch: result.branch,
      summary: result.summary,
      message: `Commit créé : ${result.commit}`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors du git commit : ${error}`);
  }
}

/**
 * Git branch
 */
export async function gitBranch(input: GitActionInput) {
  const repoPath = await validatePath(input.repoPath);
  const git: SimpleGit = simpleGit(repoPath);

  try {
    if (input.branch) {
      // Créer une nouvelle branche
      await git.checkoutLocalBranch(input.branch);
      return {
        success: true,
        branch: input.branch,
        message: `Branche ${input.branch} créée et checkout`,
      };
    } else {
      // Lister les branches
      const branches = await git.branch();
      return {
        current: branches.current,
        all: branches.all,
        branches: branches.branches,
      };
    }
  } catch (error) {
    throw new MCPError(`Erreur lors du git branch : ${error}`);
  }
}

/**
 * Git checkout
 */
export async function gitCheckout(input: GitActionInput) {
  if (!input.branch) {
    throw new MCPError('Une branche est requise pour checkout');
  }

  const repoPath = await validatePath(input.repoPath);
  const git: SimpleGit = simpleGit(repoPath);

  try {
    await git.checkout(input.branch);

    return {
      success: true,
      branch: input.branch,
      message: `Checkout effectué sur ${input.branch}`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors du git checkout : ${error}`);
  }
}

/**
 * Git pull
 */
export async function gitPull(input: GitActionInput) {
  const repoPath = await validatePath(input.repoPath);
  const git: SimpleGit = simpleGit(repoPath);

  try {
    const remote = input.remote || 'origin';
    const branch = input.branch || 'main';

    const result = await git.pull(remote, branch);

    return {
      success: true,
      summary: result.summary,
      files: result.files,
      insertions: result.insertions,
      deletions: result.deletions,
      message: `Pull effectué depuis ${remote}/${branch}`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors du git pull : ${error}`);
  }
}

/**
 * Git push
 */
export async function gitPush(input: GitActionInput) {
  const repoPath = await validatePath(input.repoPath);
  const git: SimpleGit = simpleGit(repoPath);

  try {
    const remote = input.remote || 'origin';
    const branch = input.branch || 'main';

    await git.push(remote, branch);

    return {
      success: true,
      remote,
      branch,
      message: `Push effectué vers ${remote}/${branch}`,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors du git push : ${error}`);
  }
}

/**
 * Git log
 */
export async function gitLog(input: GitActionInput) {
  const repoPath = await validatePath(input.repoPath);
  const git: SimpleGit = simpleGit(repoPath);

  try {
    const log = await git.log({ maxCount: 20 });

    const commits = log.all.map(commit => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author: commit.author_name,
      email: commit.author_email,
    }));

    return {
      commits,
      total: log.total,
      latest: log.latest,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors du git log : ${error}`);
  }
}

// ============================================================================
// UTILS
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
