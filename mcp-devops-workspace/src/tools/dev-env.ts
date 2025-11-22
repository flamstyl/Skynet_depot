import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  CreateProjectInput,
  SetupPythonEnvInput,
  SetupNodeEnvInput,
  InstallDependenciesInput,
} from '../types/schemas.js';
import { validatePath, sanitizeFileName, fileExists } from '../utils/security.js';
import { MCPError, NotFoundError } from '../utils/errors.js';

const execAsync = promisify(exec);

/**
 * Crée une structure de projet
 */
export async function createProject(input: CreateProjectInput) {
  const projectName = sanitizeFileName(input.name);
  const basePath = input.path || process.cwd();
  const projectPath = path.join(basePath, projectName);

  // Vérifier que le dossier n'existe pas déjà
  if (await fileExists(projectPath)) {
    throw new MCPError(`Le projet ${projectName} existe déjà à ${projectPath}`);
  }

  // Créer structure de base
  await fs.mkdir(projectPath, { recursive: true });

  // Structure selon le langage
  switch (input.language) {
    case 'python':
      await fs.mkdir(path.join(projectPath, 'src'));
      await fs.mkdir(path.join(projectPath, 'tests'));
      await fs.writeFile(
        path.join(projectPath, 'requirements.txt'),
        '# Dependencies\n'
      );
      await fs.writeFile(
        path.join(projectPath, '.gitignore'),
        '__pycache__/\n*.pyc\n.venv/\n.env\ndist/\nbuild/\n*.egg-info/\n'
      );
      break;

    case 'node':
      await fs.mkdir(path.join(projectPath, 'src'));
      await fs.mkdir(path.join(projectPath, 'tests'));
      await fs.writeFile(
        path.join(projectPath, '.gitignore'),
        'node_modules/\ndist/\nbuild/\n.env\n*.log\n'
      );
      break;

    case 'go':
      await fs.mkdir(path.join(projectPath, 'cmd'));
      await fs.mkdir(path.join(projectPath, 'pkg'));
      await fs.mkdir(path.join(projectPath, 'internal'));
      await fs.writeFile(
        path.join(projectPath, '.gitignore'),
        'bin/\n*.exe\n*.dll\n*.so\n*.dylib\n'
      );
      break;

    case 'rust':
      await execAsync(`cd "${projectPath}" && cargo init`);
      break;

    default:
      await fs.mkdir(path.join(projectPath, 'src'));
  }

  // README
  if (input.createReadme) {
    const readme = `# ${projectName}\n\nProjet ${input.language}\n\n## Installation\n\nTODO\n\n## Usage\n\nTODO\n`;
    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  // Git
  if (input.initGit) {
    await execAsync(`cd "${projectPath}" && git init`);
  }

  return {
    success: true,
    projectPath,
    message: `Projet ${projectName} créé avec succès à ${projectPath}`,
  };
}

/**
 * Configure un environnement Python
 */
export async function setupPythonEnv(input: SetupPythonEnvInput) {
  const projectPath = await validatePath(input.projectPath);

  if (!(await fileExists(projectPath))) {
    throw new NotFoundError(`Le dossier ${projectPath} n'existe pas`);
  }

  const venvPath = path.join(projectPath, input.venvName);

  // Créer virtualenv
  const pythonCmd = input.pythonVersion ? `python${input.pythonVersion}` : 'python3';
  await execAsync(`cd "${projectPath}" && ${pythonCmd} -m venv ${input.venvName}`);

  // Installer requirements si fourni
  if (input.requirements && await fileExists(input.requirements)) {
    const activateCmd = `source ${venvPath}/bin/activate`;
    await execAsync(`cd "${projectPath}" && ${activateCmd} && pip install -r ${input.requirements}`);
  }

  return {
    success: true,
    venvPath,
    activateCommand: `source ${venvPath}/bin/activate`,
    message: `Environnement Python créé à ${venvPath}`,
  };
}

/**
 * Configure un environnement Node.js
 */
export async function setupNodeEnv(input: SetupNodeEnvInput) {
  const projectPath = await validatePath(input.projectPath);

  if (!(await fileExists(projectPath))) {
    throw new NotFoundError(`Le dossier ${projectPath} n'existe pas`);
  }

  // Initialiser package.json si demandé
  if (input.initPackageJson) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!(await fileExists(packageJsonPath))) {
      await execAsync(`cd "${projectPath}" && ${input.packageManager} init -y`);
    }
  }

  return {
    success: true,
    projectPath,
    packageManager: input.packageManager,
    message: `Environnement Node.js configuré avec ${input.packageManager}`,
  };
}

/**
 * Installe les dépendances d'un projet
 */
export async function installDependencies(input: InstallDependenciesInput) {
  const projectPath = await validatePath(input.projectPath);

  if (!(await fileExists(projectPath))) {
    throw new NotFoundError(`Le dossier ${projectPath} n'existe pas`);
  }

  let command: string;
  let depsFile: string;

  if (input.language === 'python') {
    depsFile = input.dependenciesFile || path.join(projectPath, 'requirements.txt');
    if (!(await fileExists(depsFile))) {
      throw new NotFoundError(`Fichier ${depsFile} introuvable`);
    }

    // Chercher venv
    const venvPath = path.join(projectPath, '.venv');
    const activateCmd = await fileExists(venvPath)
      ? `source ${venvPath}/bin/activate &&`
      : '';

    command = `cd "${projectPath}" && ${activateCmd} pip install -r ${depsFile}`;
  } else if (input.language === 'node') {
    depsFile = input.dependenciesFile || path.join(projectPath, 'package.json');
    if (!(await fileExists(depsFile))) {
      throw new NotFoundError(`Fichier ${depsFile} introuvable`);
    }

    command = `cd "${projectPath}" && npm install`;
  } else {
    throw new MCPError(`Langage ${input.language} non supporté`);
  }

  const { stdout, stderr } = await execAsync(command);

  return {
    success: true,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    message: `Dépendances installées pour ${input.language}`,
  };
}

/**
 * Liste les environnements disponibles
 */
export async function listEnvironments(projectPath: string) {
  const validatedPath = await validatePath(projectPath);
  const environments: Array<{ type: string; path: string; active: boolean }> = [];

  // Chercher venv Python
  const pythonVenvs = ['.venv', 'venv', 'env'];
  for (const venvName of pythonVenvs) {
    const venvPath = path.join(validatedPath, venvName);
    if (await fileExists(venvPath)) {
      environments.push({
        type: 'python',
        path: venvPath,
        active: false, // TODO: détecter si actif
      });
    }
  }

  // Chercher node_modules
  const nodeModulesPath = path.join(validatedPath, 'node_modules');
  if (await fileExists(nodeModulesPath)) {
    environments.push({
      type: 'node',
      path: nodeModulesPath,
      active: false,
    });
  }

  return {
    environments,
    count: environments.length,
  };
}
