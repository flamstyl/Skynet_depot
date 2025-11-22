import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { ExecutionError } from '../../lib/errors.js';
import { CreateProjectSchema, type CreateProjectInput } from '../../schemas/dev-env.js';

export async function createProject(input: unknown) {
  const params = validate(CreateProjectSchema, input);

  const basePath = params.path || config.baseProjectsPath;
  const projectPath = join(basePath, params.name);

  logger.info('Creating project', { name: params.name, path: projectPath, type: params.type });

  if (existsSync(projectPath)) {
    throw new ExecutionError(`Project directory already exists: ${projectPath}`);
  }

  const createdFiles: string[] = [];

  try {
    // Créer le dossier principal
    await mkdir(projectPath, { recursive: true });

    // Créer la structure selon le type
    if (params.type === 'python') {
      await mkdir(join(projectPath, 'src'), { recursive: true });
      await mkdir(join(projectPath, 'tests'), { recursive: true });

      const requirementsTxt = join(projectPath, 'requirements.txt');
      await writeFile(requirementsTxt, '# Python dependencies\n', 'utf-8');
      createdFiles.push(requirementsTxt);

      const pyprojectToml = join(projectPath, 'pyproject.toml');
      const pyprojectContent = `[project]
name = "${params.name}"
version = "0.1.0"
description = ""
requires-python = ">=3.8"
dependencies = []

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"
`;
      await writeFile(pyprojectToml, pyprojectContent, 'utf-8');
      createdFiles.push(pyprojectToml);

      const readme = join(projectPath, 'README.md');
      await writeFile(readme, `# ${params.name}\n\nPython project.\n`, 'utf-8');
      createdFiles.push(readme);
    } else if (params.type === 'node') {
      await mkdir(join(projectPath, 'src'), { recursive: true });

      const packageJson = join(projectPath, 'package.json');
      const packageContent = JSON.stringify(
        {
          name: params.name,
          version: '1.0.0',
          description: '',
          main: 'src/index.js',
          scripts: {
            start: 'node src/index.js',
          },
          keywords: [],
          author: '',
          license: 'ISC',
        },
        null,
        2
      );
      await writeFile(packageJson, packageContent, 'utf-8');
      createdFiles.push(packageJson);

      const tsconfig = join(projectPath, 'tsconfig.json');
      const tsconfigContent = JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
          },
          include: ['src/**/*'],
          exclude: ['node_modules'],
        },
        null,
        2
      );
      await writeFile(tsconfig, tsconfigContent, 'utf-8');
      createdFiles.push(tsconfig);

      const readme = join(projectPath, 'README.md');
      await writeFile(readme, `# ${params.name}\n\nNode.js project.\n`, 'utf-8');
      createdFiles.push(readme);
    } else {
      // Generic project
      const readme = join(projectPath, 'README.md');
      await writeFile(readme, `# ${params.name}\n\nGeneric project.\n`, 'utf-8');
      createdFiles.push(readme);
    }

    logger.info('Project created successfully', { projectPath, filesCreated: createdFiles.length });

    return {
      success: true,
      projectPath,
      message: `Project ${params.name} created successfully`,
      createdFiles,
    };
  } catch (error: any) {
    logger.error('Failed to create project', { error: error.message });
    throw new ExecutionError(`Failed to create project: ${error.message}`);
  }
}
