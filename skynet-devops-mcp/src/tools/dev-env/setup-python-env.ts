import { join } from 'path';
import { existsSync } from 'fs';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { executeCommand, commandExists } from '../../lib/shell.js';
import { ExecutionError, NotFoundError } from '../../lib/errors.js';
import { SetupPythonEnvSchema, type SetupPythonEnvInput } from '../../schemas/dev-env.js';

export async function setupPythonEnv(input: unknown) {
  const params = validate(SetupPythonEnvSchema, input);

  logger.info('Setting up Python environment', params);

  if (!existsSync(params.projectPath)) {
    throw new NotFoundError(`Project path does not exist: ${params.projectPath}`);
  }

  try {
    // Vérifier que Python existe
    const pythonExists = await commandExists(params.pythonVersion);
    if (!pythonExists) {
      throw new ExecutionError(`Python not found: ${params.pythonVersion}`);
    }

    // Obtenir la version de Python
    const versionResult = await executeCommand(`${params.pythonVersion} --version`);

    let envPath: string;
    let pythonPath: string;

    if (params.useConda) {
      // Utiliser Conda
      const condaExists = await commandExists('conda');
      if (!condaExists) {
        throw new ExecutionError('Conda not found but useConda is true');
      }

      const envName = params.projectPath.split('/').pop() || 'env';
      await executeCommand(`conda create -y -n ${envName} python=${params.pythonVersion}`);

      envPath = `conda:${envName}`;
      pythonPath = `~/.conda/envs/${envName}/bin/python`;
    } else {
      // Utiliser venv
      envPath = join(params.projectPath, 'venv');
      await executeCommand(`${params.pythonVersion} -m venv ${envPath}`);

      pythonPath = join(envPath, 'bin', 'python');
    }

    logger.info('Python environment created successfully', { envPath, pythonPath });

    return {
      success: true,
      envPath,
      pythonPath,
      message: `Python environment created at ${envPath}`,
    };
  } catch (error: any) {
    logger.error('Failed to setup Python environment', { error: error.message });
    throw new ExecutionError(`Failed to setup Python environment: ${error.message}`);
  }
}
