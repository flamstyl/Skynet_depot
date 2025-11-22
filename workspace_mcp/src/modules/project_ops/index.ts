/**
 * Module project_ops - Gestion fichiers et Git
 */

import { createTool, ToolRegistry } from '../../core/registry.js';
import { MCPErrorHandler } from '../../core/error_handler.js';
import { Validator } from '../../core/validator.js';
import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

export async function listDirectory(input: any) {
  const validated = Validator.validate(input,  Validator.schemas.listDirectory);
  const files = await fs.readdir(validated.path, { withFileTypes: true });

  const result = await Promise.all(
    files
      .filter(f => validated.include_hidden || !f.name.startsWith('.'))
      .map(async (f) => {
        const fullPath = path.join(validated.path, f.name);
        const stats = await fs.stat(fullPath);
        return {
          name: f.name,
          type: f.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          path: fullPath
        };
      })
  );

  return { files: result, total: result.length, path: validated.path };
}

export async function readFile(input: any) {
  const validated = Validator.validate(input,  Validator.schemas.readFile);
  const stats = await fs.stat(validated.path);

  if (validated.max_size && stats.size > validated.max_size) {
    throw new Error(`Fichier trop volumineux: ${stats.size} > ${validated.max_size}`);
  }

  const content = await fs.readFile(validated.path, validated.encoding);
  return {
    path: validated.path,
    content: content.toString(),
    size: stats.size,
    encoding: validated.encoding
  };
}

export async function writeFile(input: any) {
  const validated = Validator.validate(input,  Validator.schemas.writeFile);

  if (validated.create_backup) {
    try {
      await fs.access(validated.path);
      const backupPath = `${validated.path}.backup.${Date.now()}`;
      await fs.copyFile(validated.path, backupPath);
    } catch {
      // Fichier n'existe pas encore
    }
  }

  if (validated.create_dirs) {
    await fs.mkdir(path.dirname(validated.path), { recursive: true });
  }

  await fs.writeFile(validated.path, validated.content, validated.encoding);
  const stats = await fs.stat(validated.path);

  return {
    path: validated.path,
    size: stats.size,
    message: 'Fichier écrit avec succès'
  };
}

export async function gitStatus(input: any) {
  const validated = Validator.validate(input,  Validator.schemas.gitAction);
  const git = simpleGit(validated.repo_path);
  const status = await git.status();

  return {
    branch: status.current,
    ahead: status.ahead,
    behind: status.behind,
    staged: status.staged,
    unstaged: status.modified,
    untracked: status.not_added,
    conflicts: status.conflicted
  };
}

export async function gitCommit(input: any) {
  const validated = Validator.validate(input,  Validator.schemas.gitAction);
  const git = simpleGit(validated.repo_path);

  if (validated.files && validated.files.length > 0) {
    await git.add(validated.files);
  } else {
    await git.add('.');
  }

  const result = await git.commit(validated.message || 'Commit via Workspace MCP');

  return {
    commit: result.commit,
    summary: result.summary,
    branch: result.branch,
    message: 'Commit créé avec succès'
  };
}

export async function gitPush(input: any) {
  const validated = Validator.validate(input,  Validator.schemas.gitAction);
  const git = simpleGit(validated.repo_path);

  await git.push(validated.remote, validated.branch);

  return {
    remote: validated.remote,
    branch: validated.branch,
    message: 'Push effectué avec succès'
  };
}

export function registerProjectOpsTools(): void {
  ToolRegistry.register(createTool('project_list_directory', 'Liste le contenu d\'un dossier', {
    path: { type: 'string', description: 'Chemin du dossier' },
    recursive: { type: 'boolean', default: false },
    include_hidden: { type: 'boolean', default: false },
    filter: { type: 'string', description: 'Pattern glob (optionnel)' }
  }, ['path']));

  ToolRegistry.register(createTool('project_read_file', 'Lit un fichier texte', {
    path: { type: 'string' },
    encoding: { type: 'string', default: 'utf-8' },
    max_size: { type: 'number', description: 'Taille max en bytes' }
  }, ['path']));

  ToolRegistry.register(createTool('project_write_file', 'Écrit dans un fichier', {
    path: { type: 'string' },
    content: { type: 'string' },
    encoding: { type: 'string', default: 'utf-8' },
    create_backup: { type: 'boolean', default: true },
    create_dirs: { type: 'boolean', default: false }
  }, ['path', 'content']));

  ToolRegistry.register(createTool('project_git_status', 'État du dépôt Git', {
    repo_path: { type: 'string' }
  }, ['repo_path']));

  ToolRegistry.register(createTool('project_git_commit', 'Crée un commit Git', {
    repo_path: { type: 'string' },
    message: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } }
  }, ['repo_path', 'message']));

  ToolRegistry.register(createTool('project_git_push', 'Push vers remote', {
    repo_path: { type: 'string' },
    remote: { type: 'string', default: 'origin' },
    branch: { type: 'string' }
  }, ['repo_path']));
}

export const projectOpsHandlers = {
  project_list_directory: async (input: any) => MCPErrorHandler.executeTool('project_list_directory', () => listDirectory(input)),
  project_read_file: async (input: any) => MCPErrorHandler.executeTool('project_read_file', () => readFile(input)),
  project_write_file: async (input: any) => MCPErrorHandler.executeTool('project_write_file', () => writeFile(input)),
  project_git_status: async (input: any) => MCPErrorHandler.executeTool('project_git_status', () => gitStatus(input)),
  project_git_commit: async (input: any) => MCPErrorHandler.executeTool('project_git_commit', () => gitCommit(input)),
  project_git_push: async (input: any) => MCPErrorHandler.executeTool('project_git_push', () => gitPush(input))
};
