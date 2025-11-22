import { existsSync } from 'fs';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { executeCommand, commandExists } from '../../lib/shell.js';
import { ExecutionError, NotFoundError } from '../../lib/errors.js';
import { SetupNodeEnvSchema, type SetupNodeEnvInput } from '../../schemas/dev-env.js';

export async function setupNodeEnv(input: unknown) {
  const params = validate(SetupNodeEnvSchema, input);

  logger.info('Setting up Node.js environment', params);

  if (!existsSync(params.projectPath)) {
    throw new NotFoundError(`Project path does not exist: ${params.projectPath}`);
  }

  try {
    // Vérifier que Node.js existe
    const nodeExists = await commandExists('node');
    if (!nodeExists) {
      throw new ExecutionError('Node.js not found');
    }

    // Obtenir la version de Node.js
    const versionResult = await executeCommand('node --version');
    const nodeVersion = versionResult.stdout.trim();

    // Vérifier/installer le package manager
    const pmExists = await commandExists(params.packageManager);
    if (!pmExists) {
      logger.info(`Installing ${params.packageManager}`);

      if (params.packageManager === 'yarn') {
        await executeCommand('npm install -g yarn');
      } else if (params.packageManager === 'pnpm') {
        await executeCommand('npm install -g pnpm');
      }
    }

    // Initialiser package.json s'il n'existe pas
    const packageJsonPath = `${params.projectPath}/package.json`;
    if (!existsSync(packageJsonPath)) {
      await executeCommand(`${params.packageManager} init -y`, { cwd: params.projectPath });
    }

    logger.info('Node.js environment setup completed', { nodeVersion, packageManager: params.packageManager });

    return {
      success: true,
      nodeVersion,
      packageManager: params.packageManager,
      message: `Node.js environment configured with ${params.packageManager}`,
    };
  } catch (error: any) {
    logger.error('Failed to setup Node.js environment', { error: error.message });
    throw new ExecutionError(`Failed to setup Node.js environment: ${error.message}`);
  }
}
