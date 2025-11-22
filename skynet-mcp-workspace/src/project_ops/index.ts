/**
 * Module project_ops : Gestion de projets et Git
 * Tools pour manipuler fichiers, dossiers, et gérer Git
 */

import { z } from 'zod';
import fs from 'fs-extra';
import path from 'path';
import { simpleGit, SimpleGit } from 'simple-git';
import { createLogger } from '../utils/logger.js';
import type { ToolResult, FileInfo } from '../utils/types.js';

const logger = createLogger('project_ops');

/**
 * Schémas Zod pour validation
 */
export const ListFilesSchema = z.object({
  directory: z.string().describe('Chemin du répertoire'),
  recursive: z.boolean().default(false).describe('Recherche récursive')
});

export const ReadFileSchema = z.object({
  filePath: z.string().describe('Chemin du fichier à lire')
});

export const WriteFileSchema = z.object({
  filePath: z.string().describe('Chemin du fichier à écrire'),
  content: z.string().describe('Contenu du fichier'),
  backup: z.boolean().default(true).describe('Créer un backup si le fichier existe')
});

export const DeletePathSchema = z.object({
  targetPath: z.string().describe('Chemin à supprimer (fichier ou dossier)')
});

export const GitInitSchema = z.object({
  projectPath: z.string().describe('Chemin du projet'),
  initialBranch: z.string().default('main').describe('Nom de la branche initiale')
});

export const GitStatusSchema = z.object({
  projectPath: z.string().describe('Chemin du projet Git')
});

export const GitAddSchema = z.object({
  projectPath: z.string().describe('Chemin du projet Git'),
  files: z.array(z.string()).describe('Fichiers à ajouter (ou ["."] pour tout)')
});

export const GitCommitSchema = z.object({
  projectPath: z.string().describe('Chemin du projet Git'),
  message: z.string().describe('Message de commit')
});

export const GitPushSchema = z.object({
  projectPath: z.string().describe('Chemin du projet Git'),
  remote: z.string().default('origin').describe('Nom du remote'),
  branch: z.string().optional().describe('Branche à push (défaut: branche courante)')
});

export const GitPullSchema = z.object({
  projectPath: z.string().describe('Chemin du projet Git'),
  remote: z.string().default('origin').describe('Nom du remote'),
  branch: z.string().optional().describe('Branche à pull (défaut: branche courante)')
});

export const GitBranchSchema = z.object({
  projectPath: z.string().describe('Chemin du projet Git'),
  action: z.enum(['list', 'create', 'delete', 'checkout']).describe('Action sur les branches'),
  branchName: z.string().optional().describe('Nom de la branche (pour create/delete/checkout)')
});

/**
 * Tool: list_files
 * Liste les fichiers d'un répertoire
 */
export async function listFiles(args: z.infer<typeof ListFilesSchema>): Promise<ToolResult> {
  try {
    const { directory, recursive } = args;

    logger.info(`Liste fichiers: ${directory} (recursive: ${recursive})`);

    if (!await fs.pathExists(directory)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Le répertoire n'existe pas: ${directory}`
        }],
        isError: true
      };
    }

    const files: FileInfo[] = [];

    async function scan(dir: string, level = 0) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const stats = await fs.stat(fullPath);

        files.push({
          path: fullPath,
          name: entry.name,
          size: stats.size,
          isDirectory: entry.isDirectory(),
          modified: stats.mtime
        });

        if (recursive && entry.isDirectory() && level < 3) {
          await scan(fullPath, level + 1);
        }
      }
    }

    await scan(directory);

    let output = `📁 Contenu de ${directory} (${files.length} éléments):\n\n`;

    for (const file of files) {
      const icon = file.isDirectory ? '📁' : '📄';
      const size = file.isDirectory ? '' : ` (${formatBytes(file.size)})`;
      output += `${icon} ${file.name}${size}\n`;
    }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la liste des fichiers', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: read_file
 * Lit le contenu d'un fichier texte
 */
export async function readFile(args: z.infer<typeof ReadFileSchema>): Promise<ToolResult> {
  try {
    const { filePath } = args;

    logger.info(`Lecture fichier: ${filePath}`);

    if (!await fs.pathExists(filePath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Le fichier n'existe pas: ${filePath}`
        }],
        isError: true
      };
    }

    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      return {
        content: [{
          type: 'text',
          text: `❌ ${filePath} est un répertoire, pas un fichier`
        }],
        isError: true
      };
    }

    // Limite de taille (1 MB)
    if (stats.size > 1024 * 1024) {
      return {
        content: [{
          type: 'text',
          text: `❌ Le fichier est trop volumineux (${formatBytes(stats.size)}). Limite: 1 MB`
        }],
        isError: true
      };
    }

    const content = await fs.readFile(filePath, 'utf-8');

    return {
      content: [{
        type: 'text',
        text: `📄 Contenu de ${path.basename(filePath)}:\n\n${content}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la lecture du fichier', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: write_file
 * Écrit du contenu dans un fichier
 */
export async function writeFile(args: z.infer<typeof WriteFileSchema>): Promise<ToolResult> {
  try {
    const { filePath, content, backup } = args;

    logger.info(`Écriture fichier: ${filePath} (backup: ${backup})`);

    // Backup si le fichier existe
    if (backup && await fs.pathExists(filePath)) {
      const backupPath = `${filePath}.backup-${Date.now()}`;
      await fs.copy(filePath, backupPath);
      logger.info(`Backup créé: ${backupPath}`);
    }

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');

    logger.success(`Fichier écrit: ${filePath}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Fichier écrit avec succès: ${filePath}\n` +
              `Taille: ${formatBytes(content.length)}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de l\'écriture du fichier', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: delete_path
 * Supprime un fichier ou dossier
 */
export async function deletePath(args: z.infer<typeof DeletePathSchema>): Promise<ToolResult> {
  try {
    const { targetPath } = args;

    logger.info(`Suppression: ${targetPath}`);

    if (!await fs.pathExists(targetPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Le chemin n'existe pas: ${targetPath}`
        }],
        isError: true
      };
    }

    // Sécurité: interdire suppression racine ou home
    const absolutePath = path.resolve(targetPath);
    if (absolutePath === '/' || absolutePath === path.resolve(process.env.HOME || '~')) {
      return {
        content: [{
          type: 'text',
          text: `❌ Suppression refusée pour des raisons de sécurité: ${targetPath}`
        }],
        isError: true
      };
    }

    await fs.remove(targetPath);

    logger.success(`Supprimé: ${targetPath}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Supprimé avec succès: ${targetPath}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la suppression', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: git_init
 * Initialise un dépôt Git
 */
export async function gitInit(args: z.infer<typeof GitInitSchema>): Promise<ToolResult> {
  try {
    const { projectPath, initialBranch } = args;

    logger.info(`Git init: ${projectPath} (branch: ${initialBranch})`);

    const git: SimpleGit = simpleGit(projectPath);

    await git.init();
    await git.raw(['branch', '-M', initialBranch]);

    logger.success(`Git initialisé: ${projectPath}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Dépôt Git initialisé!\n\n` +
              `📁 Chemin: ${projectPath}\n` +
              `🌿 Branche: ${initialBranch}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur Git init', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: git_status
 * Récupère le statut Git
 */
export async function gitStatus(args: z.infer<typeof GitStatusSchema>): Promise<ToolResult> {
  try {
    const { projectPath } = args;

    logger.info(`Git status: ${projectPath}`);

    const git: SimpleGit = simpleGit(projectPath);
    const status = await git.status();

    let output = `📊 Git Status - ${projectPath}\n\n`;
    output += `🌿 Branche: ${status.current}\n`;
    output += `📈 Ahead: ${status.ahead} | Behind: ${status.behind}\n\n`;

    if (status.files.length === 0) {
      output += `✅ Working tree clean`;
    } else {
      output += `📝 Fichiers modifiés (${status.files.length}):\n`;
      for (const file of status.files) {
        const icon = file.index === 'A' ? '➕' : file.index === 'M' ? '📝' : file.index === 'D' ? '➖' : '❓';
        output += `${icon} ${file.path} (${file.working_dir}${file.index})\n`;
      }
    }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error: any) {
    logger.error('Erreur Git status', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: git_add
 * Ajoute des fichiers au staging
 */
export async function gitAdd(args: z.infer<typeof GitAddSchema>): Promise<ToolResult> {
  try {
    const { projectPath, files } = args;

    logger.info(`Git add: ${projectPath} (${files.length} fichiers)`);

    const git: SimpleGit = simpleGit(projectPath);
    await git.add(files);

    logger.success('Fichiers ajoutés au staging');

    return {
      content: [{
        type: 'text',
        text: `✅ Fichiers ajoutés au staging:\n${files.join('\n')}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur Git add', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: git_commit
 * Crée un commit
 */
export async function gitCommit(args: z.infer<typeof GitCommitSchema>): Promise<ToolResult> {
  try {
    const { projectPath, message } = args;

    logger.info(`Git commit: ${projectPath}`);

    const git: SimpleGit = simpleGit(projectPath);
    const result = await git.commit(message);

    logger.success(`Commit créé: ${result.commit}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Commit créé!\n\n` +
              `SHA: ${result.commit}\n` +
              `Message: ${message}\n` +
              `Branche: ${result.branch}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur Git commit', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: git_push
 * Pousse les commits vers le remote
 */
export async function gitPush(args: z.infer<typeof GitPushSchema>): Promise<ToolResult> {
  try {
    const { projectPath, remote, branch } = args;

    logger.info(`Git push: ${projectPath} (${remote}/${branch || 'current'})`);

    const git: SimpleGit = simpleGit(projectPath);

    if (branch) {
      await git.push(remote, branch);
    } else {
      await git.push();
    }

    logger.success('Push réussi');

    return {
      content: [{
        type: 'text',
        text: `✅ Push réussi vers ${remote}${branch ? `/${branch}` : ''}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur Git push', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}\n\n` +
              `Vérifiez que le remote est configuré et que vous avez les droits d'accès.`
      }],
      isError: true
    };
  }
}

/**
 * Tool: git_pull
 * Récupère les commits depuis le remote
 */
export async function gitPull(args: z.infer<typeof GitPullSchema>): Promise<ToolResult> {
  try {
    const { projectPath, remote, branch } = args;

    logger.info(`Git pull: ${projectPath} (${remote}/${branch || 'current'})`);

    const git: SimpleGit = simpleGit(projectPath);

    if (branch) {
      await git.pull(remote, branch);
    } else {
      await git.pull();
    }

    logger.success('Pull réussi');

    return {
      content: [{
        type: 'text',
        text: `✅ Pull réussi depuis ${remote}${branch ? `/${branch}` : ''}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur Git pull', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: git_branch
 * Gestion des branches Git
 */
export async function gitBranch(args: z.infer<typeof GitBranchSchema>): Promise<ToolResult> {
  try {
    const { projectPath, action, branchName } = args;

    logger.info(`Git branch: ${action} ${branchName || ''}`);

    const git: SimpleGit = simpleGit(projectPath);

    let output = '';

    switch (action) {
      case 'list': {
        const branches = await git.branchLocal();
        output = `🌿 Branches locales:\n\n`;
        output += branches.all.map(b => b === branches.current ? `* ${b} (current)` : `  ${b}`).join('\n');
        break;
      }

      case 'create': {
        if (!branchName) {
          return {
            content: [{ type: 'text', text: '❌ branchName requis pour create' }],
            isError: true
          };
        }
        await git.checkoutLocalBranch(branchName);
        output = `✅ Branche "${branchName}" créée et checkoutée`;
        break;
      }

      case 'delete': {
        if (!branchName) {
          return {
            content: [{ type: 'text', text: '❌ branchName requis pour delete' }],
            isError: true
          };
        }
        await git.deleteLocalBranch(branchName);
        output = `✅ Branche "${branchName}" supprimée`;
        break;
      }

      case 'checkout': {
        if (!branchName) {
          return {
            content: [{ type: 'text', text: '❌ branchName requis pour checkout' }],
            isError: true
          };
        }
        await git.checkout(branchName);
        output = `✅ Basculé vers la branche "${branchName}"`;
        break;
      }
    }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error: any) {
    logger.error('Erreur Git branch', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Utilitaire: formater les bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Export des tools pour le serveur MCP
 */
export const projectOpsTools = {
  list_files: {
    description: 'Liste les fichiers et dossiers d\'un répertoire',
    inputSchema: ListFilesSchema,
    handler: listFiles
  },
  read_file: {
    description: 'Lit le contenu d\'un fichier texte',
    inputSchema: ReadFileSchema,
    handler: readFile
  },
  write_file: {
    description: 'Écrit du contenu dans un fichier (avec backup optionnel)',
    inputSchema: WriteFileSchema,
    handler: writeFile
  },
  delete_path: {
    description: 'Supprime un fichier ou un dossier',
    inputSchema: DeletePathSchema,
    handler: deletePath
  },
  git_init: {
    description: 'Initialise un nouveau dépôt Git',
    inputSchema: GitInitSchema,
    handler: gitInit
  },
  git_status: {
    description: 'Affiche le statut Git du projet',
    inputSchema: GitStatusSchema,
    handler: gitStatus
  },
  git_add: {
    description: 'Ajoute des fichiers au staging Git',
    inputSchema: GitAddSchema,
    handler: gitAdd
  },
  git_commit: {
    description: 'Crée un commit Git',
    inputSchema: GitCommitSchema,
    handler: gitCommit
  },
  git_push: {
    description: 'Pousse les commits vers le remote Git',
    inputSchema: GitPushSchema,
    handler: gitPush
  },
  git_pull: {
    description: 'Récupère les commits depuis le remote Git',
    inputSchema: GitPullSchema,
    handler: gitPull
  },
  git_branch: {
    description: 'Gestion des branches Git (list, create, delete, checkout)',
    inputSchema: GitBranchSchema,
    handler: gitBranch
  }
};
