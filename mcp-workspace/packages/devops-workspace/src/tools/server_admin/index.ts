import { ToolDefinition } from '../../models/types.js';
import { systemService } from '../../services/system.service.js';
import { validateName, requireConfirmation } from '../../utils/validator.js';
import { ServiceActionSchema, CheckPortSchema } from '../../models/schemas.js';

export const serverAdminTools: ToolDefinition[] = [
  // get_system_info
  {
    name: 'get_system_info',
    description: 'Récupère les informations système (OS, CPU, RAM, uptime)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const info = await systemService.getSystemInfo();

      return {
        success: true,
        data: info,
        timestamp: new Date().toISOString(),
      };
    },
  },

  // get_resource_usage
  {
    name: 'get_resource_usage',
    description: 'Usage actuel des ressources (CPU, RAM, Disque)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const usage = await systemService.getResourceUsage();

      return {
        success: true,
        data: usage,
        timestamp: new Date().toISOString(),
      };
    },
  },

  // list_services
  {
    name: 'list_services',
    description: 'Liste les services systemd',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Filtre optionnel sur le nom',
        },
      },
    },
    execute: async (args: any) => {
      const services = await systemService.listServices(args.filter);

      return {
        success: true,
        data: {
          services,
          total: services.length,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // service_status
  {
    name: 'service_status',
    description: 'Status détaillé d\'un service systemd',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nom du service',
        },
      },
      required: ['name'],
    },
    execute: async (args: any) => {
      validateName(args.name);
      const status = await systemService.getServiceStatus(args.name);

      return {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      };
    },
  },

  // start_service
  {
    name: 'start_service',
    description: 'Démarre un service systemd',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nom du service',
        },
      },
      required: ['name'],
    },
    execute: async (args: any) => {
      const parsed = ServiceActionSchema.parse(args);
      validateName(parsed.name);

      await systemService.startService(parsed.name);

      return {
        success: true,
        data: {
          service: parsed.name,
          status: 'started',
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // stop_service
  {
    name: 'stop_service',
    description: 'Arrête un service systemd',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nom du service',
        },
        confirm: {
          type: 'boolean',
          description: 'Confirmation requise',
          default: false,
        },
      },
      required: ['name'],
    },
    execute: async (args: any) => {
      const parsed = ServiceActionSchema.parse(args);
      validateName(parsed.name);
      requireConfirmation(`stop_service ${parsed.name}`, parsed.confirm);

      await systemService.stopService(parsed.name);

      return {
        success: true,
        data: {
          service: parsed.name,
          status: 'stopped',
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // restart_service
  {
    name: 'restart_service',
    description: 'Redémarre un service systemd',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nom du service',
        },
        confirm: {
          type: 'boolean',
          description: 'Confirmation requise',
          default: false,
        },
      },
      required: ['name'],
    },
    execute: async (args: any) => {
      const parsed = ServiceActionSchema.parse(args);
      validateName(parsed.name);
      requireConfirmation(`restart_service ${parsed.name}`, parsed.confirm);

      await systemService.restartService(parsed.name);

      return {
        success: true,
        data: {
          service: parsed.name,
          status: 'restarted',
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // get_process_info
  {
    name: 'get_process_info',
    description: 'Liste des processus (top 20 par CPU)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre de processus',
          default: 20,
        },
      },
    },
    execute: async (args: any) => {
      const processes = await systemService.getProcesses(args.limit || 20);

      return {
        success: true,
        data: {
          processes,
          total: processes.length,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  // check_port
  {
    name: 'check_port',
    description: 'Vérifie si un port est ouvert/utilisé',
    inputSchema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          description: 'Numéro de port',
        },
        protocol: {
          type: 'string',
          description: 'Protocole (tcp ou udp)',
          enum: ['tcp', 'udp'],
          default: 'tcp',
        },
      },
      required: ['port'],
    },
    execute: async (args: any) => {
      const parsed = CheckPortSchema.parse(args);
      const result = await systemService.checkPort(parsed.port, parsed.protocol);

      return {
        success: true,
        data: {
          port: parsed.port,
          protocol: parsed.protocol,
          ...result,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },
];
