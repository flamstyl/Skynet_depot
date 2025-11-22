/**
 * Tool MCP : Créer un nouveau projet
 */

import { join } from "path";
import { fileService } from "../../services/file-service.js";
import { gitService } from "../../services/git-service.js";
import { PATHS_CONFIG } from "../../config/paths.js";
import { validateProjectName } from "../../utils/validators.js";
import { logger } from "../../utils/logger.js";
import {
  CreateProjectInputSchema,
  CreateProjectOutputSchema,
} from "../../models/schemas.js";

export async function createProject(input: unknown) {
  // Validation du schema
  const params = CreateProjectInputSchema.parse(input);

  // Validation du nom
  validateProjectName(params.name);

  // Déterminer le chemin du projet
  const basePath = params.path || PATHS_CONFIG.DEFAULT_PROJECTS_DIR;
  const projectPath = join(basePath, params.name);

  // Vérifier que le projet n'existe pas déjà
  const exists = await fileService.exists(projectPath);
  if (exists) {
    return CreateProjectOutputSchema.parse({
      success: false,
      projectPath,
      message: `Project already exists: ${projectPath}`,
    });
  }

  // Créer le dossier du projet
  await fileService.createDirectory(projectPath);
  logger.info(`Project directory created: ${projectPath}`);

  // Créer la structure selon le type
  if (params.type === "python") {
    // Structure Python
    await fileService.createDirectory(join(projectPath, "src"));
    await fileService.createDirectory(join(projectPath, "tests"));
    await fileService.writeFile(
      join(projectPath, "README.md"),
      `# ${params.name}\n\nProjet Python créé automatiquement.\n`,
      false
    );
    await fileService.writeFile(
      join(projectPath, "requirements.txt"),
      "# Python dependencies\n",
      false
    );
    await fileService.writeFile(
      join(projectPath, ".gitignore"),
      "__pycache__/\n*.py[cod]\nvenv/\n.env\n",
      false
    );
  } else if (params.type === "node") {
    // Structure Node.js
    await fileService.createDirectory(join(projectPath, "src"));
    await fileService.writeFile(
      join(projectPath, "README.md"),
      `# ${params.name}\n\nProjet Node.js créé automatiquement.\n`,
      false
    );
    await fileService.writeFile(
      join(projectPath, ".gitignore"),
      "node_modules/\ndist/\n.env\n",
      false
    );
  } else {
    // Structure générique
    await fileService.writeFile(
      join(projectPath, "README.md"),
      `# ${params.name}\n\nProjet créé automatiquement.\n`,
      false
    );
  }

  // Initialiser Git si demandé
  if (params.initGit) {
    await gitService.init(projectPath);
    logger.info(`Git initialized in: ${projectPath}`);
  }

  return CreateProjectOutputSchema.parse({
    success: true,
    projectPath,
    message: `Project "${params.name}" created successfully at ${projectPath}`,
  });
}

export const createProjectTool = {
  name: "create_project",
  description:
    "Crée un nouveau projet avec structure de dossiers (Python, Node.js ou générique)",
  inputSchema: CreateProjectInputSchema,
  outputSchema: CreateProjectOutputSchema,
  handler: createProject,
};
