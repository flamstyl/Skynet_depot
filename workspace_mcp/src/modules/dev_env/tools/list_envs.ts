/**
 * Tool: list_envs
 * Liste tous les environnements de développement
 */

import { Validator } from '../../../core/validator.js';
import { ListEnvsInput } from '../../../types/tools.js';
import { ExecUtil } from '../../../utils/exec.js';
import fs from 'fs/promises';
import path from 'path';

export async function listEnvs(input: ListEnvsInput) {
  const validated = Validator.validate<ListEnvsInput>(
    input,
    Validator.schemas.listEnvs
  );

  const searchPath = validated.search_path || process.env.PROJECTS_ROOT || '/home/user/projects';
  const environments: any[] = [];

  try {
    const projects = await fs.readdir(searchPath);

    for (const project of projects) {
      const projectPath = path.join(searchPath, project);
      const stat = await fs.stat(projectPath);

      if (!stat.isDirectory()) continue;

      // Chercher un venv Python
      if (validated.filter === 'python' || validated.filter === 'all') {
        const venvPath = path.join(projectPath, 'venv');
        try {
          await fs.access(venvPath);
          const pythonBin = path.join(venvPath, 'bin', 'python');

          try {
            const versionResult = await ExecUtil.run(`${pythonBin} --version`);
            environments.push({
              name: project,
              type: 'python',
              path: projectPath,
              env_path: venvPath,
              active: false,
              python_version: versionResult.stdout.trim()
            });
          } catch {
            // Venv corrompu
          }
        } catch {
          // Pas de venv
        }
      }

      // Chercher un projet Node
      if (validated.filter === 'node' || validated.filter === 'all') {
        const packageJsonPath = path.join(projectPath, 'package.json');
        try {
          await fs.access(packageJsonPath);
          const nodeModulesPath = path.join(projectPath, 'node_modules');

          let nodeVersion = 'N/A';
          try {
            const versionResult = await ExecUtil.run('node --version', { cwd: projectPath });
            nodeVersion = versionResult.stdout.trim();
          } catch {
            // Node pas installé
          }

          const hasNodeModules = await fs.access(nodeModulesPath).then(() => true).catch(() => false);

          environments.push({
            name: project,
            type: 'node',
            path: projectPath,
            active: false,
            node_version: nodeVersion,
            dependencies_installed: hasNodeModules
          });
        } catch {
          // Pas de package.json
        }
      }
    }
  } catch (error: any) {
    throw new Error(`Impossible de lire le dossier: ${searchPath}`);
  }

  return {
    environments,
    total: environments.length
  };
}
