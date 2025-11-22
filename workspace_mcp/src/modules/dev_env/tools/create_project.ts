/**
 * Tool: create_project
 * Crée un nouveau projet avec structure de dossiers
 */

import { ExecUtil } from '../../../utils/exec.js';
import { Validator } from '../../../core/validator.js';
import { CreateProjectInput } from '../../../types/tools.js';
import fs from 'fs/promises';
import path from 'path';

export async function createProject(input: CreateProjectInput) {
  // Validation
  const validated = Validator.validate<CreateProjectInput>(
    input,
    Validator.schemas.createProject
  );

  const projectsRoot = process.env.PROJECTS_ROOT || '/home/user/projects';
  const projectPath = validated.path
    ? path.join(validated.path, validated.name)
    : path.join(projectsRoot, validated.name);

  // Vérifier si le projet existe déjà
  try {
    await fs.access(projectPath);
    throw new Error(`Le projet existe déjà: ${projectPath}`);
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error;
  }

  // Créer la structure de base
  const structure: string[] = [];

  await fs.mkdir(projectPath, { recursive: true });
  structure.push(projectPath);

  if (validated.type === 'python' || validated.type === 'mixed') {
    const pythonDirs = ['src', 'tests', 'docs', 'scripts'];
    for (const dir of pythonDirs) {
      const dirPath = path.join(projectPath, dir);
      await fs.mkdir(dirPath, { recursive: true });
      structure.push(dirPath);
    }

    // Créer __init__.py
    await fs.writeFile(path.join(projectPath, 'src', '__init__.py'), '');
    await fs.writeFile(path.join(projectPath, 'tests', '__init__.py'), '');

    // Créer requirements.txt
    await fs.writeFile(
      path.join(projectPath, 'requirements.txt'),
      '# Python dependencies\n'
    );

    // Créer README.md
    await fs.writeFile(
      path.join(projectPath, 'README.md'),
      `# ${validated.name}\n\nProjet Python créé par Workspace MCP\n`
    );
  }

  if (validated.type === 'node' || validated.type === 'mixed') {
    const nodeDirs = ['src', 'tests', 'dist'];
    for (const dir of nodeDirs) {
      const dirPath = path.join(projectPath, dir);
      await fs.mkdir(dirPath, { recursive: true });
      structure.push(dirPath);
    }

    // Créer package.json basique
    const packageJson = {
      name: validated.name,
      version: '1.0.0',
      description: `Projet Node.js créé par Workspace MCP`,
      main: 'src/index.js',
      scripts: {
        test: 'echo "Error: no test specified" && exit 1'
      },
      keywords: [],
      author: '',
      license: 'MIT'
    };

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  // Créer .gitignore
  const gitignoreContent = validated.type === 'python'
    ? `__pycache__/\n*.py[cod]\n*$py.class\nvenv/\n.env\n`
    : `node_modules/\ndist/\n.env\n`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);

  // Initialiser Git si demandé
  if (validated.git_init) {
    await ExecUtil.run(`git init`, { cwd: projectPath });
    await ExecUtil.run(`git add .`, { cwd: projectPath });
    await ExecUtil.run(
      `git commit -m "Initial commit"`,
      { cwd: projectPath }
    );
    structure.push(`${projectPath}/.git`);
  }

  return {
    project_path: projectPath,
    structure,
    message: `Projet "${validated.name}" créé avec succès`
  };
}
