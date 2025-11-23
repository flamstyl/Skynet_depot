import { ToolDefinition } from '../../models/types.js';
import { gitService } from '../../services/git.service.js';
import { validatePath, requireConfirmation } from '../../utils/validator.js';
import fs from 'fs/promises';
import path from 'path';

export const projectOpsTools: ToolDefinition[] = [
  // list_directory
  {
    name: 'list_directory',
    description: 'Liste le contenu d\'un répertoire',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        recursive: { type: 'boolean', default: false },
        filter: { type: 'string' },
      },
      required: ['path'],
    },
    execute: async (args: any) => {
      const dirPath = validatePath(args.path, true);
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      const files = entries
        .filter((e) => e.isFile())
        .map((e) => e.name);

      const dirs = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name);

      return {
        success: true,
        data: { path: dirPath, files, dirs, total: entries.length },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // read_file_safe
  {
    name: 'read_file_safe',
    description: 'Lit un fichier texte',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        encoding: { type: 'string', default: 'utf-8' },
      },
      required: ['path'],
    },
    execute: async (args: any) => {
      const filePath = validatePath(args.path, true);
      const content = await fs.readFile(filePath, args.encoding || 'utf-8');
      const stats = await fs.stat(filePath);

      return {
        success: true,
        data: {
          path: filePath,
          content,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // write_file_safe
  {
    name: 'write_file_safe',
    description: 'Écrit dans un fichier (avec backup optionnel)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
        backup: { type: 'boolean', default: true },
      },
      required: ['path', 'content'],
    },
    execute: async (args: any) => {
      const filePath = validatePath(args.path, true);
      let backupPath: string | undefined;

      // Backup if file exists
      if (args.backup !== false) {
        try {
          await fs.access(filePath);
          backupPath = `${filePath}.backup.${Date.now()}`;
          await fs.copyFile(filePath, backupPath);
        } catch {}
      }

      await fs.writeFile(filePath, args.content, 'utf-8');

      return {
        success: true,
        data: { path: filePath, written: true, backupPath },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // Git tools
  {
    name: 'git_init',
    description: 'Initialise un dépôt Git',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        defaultBranch: { type: 'string', default: 'main' },
      },
      required: ['path'],
    },
    execute: async (args: any) => {
      const repoPath = validatePath(args.path, true);
      await gitService.init(repoPath, args.defaultBranch || 'main');

      return {
        success: true,
        data: { path: repoPath, branch: args.defaultBranch || 'main' },
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'git_status',
    description: 'Status Git du dépôt',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
    execute: async (args: any) => {
      const repoPath = validatePath(args.path, true);
      const status = await gitService.status(repoPath);

      return {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'git_add',
    description: 'Stage des fichiers',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        files: { type: 'array', items: { type: 'string' } },
      },
      required: ['path', 'files'],
    },
    execute: async (args: any) => {
      const repoPath = validatePath(args.path, true);
      await gitService.add(repoPath, args.files);

      return {
        success: true,
        data: { staged: args.files },
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'git_commit',
    description: 'Commit les changements',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        message: { type: 'string' },
        author: { type: 'object' },
      },
      required: ['path', 'message'],
    },
    execute: async (args: any) => {
      const repoPath = validatePath(args.path, true);
      const result = await gitService.commit(repoPath, args.message, args.author);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'git_push',
    description: 'Push vers remote',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        remote: { type: 'string', default: 'origin' },
        branch: { type: 'string' },
        force: { type: 'boolean', default: false },
      },
      required: ['path'],
    },
    execute: async (args: any) => {
      const repoPath = validatePath(args.path, true);
      await gitService.push(repoPath, args.remote, args.branch, args.force);

      return {
        success: true,
        data: { pushed: true },
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'git_pull',
    description: 'Pull depuis remote',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        remote: { type: 'string', default: 'origin' },
        branch: { type: 'string' },
      },
      required: ['path'],
    },
    execute: async (args: any) => {
      const repoPath = validatePath(args.path, true);
      await gitService.pull(repoPath, args.remote, args.branch);

      return {
        success: true,
        data: { pulled: true },
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'git_log',
    description: 'Historique Git',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
      required: ['path'],
    },
    execute: async (args: any) => {
      const repoPath = validatePath(args.path, true);
      const commits = await gitService.log(repoPath, args.limit || 10);

      return {
        success: true,
        data: { commits },
        timestamp: new Date().toISOString(),
      };
    },
  },
];
