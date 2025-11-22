/**
 * Module server_admin : Administration système Linux
 * Tools pour monitoring, gestion services systemd, health checks
 */

import { z } from 'zod';
import si from 'systeminformation';
import { executeCommand, commandExists } from '../utils/executor.js';
import { createLogger } from '../utils/logger.js';
import type { ToolResult, SystemHealth } from '../utils/types.js';

const logger = createLogger('server_admin');

/**
 * Schémas Zod pour validation
 */
export const GetSystemInfoSchema = z.object({
  detailed: z.boolean().default(false).describe('Informations détaillées')
});

export const GetResourceUsageSchema = z.object({});

export const ListServicesSchema = z.object({
  pattern: z.string().optional().describe('Filtrer par pattern (ex: nginx)')
});

export const ServiceActionSchema = z.object({
  serviceName: z.string().describe('Nom du service systemd'),
  action: z.enum(['status', 'start', 'stop', 'restart', 'enable', 'disable']).describe('Action à effectuer')
});

export const GetProcessesSchema = z.object({
  sortBy: z.enum(['cpu', 'memory']).default('cpu').describe('Trier par CPU ou mémoire'),
  limit: z.number().default(10).describe('Nombre de processus à afficher')
});

/**
 * Tool: get_system_info
 * Informations système générales
 */
export async function getSystemInfo(args: z.infer<typeof GetSystemInfoSchema>): Promise<ToolResult> {
  try {
    const { detailed } = args;

    logger.info('Récupération informations système');

    const [osInfo, cpu, mem, time] = await Promise.all([
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.time()
    ]);

    let output = `🖥️  INFORMATIONS SYSTÈME\n\n`;
    output += `OS: ${osInfo.distro} ${osInfo.release}\n`;
    output += `Kernel: ${osInfo.kernel}\n`;
    output += `Architecture: ${osInfo.arch}\n`;
    output += `Hostname: ${osInfo.hostname}\n`;
    output += `Uptime: ${formatUptime(time.uptime)}\n\n`;

    output += `⚙️  CPU\n`;
    output += `Modèle: ${cpu.manufacturer} ${cpu.brand}\n`;
    output += `Cores: ${cpu.cores} (${cpu.physicalCores} physiques)\n`;
    output += `Vitesse: ${cpu.speed} GHz\n\n`;

    output += `💾 MÉMOIRE\n`;
    output += `Total: ${(mem.total / 1024 / 1024 / 1024).toFixed(2)} GB\n`;
    output += `Utilisée: ${(mem.used / 1024 / 1024 / 1024).toFixed(2)} GB\n`;
    output += `Libre: ${(mem.free / 1024 / 1024 / 1024).toFixed(2)} GB\n`;

    if (detailed) {
      const disk = await si.fsSize();
      const network = await si.networkInterfaces();

      output += `\n💿 DISQUES\n`;
      for (const d of disk) {
        output += `${d.fs} (${d.mount}):\n`;
        output += `  Taille: ${(d.size / 1024 / 1024 / 1024).toFixed(2)} GB\n`;
        output += `  Utilisé: ${(d.used / 1024 / 1024 / 1024).toFixed(2)} GB (${d.use.toFixed(1)}%)\n`;
      }

      output += `\n🌐 RÉSEAU\n`;
      for (const net of network.filter(n => !n.internal)) {
        output += `${net.iface}: ${net.ip4} (${net.type})\n`;
      }
    }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des infos système', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: get_resource_usage
 * Utilisation CPU, RAM, disque en temps réel
 */
export async function getResourceUsage(_args: z.infer<typeof GetResourceUsageSchema>): Promise<ToolResult> {
  try {
    logger.info('Récupération utilisation ressources');

    const [cpuLoad, mem, disk] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize()
    ]);

    const health: SystemHealth = {
      cpu: {
        usage: cpuLoad.currentLoad,
        cores: cpuLoad.cpus.length,
        temperature: undefined
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usagePercent: (mem.used / mem.total) * 100
      },
      disk: {
        total: disk[0]?.size || 0,
        used: disk[0]?.used || 0,
        free: disk[0]?.available || 0,
        usagePercent: disk[0]?.use || 0
      },
      uptime: (await si.time()).uptime,
      loadAverage: cpuLoad.avgLoad ? [cpuLoad.avgLoad] : []
    };

    // Tentative GPU (Nvidia)
    try {
      const gpuResult = await executeCommand('nvidia-smi', [
        '--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu',
        '--format=csv,noheader,nounits'
      ]);

      if (gpuResult.success && gpuResult.output) {
        const [, , , temp] = gpuResult.output.split(',').map(v => parseFloat(v.trim()));
        health.cpu.temperature = temp;
      }
    } catch {
      // GPU Nvidia non disponible
    }

    const cpuStatus = health.cpu.usage > 80 ? '🔴' : health.cpu.usage > 50 ? '🟡' : '🟢';
    const memStatus = health.memory.usagePercent > 80 ? '🔴' : health.memory.usagePercent > 50 ? '🟡' : '🟢';
    const diskStatus = health.disk.usagePercent > 80 ? '🔴' : health.disk.usagePercent > 50 ? '🟡' : '🟢';

    let output = `📊 UTILISATION DES RESSOURCES\n\n`;
    output += `${cpuStatus} CPU: ${health.cpu.usage.toFixed(2)}% (${health.cpu.cores} cores)\n`;
    output += `${memStatus} RAM: ${(health.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB / ${(health.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB (${health.memory.usagePercent.toFixed(1)}%)\n`;
    output += `${diskStatus} Disque: ${(health.disk.used / 1024 / 1024 / 1024).toFixed(2)} GB / ${(health.disk.total / 1024 / 1024 / 1024).toFixed(2)} GB (${health.disk.usagePercent.toFixed(1)}%)\n`;
    output += `\n⏱️  Uptime: ${formatUptime(health.uptime)}\n`;

    if (health.loadAverage.length > 0) {
      output += `📈 Load Average: ${health.loadAverage.map(l => l.toFixed(2)).join(', ')}\n`;
    }

    if (health.cpu.temperature) {
      output += `🌡️  GPU Temp: ${health.cpu.temperature}°C\n`;
    }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des ressources', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: list_services
 * Liste les services systemd
 */
export async function listServices(args: z.infer<typeof ListServicesSchema>): Promise<ToolResult> {
  try {
    const { pattern } = args;

    logger.info(`Liste des services systemd${pattern ? ` (pattern: ${pattern})` : ''}`);

    const hasSystemctl = await commandExists('systemctl');

    if (!hasSystemctl) {
      return {
        content: [{
          type: 'text',
          text: `❌ systemd n'est pas disponible sur ce système`
        }],
        isError: true
      };
    }

    const args_cmd = pattern
      ? ['list-units', '--type=service', '--all', '--no-pager', `${pattern}*`]
      : ['list-units', '--type=service', '--no-pager'];

    const result = await executeCommand('systemctl', args_cmd);

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `❌ Erreur systemctl: ${result.error}`
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: 'text',
        text: `📋 Services systemd:\n\n${result.output}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la liste des services', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: service_action
 * Effectue une action sur un service systemd
 */
export async function serviceAction(args: z.infer<typeof ServiceActionSchema>): Promise<ToolResult> {
  try {
    const { serviceName, action } = args;

    logger.info(`Action systemd: ${action} sur ${serviceName}`);

    const hasSystemctl = await commandExists('systemctl');

    if (!hasSystemctl) {
      return {
        content: [{
          type: 'text',
          text: `❌ systemd n'est pas disponible`
        }],
        isError: true
      };
    }

    // Actions potentiellement dangereuses nécessitent sudo
    const needsSudo = ['start', 'stop', 'restart', 'enable', 'disable'].includes(action);

    const command = needsSudo ? 'sudo' : 'systemctl';
    const args_cmd = needsSudo
      ? ['systemctl', action, serviceName]
      : [action, serviceName];

    const result = await executeCommand(command, args_cmd, { timeout: 60000 });

    if (!result.success) {
      return {
        content: [{
          type: 'text',
          text: `❌ Erreur lors de l'action "${action}":\n${result.error}\n\n` +
                `Note: Cette opération peut nécessiter les droits sudo.`
        }],
        isError: true
      };
    }

    const actionEmojis: Record<string, string> = {
      status: '📊',
      start: '▶️',
      stop: '⏹️',
      restart: '🔄',
      enable: '✅',
      disable: '❌'
    };

    return {
      content: [{
        type: 'text',
        text: `${actionEmojis[action] || '⚙️'} Action "${action}" sur "${serviceName}":\n\n${result.output || 'Succès'}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de l\'action service', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Tool: get_processes
 * Liste les processus avec leur utilisation CPU/RAM
 */
export async function getProcesses(args: z.infer<typeof GetProcessesSchema>): Promise<ToolResult> {
  try {
    const { sortBy, limit } = args;

    logger.info(`Liste des processus (sortBy: ${sortBy}, limit: ${limit})`);

    const processes = await si.processes();

    const sortedProcesses = processes.list
      .sort((a, b) => {
        if (sortBy === 'cpu') {
          return b.cpu - a.cpu;
        } else {
          return b.mem - a.mem;
        }
      })
      .slice(0, limit);

    let output = `🔍 Top ${limit} processus par ${sortBy === 'cpu' ? 'CPU' : 'mémoire'}:\n\n`;

    for (const proc of sortedProcesses) {
      output += `PID ${proc.pid}: ${proc.name}\n`;
      output += `  CPU: ${proc.cpu.toFixed(1)}% | RAM: ${proc.mem.toFixed(1)}% | Mem: ${proc.memRss} KB\n`;
    }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des processus', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur: ${error.message}`
      }],
      isError: true
    };
  }
}

/**
 * Utilitaire: formater l'uptime
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '0m';
}

/**
 * Export des tools pour le serveur MCP
 */
export const serverAdminTools = {
  get_system_info: {
    description: 'Récupère les informations système (OS, CPU, RAM, disques, réseau)',
    inputSchema: GetSystemInfoSchema,
    handler: getSystemInfo
  },
  get_resource_usage: {
    description: 'Affiche l\'utilisation actuelle des ressources (CPU, RAM, disque, uptime)',
    inputSchema: GetResourceUsageSchema,
    handler: getResourceUsage
  },
  list_services: {
    description: 'Liste les services systemd avec leur état',
    inputSchema: ListServicesSchema,
    handler: listServices
  },
  service_action: {
    description: 'Effectue une action sur un service systemd (status, start, stop, restart, enable, disable)',
    inputSchema: ServiceActionSchema,
    handler: serviceAction
  },
  get_processes: {
    description: 'Liste les processus les plus gourmands en CPU ou mémoire',
    inputSchema: GetProcessesSchema,
    handler: getProcesses
  }
};
