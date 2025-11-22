/**
 * Module dev_env - Gestion des environnements de développement
 */

import { createTool, ToolRegistry } from '../../core/registry.js';
import { MCPErrorHandler } from '../../core/error_handler.js';
import { createProject } from './tools/create_project.js';
import { setupPythonEnv } from './tools/setup_python_env.js';
import { listEnvs } from './tools/list_envs.js';

/**
 * Enregistrer tous les tools du module dev_env
 */
export function registerDevEnvTools(): void {
  // create_project
  ToolRegistry.register(
    createTool(
      'dev_env_create_project',
      'Crée un nouveau projet avec structure de dossiers',
      {
        name: { type: 'string', description: 'Nom du projet' },
        type: {
          type: 'string',
          enum: ['python', 'node', 'mixed'],
          description: 'Type de projet'
        },
        path: { type: 'string', description: 'Chemin du projet (optionnel)' },
        template: { type: 'string', description: 'Template à utiliser (optionnel)' },
        git_init: { type: 'boolean', description: 'Initialiser Git', default: true }
      },
      ['name', 'type']
    )
  );

  // setup_python_env
  ToolRegistry.register(
    createTool(
      'dev_env_setup_python',
      'Configure un environnement Python (venv)',
      {
        project_path: { type: 'string', description: 'Chemin du projet' },
        python_version: { type: 'string', description: 'Version Python (ex: 3.11)' },
        env_name: { type: 'string', description: 'Nom de l\'environnement', default: 'venv' },
        requirements: { type: 'string', description: 'Chemin vers requirements.txt' },
        install_deps: { type: 'boolean', description: 'Installer les dépendances', default: true }
      },
      ['project_path']
    )
  );

  // setup_node_env
  ToolRegistry.register(
    createTool(
      'dev_env_setup_node',
      'Configure un environnement Node.js',
      {
        project_path: { type: 'string', description: 'Chemin du projet' },
        node_version: { type: 'string', description: 'Version Node (ex: 18)' },
        package_manager: {
          type: 'string',
          enum: ['npm', 'yarn', 'pnpm'],
          description: 'Gestionnaire de paquets'
        },
        install_deps: { type: 'boolean', description: 'Installer les dépendances', default: true }
      },
      ['project_path', 'package_manager']
    )
  );

  // list_envs
  ToolRegistry.register(
    createTool(
      'dev_env_list',
      'Liste tous les environnements de développement',
      {
        filter: {
          type: 'string',
          enum: ['python', 'node', 'all'],
          description: 'Filtrer par type',
          default: 'all'
        },
        search_path: { type: 'string', description: 'Chemin de recherche' }
      },
      []
    )
  );
}

/**
 * Handlers pour les tools dev_env
 */
export const devEnvHandlers = {
  dev_env_create_project: async (input: any) =>
    MCPErrorHandler.executeTool('dev_env_create_project', () => createProject(input)),

  dev_env_setup_python: async (input: any) =>
    MCPErrorHandler.executeTool('dev_env_setup_python', () => setupPythonEnv(input)),

  dev_env_list: async (input: any) =>
    MCPErrorHandler.executeTool('dev_env_list', () => listEnvs(input))
};
