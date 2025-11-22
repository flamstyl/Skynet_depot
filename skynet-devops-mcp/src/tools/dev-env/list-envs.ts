import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { executeCommand } from '../../lib/shell.js';
import { ListEnvsSchema, type ListEnvsInput } from '../../schemas/dev-env.js';

interface Environment {
  name: string;
  path: string;
  type: 'python' | 'node';
  active: boolean;
  pythonVersion?: string;
  nodeVersion?: string;
}

export async function listEnvs(input: unknown) {
  const params = validate(ListEnvsSchema, input);

  const basePath = params.basePath || config.baseProjectsPath;

  logger.info('Listing environments', { basePath, type: params.type });

  if (!existsSync(basePath)) {
    return { environments: [] };
  }

  const environments: Environment[] = [];

  try {
    const entries = await readdir(basePath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectPath = join(basePath, entry.name);

      // Vérifier Python venv
      if (params.type === 'python' || params.type === 'all') {
        const venvPath = join(projectPath, 'venv');
        const pythonBin = join(venvPath, 'bin', 'python');

        if (existsSync(pythonBin)) {
          try {
            const versionResult = await executeCommand(`${pythonBin} --version`);
            const pythonVersion = versionResult.stdout.trim();

            environments.push({
              name: entry.name,
              path: projectPath,
              type: 'python',
              active: true,
              pythonVersion,
            });
          } catch {
            // Ignore errors
          }
        }
      }

      // Vérifier Node.js
      if (params.type === 'node' || params.type === 'all') {
        const packageJsonPath = join(projectPath, 'package.json');
        const nodeModulesPath = join(projectPath, 'node_modules');

        if (existsSync(packageJsonPath)) {
          let nodeVersion: string | undefined;

          try {
            const versionResult = await executeCommand('node --version', { cwd: projectPath });
            nodeVersion = versionResult.stdout.trim();
          } catch {
            // Ignore
          }

          environments.push({
            name: entry.name,
            path: projectPath,
            type: 'node',
            active: existsSync(nodeModulesPath),
            nodeVersion,
          });
        }
      }
    }

    logger.info('Environments listed', { count: environments.length });

    return { environments };
  } catch (error: any) {
    logger.error('Failed to list environments', { error: error.message });
    return { environments: [] };
  }
}
