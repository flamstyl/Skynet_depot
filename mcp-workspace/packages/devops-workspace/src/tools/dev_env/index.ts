import { ToolDefinition } from '../../models/types.js';
import { shellService } from '../../services/shell.service.js';
import { validatePath } from '../../utils/validator.js';
import { CreateProjectSchema, SetupPythonEnvSchema, SetupNodeEnvSchema } from '../../models/schemas.js';
import fs from 'fs/promises';
import path from 'path';

export const devEnvTools: ToolDefinition[] = [
  // create_project
  {
    name: 'create_project',
    description: 'Crée une structure de projet (Python, Node, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nom du projet' },
        type: { type: 'string', enum: ['python', 'node', 'go', 'rust', 'generic'] },
        path: { type: 'string', description: 'Chemin parent (optionnel)' },
      },
      required: ['name', 'type'],
    },
    execute: async (args: any) => {
      const parsed = CreateProjectSchema.parse(args);
      const basePath = parsed.path || process.env.HOME + '/projects';
      const projectPath = path.join(basePath, parsed.name);

      await fs.mkdir(projectPath, { recursive: true });

      const structure: string[] = [projectPath];

      // Créer structure selon le type
      switch (parsed.type) {
        case 'python':
          await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
          await fs.mkdir(path.join(projectPath, 'tests'), { recursive: true });
          await fs.writeFile(path.join(projectPath, 'README.md'), `# ${parsed.name}\n`);
          await fs.writeFile(path.join(projectPath, 'requirements.txt'), '');
          structure.push('src/', 'tests/', 'README.md', 'requirements.txt');
          break;
        case 'node':
          await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
          await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify({
            name: parsed.name,
            version: '1.0.0',
            description: '',
            main: 'src/index.js',
          }, null, 2));
          structure.push('src/', 'package.json');
          break;
        default:
          await fs.writeFile(path.join(projectPath, 'README.md'), `# ${parsed.name}\n`);
          structure.push('README.md');
      }

      return {
        success: true,
        data: { projectPath, type: parsed.type, structure },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // setup_python_env
  {
    name: 'setup_python_env',
    description: 'Crée un environnement virtuel Python',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string' },
        pythonVersion: { type: 'string' },
        venvName: { type: 'string', default: 'venv' },
      },
      required: ['projectPath'],
    },
    execute: async (args: any) => {
      const parsed = SetupPythonEnvSchema.parse(args);
      const venvPath = path.join(parsed.projectPath, parsed.venvName);

      const pythonCmd = parsed.pythonVersion || 'python3';
      await shellService.execSimple(pythonCmd, ['-m', 'venv', venvPath]);

      const versionResult = await shellService.execSimple(
        path.join(venvPath, 'bin', 'python'),
        ['--version']
      );

      return {
        success: true,
        data: {
          venvPath,
          pythonVersion: versionResult.trim(),
          activateCmd: `source ${venvPath}/bin/activate`,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // setup_node_env
  {
    name: 'setup_node_env',
    description: 'Initialise un environnement Node.js',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string' },
        packageManager: { type: 'string', enum: ['npm', 'yarn', 'pnpm'], default: 'npm' },
      },
      required: ['projectPath'],
    },
    execute: async (args: any) => {
      const parsed = SetupNodeEnvSchema.parse(args);

      await shellService.execSimple(parsed.packageManager, ['install'], parsed.projectPath);

      return {
        success: true,
        data: {
          projectPath: parsed.projectPath,
          packageManager: parsed.packageManager,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // install_dependencies
  {
    name: 'install_dependencies',
    description: 'Installe les dépendances (Python ou Node)',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string' },
        type: { type: 'string', enum: ['python', 'node'] },
        file: { type: 'string' },
      },
      required: ['projectPath', 'type'],
    },
    execute: async (args: any) => {
      const { projectPath, type, file } = args;

      if (type === 'python') {
        const reqFile = file || 'requirements.txt';
        await shellService.execSimple('pip', ['install', '-r', reqFile], projectPath);
      } else if (type === 'node') {
        await shellService.execSimple('npm', ['install'], projectPath);
      }

      return {
        success: true,
        data: { projectPath, type, installed: true },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // list_envs
  {
    name: 'list_envs',
    description: 'Liste les environnements virtuels trouvés',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string' },
      },
    },
    execute: async (args: any) => {
      const projectPath = args.projectPath || process.env.HOME + '/projects';
      const entries = await fs.readdir(projectPath, { withFileTypes: true });

      const pythonEnvs: string[] = [];
      const nodeEnvs: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(projectPath, entry.name);

          // Check Python venv
          const venvBin = path.join(fullPath, 'venv', 'bin', 'python');
          try {
            await fs.access(venvBin);
            pythonEnvs.push(entry.name);
          } catch {}

          // Check Node
          const packageJson = path.join(fullPath, 'package.json');
          try {
            await fs.access(packageJson);
            nodeEnvs.push(entry.name);
          } catch {}
        }
      }

      return {
        success: true,
        data: { python: pythonEnvs, node: nodeEnvs },
        timestamp: new Date().toISOString(),
      };
    },
  },
];
