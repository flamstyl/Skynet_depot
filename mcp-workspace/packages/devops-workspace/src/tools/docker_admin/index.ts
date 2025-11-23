import { ToolDefinition } from '../../models/types.js';
import { dockerService } from '../../services/docker.service.js';
import { validateName, requireConfirmation } from '../../utils/validator.js';
import {
  ListContainersSchema,
  ContainerLogsSchema,
  ContainerActionSchema,
  DockerComposeSchema,
} from '../../models/schemas.js';

export const dockerAdminTools: ToolDefinition[] = [
  // list_containers
  {
    name: 'list_containers',
    description: 'Liste les containers Docker (running ou tous)',
    inputSchema: {
      type: 'object',
      properties: {
        all: {
          type: 'boolean',
          description: 'Inclure les containers arrêtés',
          default: false,
        },
        filter: {
          type: 'string',
          description: 'Filtre optionnel sur le nom',
        },
      },
    },
    execute: async (args: any) => {
      const parsed = ListContainersSchema.parse(args);
      const containers = await dockerService.listContainers(parsed.all);

      let filtered = containers;
      if (parsed.filter) {
        filtered = containers.filter((c) =>
          c.name.includes(parsed.filter!)
        );
      }

      return {
        success: true,
        data: {
          containers: filtered,
          total: filtered.length,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // container_logs
  {
    name: 'container_logs',
    description: 'Récupère les logs d\'un container Docker',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Nom ou ID du container',
        },
        tail: {
          type: 'number',
          description: 'Nombre de lignes à récupérer',
          default: 100,
        },
        follow: {
          type: 'boolean',
          description: 'Mode streaming (non supporté en MCP)',
          default: false,
        },
      },
      required: ['container'],
    },
    execute: async (args: any) => {
      const parsed = ContainerLogsSchema.parse(args);
      validateName(parsed.container);

      const logs = await dockerService.getLogs(
        parsed.container,
        parsed.tail,
        false // follow non supporté en MCP
      );

      return {
        success: true,
        data: {
          container: parsed.container,
          logs,
          lines: logs.split('\n').length,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // start_container
  {
    name: 'start_container',
    description: 'Démarre un container Docker',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Nom ou ID du container',
        },
      },
      required: ['container'],
    },
    execute: async (args: any) => {
      const parsed = ContainerActionSchema.parse(args);
      validateName(parsed.container);

      await dockerService.startContainer(parsed.container);

      return {
        success: true,
        data: {
          container: parsed.container,
          status: 'started',
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // stop_container
  {
    name: 'stop_container',
    description: 'Arrête un container Docker',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Nom ou ID du container',
        },
        timeout: {
          type: 'number',
          description: 'Timeout en secondes',
          default: 10,
        },
      },
      required: ['container'],
    },
    execute: async (args: any) => {
      const parsed = ContainerActionSchema.parse(args);
      validateName(parsed.container);

      await dockerService.stopContainer(parsed.container, parsed.timeout);

      return {
        success: true,
        data: {
          container: parsed.container,
          status: 'stopped',
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // restart_container
  {
    name: 'restart_container',
    description: 'Redémarre un container Docker',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Nom ou ID du container',
        },
      },
      required: ['container'],
    },
    execute: async (args: any) => {
      const parsed = ContainerActionSchema.parse(args);
      validateName(parsed.container);

      await dockerService.restartContainer(parsed.container);

      return {
        success: true,
        data: {
          container: parsed.container,
          status: 'restarted',
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // list_images
  {
    name: 'list_images',
    description: 'Liste les images Docker',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const images = await dockerService.listImages();

      return {
        success: true,
        data: {
          images,
          total: images.length,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // container_stats
  {
    name: 'container_stats',
    description: 'Statistiques de ressources d\'un container',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Nom ou ID du container',
        },
      },
      required: ['container'],
    },
    execute: async (args: any) => {
      validateName(args.container);
      const stats = await dockerService.getContainerStats(args.container);

      return {
        success: true,
        data: {
          container: args.container,
          stats,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // inspect_container
  {
    name: 'inspect_container',
    description: 'Détails complets d\'un container Docker',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Nom ou ID du container',
        },
      },
      required: ['container'],
    },
    execute: async (args: any) => {
      validateName(args.container);
      const details = await dockerService.inspectContainer(args.container);

      return {
        success: true,
        data: {
          container: args.container,
          details,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // docker_compose_up
  {
    name: 'docker_compose_up',
    description: 'Lance une stack Docker Compose',
    inputSchema: {
      type: 'object',
      properties: {
        composePath: {
          type: 'string',
          description: 'Chemin vers docker-compose.yml',
        },
        detach: {
          type: 'boolean',
          description: 'Mode détaché',
          default: true,
        },
      },
      required: ['composePath'],
    },
    execute: async (args: any) => {
      const parsed = DockerComposeSchema.parse(args);
      const output = await dockerService.composeUp(parsed.composePath, parsed.detach);

      return {
        success: true,
        data: {
          composePath: parsed.composePath,
          output,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // docker_compose_down
  {
    name: 'docker_compose_down',
    description: 'Arrête une stack Docker Compose',
    inputSchema: {
      type: 'object',
      properties: {
        composePath: {
          type: 'string',
          description: 'Chemin vers docker-compose.yml',
        },
        removeVolumes: {
          type: 'boolean',
          description: 'Supprimer les volumes',
          default: false,
        },
      },
      required: ['composePath'],
    },
    execute: async (args: any) => {
      const parsed = DockerComposeSchema.parse(args);
      const output = await dockerService.composeDown(
        parsed.composePath,
        parsed.removeVolumes
      );

      return {
        success: true,
        data: {
          composePath: parsed.composePath,
          output,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },
];
