/**
 * Module server_admin - Administration système
 */

import { createTool, ToolRegistry } from '../../core/registry.js';
import { MCPErrorHandler } from '../../core/error_handler.js';
import si from 'systeminformation';
import { ExecUtil } from '../../utils/exec.js';

export async function getSystemInfo() {
  const [osInfo, system, cpu] = await Promise.all([
    si.osInfo(),
    si.system(),
    si.cpu()
  ]);

  return {
    os: `${osInfo.distro} ${osInfo.release}`,
    kernel: osInfo.kernel,
    architecture: osInfo.arch,
    hostname: osInfo.hostname,
    uptime: Math.floor(si.time().uptime / 3600) + ' heures',
    boot_time: new Date(Date.now() - si.time().uptime * 1000).toISOString()
  };
}

export async function getResourceUsage(input: any = {}) {
  const [cpu, mem, disk] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize()
  ]);

  const result: any = {
    cpu: {
      usage_percent: Math.round(cpu.currentLoad),
      cores: cpu.cpus.length,
      load_average: [cpu.avgLoad, 0, 0] // systeminformation ne fournit qu'un seul load
    },
    memory: {
      total_gb: Math.round(mem.total / 1024 / 1024 / 1024 * 100) / 100,
      used_gb: Math.round(mem.used / 1024 / 1024 / 1024 * 100) / 100,
      available_gb: Math.round(mem.available / 1024 / 1024 / 1024 * 100) / 100,
      percent: Math.round((mem.used / mem.total) * 100)
    },
    disk: disk.map(d => ({
      mount: d.mount,
      total_gb: Math.round(d.size / 1024 / 1024 / 1024 * 100) / 100,
      used_gb: Math.round(d.used / 1024 / 1024 / 1024 * 100) / 100,
      available_gb: Math.round((d.size - d.used) / 1024 / 1024 / 1024 * 100) / 100,
      percent: Math.round(d.use)
    }))
  };

  if (input.include_gpu) {
    try {
      const gpuResult = await ExecUtil.run('nvidia-smi --query-gpu=index,name,memory.used,memory.total,utilization.gpu --format=csv,noheader,nounits');
      result.gpu = gpuResult.stdout.split('\n').filter(Boolean).map(line => {
        const [id, name, memUsed, memTotal, util] = line.split(',').map(s => s.trim());
        return {
          id: parseInt(id),
          name,
          memory_used_mb: parseInt(memUsed),
          memory_total_mb: parseInt(memTotal),
          utilization_percent: parseInt(util)
        };
      });
    } catch {
      result.gpu = [];
    }
  }

  return result;
}

export async function healthCheck() {
  const resources = await getResourceUsage();

  const checks = {
    cpu: {
      status: resources.cpu.usage_percent < 80 ? 'OK' : resources.cpu.usage_percent < 95 ? 'WARNING' : 'CRITICAL',
      value: resources.cpu.usage_percent
    },
    memory: {
      status: resources.memory.percent < 80 ? 'OK' : resources.memory.percent < 95 ? 'WARNING' : 'CRITICAL',
      value: resources.memory.percent
    },
    disk: {
      status: resources.disk.every(d => d.percent < 85) ? 'OK' : resources.disk.some(d => d.percent > 95) ? 'CRITICAL' : 'WARNING',
      value: Math.max(...resources.disk.map(d => d.percent))
    },
    services: {
      status: 'OK',
      failed_count: 0
    }
  };

  const alerts: string[] = [];
  if (checks.cpu.status !== 'OK') alerts.push(`CPU usage élevé: ${checks.cpu.value}%`);
  if (checks.memory.status !== 'OK') alerts.push(`Mémoire usage élevé: ${checks.memory.value}%`);
  if (checks.disk.status !== 'OK') alerts.push(`Disque usage élevé: ${checks.disk.value}%`);

  const overallStatus = Object.values(checks).some(c => c.status === 'CRITICAL') ? 'critical'
    : Object.values(checks).some(c => c.status === 'WARNING') ? 'warning'
    : 'healthy';

  return {
    status: overallStatus,
    checks,
    alerts,
    timestamp: new Date().toISOString()
  };
}

export function registerServerAdminTools(): void {
  ToolRegistry.register(createTool('server_get_system_info', 'Informations système générales', {}, []));
  ToolRegistry.register(createTool('server_get_resource_usage', 'Utilisation des ressources (CPU, RAM, disque)', {
    detailed: { type: 'boolean', default: false },
    include_gpu: { type: 'boolean', default: false }
  }, []));
  ToolRegistry.register(createTool('server_health_check', 'Health check global du système', {}, []));
}

export const serverAdminHandlers = {
  server_get_system_info: async () => MCPErrorHandler.executeTool('server_get_system_info', getSystemInfo),
  server_get_resource_usage: async (input: any) => MCPErrorHandler.executeTool('server_get_resource_usage', () => getResourceUsage(input)),
  server_health_check: async () => MCPErrorHandler.executeTool('server_health_check', healthCheck)
};
