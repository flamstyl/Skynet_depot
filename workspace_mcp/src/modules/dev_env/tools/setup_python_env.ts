/**
 * Tool: setup_python_env
 * Configure un environnement Python (venv)
 */

import { ExecUtil } from '../../../utils/exec.js';
import { Validator } from '../../../core/validator.js';
import { SetupPythonEnvInput } from '../../../types/tools.js';
import path from 'path';
import fs from 'fs/promises';

export async function setupPythonEnv(input: SetupPythonEnvInput) {
  const validated = Validator.validate<SetupPythonEnvInput>(
    input,
    Validator.schemas.setupPythonEnv
  );

  const envPath = path.join(validated.project_path, validated.env_name!);

  // Vérifier si l'environnement existe déjà
  try {
    await fs.access(envPath);
    throw new Error(`L'environnement existe déjà: ${envPath}`);
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error;
  }

  // Créer le venv
  const pythonCmd = validated.python_version
    ? `python${validated.python_version}`
    : 'python3';

  await ExecUtil.run(
    `${pythonCmd} -m venv ${validated.env_name}`,
    { cwd: validated.project_path }
  );

  // Récupérer la version de Python
  const versionResult = await ExecUtil.run(
    `${envPath}/bin/python --version`
  );
  const pythonVersion = versionResult.stdout.trim();

  let packagesInstalled = 0;

  // Installer les dépendances si demandé
  if (validated.install_deps && validated.requirements) {
    const reqPath = path.join(validated.project_path, validated.requirements);

    try {
      await fs.access(reqPath);
      await ExecUtil.run(
        `${envPath}/bin/pip install -r ${validated.requirements}`,
        { cwd: validated.project_path },
        120000 // 2 minutes timeout
      );

      // Compter les packages installés
      const listResult = await ExecUtil.run(`${envPath}/bin/pip list`);
      packagesInstalled = listResult.stdout.split('\n').length - 2; // Enlever header
    } catch (error: any) {
      // Fichier requirements non trouvé, on continue
    }
  }

  const activationCommand = `source ${envPath}/bin/activate`;

  return {
    env_path: envPath,
    python_version: pythonVersion,
    packages_installed: packagesInstalled,
    activation_command: activationCommand,
    message: `Environnement Python créé avec succès`
  };
}
