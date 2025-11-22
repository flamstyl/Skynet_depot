/**
 * Module dev_env : Gestion des environnements de développement
 * Tools pour créer, gérer et configurer des projets Python, Node.js, etc.
 */

import { z } from 'zod';
import { executeCommand, commandExists } from '../utils/executor.js';
import { createLogger } from '../utils/logger.js';
import type { ToolResult } from '../utils/types.js';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

const logger = createLogger('dev_env');

const DEFAULT_PROJECTS_DIR = path.join(os.homedir(), 'projects');

/**
 * Schémas Zod pour validation
 */
export const CreateProjectSchema = z.object({
  name: z.string().min(1).describe('Nom du projet'),
  type: z.enum(['python', 'node', 'generic']).describe('Type de projet'),
  baseDir: z.string().optional().describe('Répertoire de base (défaut: ~/projects)')
});

export const SetupPythonEnvSchema = z.object({
  projectPath: z.string().describe('Chemin du projet'),
  pythonVersion: z.string().optional().describe('Version Python (ex: 3.11)'),
  useVenv: z.boolean().default(true).describe('Utiliser venv (sinon virtualenv)')
});

export const InstallDepsSchema = z.object({
  projectPath: z.string().describe('Chemin du projet'),
  type: z.enum(['python', 'node']).describe('Type de projet'),
  file: z.string().optional().describe('Fichier de dépendances spécifique')
});

export const ListEnvsSchema = z.object({
  baseDir: z.string().optional().describe('Répertoire de base à scanner')
});

/**
 * Tool: create_project
 * Crée un nouveau projet avec sa structure de base
 */
export async function createProject(args: z.infer<typeof CreateProjectSchema>): Promise<ToolResult> {
  try {
    const { name, type, baseDir = DEFAULT_PROJECTS_DIR } = args;
    const projectPath = path.join(baseDir, name);

    logger.info(`Création du projet: ${name} (${type}) dans ${baseDir}`);

    // Vérifier si le projet existe déjà
    if (await fs.pathExists(projectPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Le projet "${name}" existe déjà dans ${projectPath}`
        }],
        isError: true
      };
    }

    // Créer le répertoire du projet
    await fs.ensureDir(projectPath);

    // Structure selon le type
    switch (type) {
      case 'python':
        await fs.ensureDir(path.join(projectPath, 'src'));
        await fs.ensureDir(path.join(projectPath, 'tests'));
        await fs.writeFile(
          path.join(projectPath, 'requirements.txt'),
          '# Dépendances Python\n'
        );
        await fs.writeFile(
          path.join(projectPath, 'README.md'),
          `# ${name}\n\nProjet Python créé avec Skynet MCP Workspace\n`
        );
        await fs.writeFile(
          path.join(projectPath, '.gitignore'),
          '__pycache__/\n*.py[cod]\n*$py.class\n.venv/\nvenv/\n.env\n'
        );
        break;

      case 'node':
        await fs.ensureDir(path.join(projectPath, 'src'));
        await fs.ensureDir(path.join(projectPath, 'tests'));
        await fs.writeFile(
          path.join(projectPath, 'package.json'),
          JSON.stringify({
            name,
            version: '1.0.0',
            description: `Projet Node.js créé avec Skynet MCP`,
            main: 'src/index.js',
            scripts: {
              test: 'echo "Error: no test specified" && exit 1'
            },
            keywords: [],
            author: '',
            license: 'MIT'
          }, null, 2)
        );
        await fs.writeFile(
          path.join(projectPath, 'README.md'),
          `# ${name}\n\nProjet Node.js créé avec Skynet MCP Workspace\n`
        );
        await fs.writeFile(
          path.join(projectPath, '.gitignore'),
          'node_modules/\ndist/\n.env\n*.log\n'
        );
        break;

      case 'generic':
        await fs.writeFile(
          path.join(projectPath, 'README.md'),
          `# ${name}\n\nProjet créé avec Skynet MCP Workspace\n`
        );
        break;
    }

    logger.success(`Projet ${name} créé avec succès`);

    return {
      content: [{
        type: 'text',
        text: `✅ Projet "${name}" créé avec succès!\n\n` +
              `📁 Chemin: ${projectPath}\n` +
              `📦 Type: ${type}\n\n` +
              `Structure créée:\n${await getProjectTree(projectPath)}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la création du projet', error);
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
 * Tool: setup_python_env
 * Configure un environnement virtuel Python
 */
export async function setupPythonEnv(args: z.infer<typeof SetupPythonEnvSchema>): Promise<ToolResult> {
  try {
    const { projectPath, pythonVersion, useVenv = true } = args;

    logger.info(`Configuration environnement Python: ${projectPath}`);

    // Vérifier que le projet existe
    if (!await fs.pathExists(projectPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Le projet n'existe pas: ${projectPath}`
        }],
        isError: true
      };
    }

    // Détecter Python
    const pythonCmd = pythonVersion ? `python${pythonVersion}` : 'python3';
    const hasPython = await commandExists(pythonCmd);

    if (!hasPython) {
      return {
        content: [{
          type: 'text',
          text: `❌ Python non trouvé: ${pythonCmd}`
        }],
        isError: true
      };
    }

    const venvPath = path.join(projectPath, '.venv');

    // Créer l'environnement virtuel
    const createCmd = useVenv
      ? await executeCommand(pythonCmd, ['-m', 'venv', venvPath], { workingDirectory: projectPath })
      : await executeCommand('virtualenv', [venvPath], { workingDirectory: projectPath });

    if (!createCmd.success) {
      return {
        content: [{
          type: 'text',
          text: `❌ Erreur lors de la création de l'environnement:\n${createCmd.error}`
        }],
        isError: true
      };
    }

    logger.success(`Environnement Python créé: ${venvPath}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Environnement Python créé avec succès!\n\n` +
              `📁 Chemin: ${venvPath}\n` +
              `🐍 Python: ${pythonCmd}\n` +
              `🔧 Type: ${useVenv ? 'venv' : 'virtualenv'}\n\n` +
              `Pour activer:\n` +
              `  source ${venvPath}/bin/activate`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la configuration Python', error);
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
 * Tool: install_dependencies
 * Installe les dépendances d'un projet
 */
export async function installDependencies(args: z.infer<typeof InstallDepsSchema>): Promise<ToolResult> {
  try {
    const { projectPath, type, file } = args;

    logger.info(`Installation des dépendances: ${projectPath} (${type})`);

    if (!await fs.pathExists(projectPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Le projet n'existe pas: ${projectPath}`
        }],
        isError: true
      };
    }

    let result;

    if (type === 'python') {
      const depsFile = file || 'requirements.txt';
      const depsPath = path.join(projectPath, depsFile);

      if (!await fs.pathExists(depsPath)) {
        return {
          content: [{
            type: 'text',
            text: `❌ Fichier de dépendances non trouvé: ${depsFile}`
          }],
          isError: true
        };
      }

      // Détecter pip
      const pipPath = path.join(projectPath, '.venv/bin/pip');
      const usePip = await fs.pathExists(pipPath) ? pipPath : 'pip3';

      result = await executeCommand(usePip, ['install', '-r', depsFile], {
        workingDirectory: projectPath,
        timeout: 120000  // 2 minutes
      });

    } else if (type === 'node') {
      const packageJson = path.join(projectPath, 'package.json');

      if (!await fs.pathExists(packageJson)) {
        return {
          content: [{
            type: 'text',
            text: `❌ package.json non trouvé`
          }],
          isError: true
        };
      }

      // Détecter npm/yarn/pnpm
      const hasYarn = await commandExists('yarn');
      const hasPnpm = await commandExists('pnpm');
      const packageManager = hasPnpm ? 'pnpm' : hasYarn ? 'yarn' : 'npm';

      result = await executeCommand(packageManager, ['install'], {
        workingDirectory: projectPath,
        timeout: 300000  // 5 minutes
      });
    } else {
      return {
        content: [{
          type: 'text',
          text: `❌ Type non supporté: ${type}`
        }],
        isError: true
      };
    }

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `❌ Erreur lors de l'installation:\n${result.error}`
        }],
        isError: true
      };
    }

    logger.success('Dépendances installées');

    return {
      content: [{
        type: 'text',
        text: `✅ Dépendances installées avec succès!\n\n${result.output}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de l\'installation des dépendances', error);
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
 * Tool: list_envs
 * Liste les environnements de développement disponibles
 */
export async function listEnvs(args: z.infer<typeof ListEnvsSchema>): Promise<ToolResult> {
  try {
    const { baseDir = DEFAULT_PROJECTS_DIR } = args;

    logger.info(`Scan des environnements dans: ${baseDir}`);

    if (!await fs.pathExists(baseDir)) {
      return {
        content: [{
          type: 'text',
          text: `📁 Aucun projet trouvé (${baseDir} n'existe pas)`
        }]
      };
    }

    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const projects = entries.filter(e => e.isDirectory());

    const envs: any[] = [];

    for (const project of projects) {
      const projectPath = path.join(baseDir, project.name);
      const env: any = {
        name: project.name,
        path: projectPath,
        type: 'unknown',
        hasVenv: false,
        hasNodeModules: false
      };

      // Détecter Python
      if (await fs.pathExists(path.join(projectPath, 'requirements.txt'))) {
        env.type = 'python';
        env.hasVenv = await fs.pathExists(path.join(projectPath, '.venv')) ||
                      await fs.pathExists(path.join(projectPath, 'venv'));
      }

      // Détecter Node.js
      if (await fs.pathExists(path.join(projectPath, 'package.json'))) {
        env.type = env.type === 'python' ? 'python+node' : 'node';
        env.hasNodeModules = await fs.pathExists(path.join(projectPath, 'node_modules'));
      }

      envs.push(env);
    }

    const output = envs.map(e =>
      `📦 ${e.name}\n` +
      `   Type: ${e.type}\n` +
      `   Path: ${e.path}\n` +
      `   ${e.hasVenv ? '✅ venv' : '❌ venv'} | ${e.hasNodeModules ? '✅ node_modules' : '❌ node_modules'}`
    ).join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `🔍 Environnements trouvés: ${envs.length}\n\n${output || 'Aucun projet'}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors du scan des environnements', error);
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
 * Utilitaire: obtenir l'arbre du projet
 */
async function getProjectTree(projectPath: string): Promise<string> {
  try {
    const entries = await fs.readdir(projectPath, { withFileTypes: true });
    return entries.map(e => `  ${e.isDirectory() ? '📁' : '📄'} ${e.name}`).join('\n');
  } catch {
    return '(impossible de lire la structure)';
  }
}

/**
 * Export des tools pour le serveur MCP
 */
export const devEnvTools = {
  create_project: {
    description: 'Crée un nouveau projet (Python, Node.js, ou générique) avec sa structure de base',
    inputSchema: CreateProjectSchema,
    handler: createProject
  },
  setup_python_env: {
    description: 'Configure un environnement virtuel Python (venv ou virtualenv)',
    inputSchema: SetupPythonEnvSchema,
    handler: setupPythonEnv
  },
  install_dependencies: {
    description: 'Installe les dépendances d\'un projet (requirements.txt ou package.json)',
    inputSchema: InstallDepsSchema,
    handler: installDependencies
  },
  list_envs: {
    description: 'Liste tous les environnements de développement disponibles',
    inputSchema: ListEnvsSchema,
    handler: listEnvs
  }
};
