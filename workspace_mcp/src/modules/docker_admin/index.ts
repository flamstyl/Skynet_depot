/**
 * Module docker_admin - Administration Docker
 */

import { createTool, ToolRegistry } from '../../core/registry.js';
import { MCPErrorHandler } from '../../core/error_handler.js';
import { listContainers } from './tools/list_containers.js';
import { containerLogs } from './tools/container_logs.js';
import { startContainer, stopContainer, restartContainer } from './tools/container_actions.js';

export function registerDockerAdminTools(): void {
  ToolRegistry.register(
    createTool(
      'docker_list_containers',
      'Liste les containers Docker',
      {
        all: { type: 'boolean', description: 'Inclure containers arrêtés', default: false },
        filter: { type: 'string', description: 'Filtrer par nom' },
        format: {
          type: 'string',
          enum: ['simple', 'detailed'],
          description: 'Format de sortie',
          default: 'simple'
        }
      },
      []
    )
  );

  ToolRegistry.register(
    createTool(
      'docker_container_logs',
      'Récupère les logs d\'un container',
      {
        container: { type: 'string', description: 'ID ou nom du container' },
        tail: { type: 'number', description: 'Nombre de lignes', default: 100 },
        since: { type: 'string', description: 'Depuis (timestamp ISO)' },
        follow: { type: 'boolean', description: 'Stream continu', default: false }
      },
      ['container']
    )
  );

  ToolRegistry.register(
    createTool(
      'docker_start_container',
      'Démarre un container',
      {
        container: { type: 'string', description: 'ID ou nom du container' },
        wait_healthy: { type: 'boolean', description: 'Attendre que le container soit healthy', default: false }
      },
      ['container']
    )
  );

  ToolRegistry.register(
    createTool(
      'docker_stop_container',
      'Arrête un container',
      {
        container: { type: 'string', description: 'ID ou nom du container' },
        timeout: { type: 'number', description: 'Timeout avant force kill (secondes)', default: 10 }
      },
      ['container']
    )
  );

  ToolRegistry.register(
    createTool(
      'docker_restart_container',
      'Redémarre un container',
      {
        container: { type: 'string', description: 'ID ou nom du container' },
        timeout: { type: 'number', description: 'Timeout (secondes)', default: 10 }
      },
      ['container']
    )
  );
}

export const dockerAdminHandlers = {
  docker_list_containers: async (input: any) =>
    MCPErrorHandler.executeTool('docker_list_containers', () => listContainers(input)),

  docker_container_logs: async (input: any) =>
    MCPErrorHandler.executeTool('docker_container_logs', () => containerLogs(input)),

  docker_start_container: async (input: any) =>
    MCPErrorHandler.executeTool('docker_start_container', () => startContainer(input)),

  docker_stop_container: async (input: any) =>
    MCPErrorHandler.executeTool('docker_stop_container', () => stopContainer(input)),

  docker_restart_container: async (input: any) =>
    MCPErrorHandler.executeTool('docker_restart_container', () => restartContainer(input))
};
