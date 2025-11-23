import si from 'systeminformation';
import { shellService } from './shell.service.js';
import { SystemInfo, ResourceUsage, Service, Process } from '../models/types.js';
import { logger } from '../utils/logger.js';

/**
 * Service système (infos, monitoring, services)
 */
export class SystemService {
  /**
   * Infos système
   */
  async getSystemInfo(): Promise<SystemInfo> {
    const [osInfo, cpu, mem, time] = await Promise.all([
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.time(),
    ]);

    return {
      os: osInfo.distro,
      platform: osInfo.platform,
      kernel: osInfo.kernel,
      uptime: time.uptime,
      hostname: osInfo.hostname,
      cpu: {
        model: cpu.brand,
        cores: cpu.cores,
        speed: cpu.speed,
      },
      memory: {
        total: mem.total,
        free: mem.free,
        used: mem.used,
      },
    };
  }

  /**
   * Usage des ressources
   */
  async getResourceUsage(): Promise<ResourceUsage> {
    const [currentLoad, mem, fsSize] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
    ]);

    return {
      cpu: {
        usage: currentLoad.currentLoad,
        load: currentLoad.avgLoad ? [
          currentLoad.avgLoad,
        ] : [],
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        percentage: (mem.used / mem.total) * 100,
      },
      disk: fsSize.map((fs) => ({
        mount: fs.mount,
        total: fs.size,
        used: fs.used,
        free: fs.available,
        percentage: fs.use,
      })),
    };
  }

  /**
   * Liste des services systemd
   */
  async listServices(filter?: string): Promise<Service[]> {
    const args = [
      'list-units',
      '--type=service',
      '--all',
      '--no-pager',
      '--plain',
    ];

    const result = await shellService.exec('systemctl', args);

    if (result.exitCode !== 0) {
      throw new Error(`Erreur systemctl : ${result.stderr}`);
    }

    const lines = result.stdout.split('\n').filter((l) => l.trim());
    const services: Service[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 4) continue;

      const name = parts[0];
      const status = parts[2]; // loaded/not-found
      const active = parts[3]; // active/inactive

      if (filter && !name.includes(filter)) continue;

      services.push({
        name,
        status,
        enabled: false, // On va vérifier après
        active: active === 'active',
      });
    }

    return services;
  }

  /**
   * Status d'un service
   */
  async getServiceStatus(name: string): Promise<Service> {
    const result = await shellService.exec('systemctl', [
      'status',
      name,
      '--no-pager',
    ]);

    // Parse output (systemctl status renvoie 0, 1, 2, 3, 4)
    const active = result.stdout.includes('Active: active');
    const enabled = result.stdout.includes('Loaded:') && result.stdout.includes('enabled');

    // Extract PID
    const pidMatch = result.stdout.match(/Main PID:\s+(\d+)/);
    const pid = pidMatch ? parseInt(pidMatch[1], 10) : undefined;

    return {
      name,
      status: 'loaded',
      enabled,
      active,
      pid,
    };
  }

  /**
   * Démarre un service
   */
  async startService(name: string): Promise<void> {
    await shellService.execSimple('systemctl', ['start', name]);
    logger.info(`Service démarré : ${name}`);
  }

  /**
   * Arrête un service
   */
  async stopService(name: string): Promise<void> {
    await shellService.execSimple('systemctl', ['stop', name]);
    logger.info(`Service arrêté : ${name}`);
  }

  /**
   * Redémarre un service
   */
  async restartService(name: string): Promise<void> {
    await shellService.execSimple('systemctl', ['restart', name]);
    logger.info(`Service redémarré : ${name}`);
  }

  /**
   * Liste des processus (top 20 par CPU)
   */
  async getProcesses(limit = 20): Promise<Process[]> {
    const processes = await si.processes();

    return processes.list
      .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
      .slice(0, limit)
      .map((p) => ({
        pid: p.pid,
        name: p.name,
        cpu: p.cpu || 0,
        memory: p.mem || 0,
        command: p.command,
      }));
  }

  /**
   * Vérifie si un port est ouvert
   */
  async checkPort(port: number, protocol = 'tcp'): Promise<{
    open: boolean;
    process?: string;
    pid?: number;
  }> {
    try {
      const result = await shellService.exec('lsof', [
        '-i',
        `${protocol}:${port}`,
        '-t',
      ]);

      if (result.stdout.trim()) {
        const pid = parseInt(result.stdout.trim(), 10);
        return { open: true, pid };
      }

      return { open: false };
    } catch {
      return { open: false };
    }
  }
}

export const systemService = new SystemService();
