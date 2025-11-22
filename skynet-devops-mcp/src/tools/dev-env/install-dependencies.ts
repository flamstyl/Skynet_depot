import { existsSync } from 'fs';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { executeCommand } from '../../lib/shell.js';
import { ExecutionError, NotFoundError } from '../../lib/errors.js';
import { InstallDependenciesSchema, type InstallDependenciesInput } from '../../schemas/dev-env.js';

export async function installDependencies(input: unknown) {
  const params = validate(InstallDependenciesSchema, input);

  logger.info('Installing dependencies', params);

  if (!existsSync(params.projectPath)) {
    throw new NotFoundError(`Project path does not exist: ${params.projectPath}`);
  }

  const startTime = Date.now();

  try {
    let command: string;
    let installedPackages = 0;

    if (params.type === 'python') {
      const requirementsFile = `${params.projectPath}/requirements.txt`;

      if (!existsSync(requirementsFile)) {
        throw new NotFoundError(`requirements.txt not found in ${params.projectPath}`);
      }

      // Activer le venv si présent
      const venvPath = `${params.projectPath}/venv`;
      const pythonCmd = existsSync(venvPath) ? `${venvPath}/bin/python` : 'python3';

      command = `${pythonCmd} -m pip install -r requirements.txt`;

      if (params.dev) {
        const devRequirementsFile = `${params.projectPath}/requirements-dev.txt`;
        if (existsSync(devRequirementsFile)) {
          command += ` && ${pythonCmd} -m pip install -r requirements-dev.txt`;
        }
      }

      const result = await executeCommand(command, { cwd: params.projectPath });

      // Parser le nombre de packages installés
      const matches = result.stdout.match(/Successfully installed (.+)/);
      if (matches) {
        installedPackages = matches[1].split(' ').length;
      }
    } else {
      // Node.js
      const packageJsonPath = `${params.projectPath}/package.json`;

      if (!existsSync(packageJsonPath)) {
        throw new NotFoundError(`package.json not found in ${params.projectPath}`);
      }

      // Détecter le package manager
      let packageManager = 'npm';
      if (existsSync(`${params.projectPath}/yarn.lock`)) {
        packageManager = 'yarn';
      } else if (existsSync(`${params.projectPath}/pnpm-lock.yaml`)) {
        packageManager = 'pnpm';
      }

      command = packageManager === 'yarn' ? 'yarn install' : `${packageManager} install`;

      if (params.dev) {
        command += packageManager === 'npm' ? ' --include=dev' : ' --dev';
      } else {
        command += packageManager === 'npm' ? ' --omit=dev' : ' --production';
      }

      const result = await executeCommand(command, { cwd: params.projectPath });

      // Parser le nombre de packages
      const matches = result.stdout.match(/added (\d+) packages?/);
      if (matches) {
        installedPackages = parseInt(matches[1], 10);
      }
    }

    const duration = Date.now() - startTime;

    logger.info('Dependencies installed successfully', { installedPackages, duration });

    return {
      success: true,
      installedPackages,
      duration,
      message: `Installed ${installedPackages} packages in ${(duration / 1000).toFixed(2)}s`,
    };
  } catch (error: any) {
    logger.error('Failed to install dependencies', { error: error.message });
    throw new ExecutionError(`Failed to install dependencies: ${error.message}`);
  }
}
