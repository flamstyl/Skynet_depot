import * as si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ServiceActionInput, CheckPortInput, ProcessListInput } from '../types/schemas.js';
import { MCPError } from '../utils/errors.js';

const execAsync = promisify(exec);

/**
 * Récupère les informations système
 */
export async function getSystemInfo() {
  try {
    const [osInfo, cpu, mem, disk, network, time] = await Promise.all([
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.networkInterfaces(),
      si.time(),
    ]);

    return {
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        kernel: osInfo.kernel,
        arch: osInfo.arch,
        hostname: osInfo.hostname,
      },
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: `${cpu.speed} GHz`,
      },
      memory: {
        total: `${(mem.total / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(mem.free / 1024 / 1024 / 1024).toFixed(2)} GB`,
        used: `${(mem.used / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usedPercent: `${((mem.used / mem.total) * 100).toFixed(2)}%`,
      },
      disk: disk.map(d => ({
        fs: d.fs,
        type: d.type,
        size: `${(d.size / 1024 / 1024 / 1024).toFixed(2)} GB`,
        used: `${(d.used / 1024 / 1024 / 1024).toFixed(2)} GB`,
        available: `${(d.available / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usedPercent: `${d.use.toFixed(2)}%`,
        mount: d.mount,
      })),
      network: network.map(n => ({
        iface: n.iface,
        ip4: n.ip4,
        ip6: n.ip6,
        mac: n.mac,
        internal: n.internal,
        virtual: n.virtual,
      })),
      uptime: {
        system: `${Math.floor(time.uptime / 3600)}h ${Math.floor((time.uptime % 3600) / 60)}m`,
        timezone: time.timezone,
      },
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la récupération des infos système : ${error}`);
  }
}

/**
 * Récupère l'utilisation des ressources
 */
export async function getResourceUsage() {
  try {
    const [cpu, mem, disk, load, processes] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.currentLoad(),
      si.processes(),
    ]);

    return {
      cpu: {
        usage: `${cpu.currentLoad.toFixed(2)}%`,
        idle: `${cpu.currentLoadIdle.toFixed(2)}%`,
        user: `${cpu.currentLoadUser.toFixed(2)}%`,
        system: `${cpu.currentLoadSystem.toFixed(2)}%`,
      },
      memory: {
        total: `${(mem.total / 1024 / 1024 / 1024).toFixed(2)} GB`,
        used: `${(mem.used / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(mem.free / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usedPercent: `${((mem.used / mem.total) * 100).toFixed(2)}%`,
        available: `${(mem.available / 1024 / 1024 / 1024).toFixed(2)} GB`,
      },
      disk: disk.map(d => ({
        mount: d.mount,
        usedPercent: `${d.use.toFixed(2)}%`,
        available: `${(d.available / 1024 / 1024 / 1024).toFixed(2)} GB`,
      })),
      load: {
        avgLoad: load.avgLoad,
        currentLoad: `${load.currentLoad.toFixed(2)}%`,
      },
      processes: {
        all: processes.all,
        running: processes.running,
        blocked: processes.blocked,
        sleeping: processes.sleeping,
      },
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la récupération de l'utilisation : ${error}`);
  }
}

/**
 * Liste les services systemd
 */
export async function listServices() {
  try {
    // Vérifier si systemd est disponible
    try {
      await execAsync('which systemctl');
    } catch {
      throw new MCPError('systemd (systemctl) n\'est pas disponible sur ce système');
    }

    const { stdout } = await execAsync('systemctl list-units --type=service --all --no-pager');

    const lines = stdout.split('\n').slice(1, -7); // Enlever header et footer
    const services = lines
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          name: parts[0],
          load: parts[1],
          active: parts[2],
          sub: parts[3],
          description: parts.slice(4).join(' '),
        };
      });

    return {
      services,
      count: services.length,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la liste des services : ${error}`);
  }
}

/**
 * Récupère le statut d'un service
 */
export async function getServiceStatus(input: ServiceActionInput) {
  try {
    const { stdout } = await execAsync(`systemctl status ${input.serviceName} --no-pager`);

    return {
      serviceName: input.serviceName,
      status: stdout.trim(),
    };
  } catch (error: any) {
    // systemctl status retourne code 3 si service inactif, ce n'est pas une erreur
    if (error.code === 3) {
      return {
        serviceName: input.serviceName,
        status: error.stdout?.trim() || 'Service inactif',
      };
    }
    throw new MCPError(`Erreur lors de la récupération du statut : ${error.message}`);
  }
}

/**
 * Redémarre un service (nécessite confirmation)
 */
export async function restartService(input: ServiceActionInput) {
  if (!input.confirm) {
    throw new MCPError(
      `Action dangereuse : le redémarrage du service ${input.serviceName} nécessite une confirmation explicite (confirm: true)`
    );
  }

  try {
    const { stdout, stderr } = await execAsync(`sudo systemctl restart ${input.serviceName}`);

    return {
      success: true,
      serviceName: input.serviceName,
      message: `Service ${input.serviceName} redémarré`,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error: any) {
    throw new MCPError(`Erreur lors du redémarrage du service : ${error.message}`);
  }
}

/**
 * Liste les processus
 */
export async function getProcessList(input: ProcessListInput) {
  try {
    const processes = await si.processes();

    let sortedList = processes.list.sort((a, b) => {
      if (input.sortBy === 'cpu') return (b.cpu || 0) - (a.cpu || 0);
      if (input.sortBy === 'memory') return (b.mem || 0) - (a.mem || 0);
      return (b.pid || 0) - (a.pid || 0);
    });

    const topProcesses = sortedList.slice(0, input.limit).map(p => ({
      pid: p.pid,
      name: p.name,
      cpu: `${(p.cpu || 0).toFixed(2)}%`,
      memory: `${(p.mem || 0).toFixed(2)}%`,
      state: p.state,
      user: p.user,
      command: p.command?.substring(0, 100),
    }));

    return {
      processes: topProcesses,
      total: processes.all,
      running: processes.running,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la liste des processus : ${error}`);
  }
}

/**
 * Vérifie si un port est ouvert
 */
export async function checkPort(input: CheckPortInput) {
  try {
    const { stdout } = await execAsync(`nc -zv ${input.host} ${input.port} 2>&1`);

    const isOpen = stdout.includes('succeeded') || stdout.includes('open');

    return {
      host: input.host,
      port: input.port,
      open: isOpen,
      message: isOpen ? `Port ${input.port} est ouvert` : `Port ${input.port} est fermé`,
    };
  } catch (error: any) {
    // nc retourne code d'erreur si port fermé
    return {
      host: input.host,
      port: input.port,
      open: false,
      message: `Port ${input.port} est fermé`,
    };
  }
}

/**
 * Récupère les infos GPU (si nvidia-smi dispo)
 */
export async function getGPUInfo() {
  try {
    // Vérifier si nvidia-smi est disponible
    await execAsync('which nvidia-smi');

    const { stdout } = await execAsync('nvidia-smi --query-gpu=name,driver_version,memory.total,memory.used,memory.free,temperature.gpu,utilization.gpu --format=csv,noheader,nounits');

    const lines = stdout.trim().split('\n');
    const gpus = lines.map((line, index) => {
      const parts = line.split(', ');
      return {
        index,
        name: parts[0],
        driverVersion: parts[1],
        memoryTotal: `${parts[2]} MB`,
        memoryUsed: `${parts[3]} MB`,
        memoryFree: `${parts[4]} MB`,
        temperature: `${parts[5]}°C`,
        utilization: `${parts[6]}%`,
      };
    });

    return {
      available: true,
      gpus,
      count: gpus.length,
    };
  } catch {
    return {
      available: false,
      message: 'nvidia-smi non disponible (pas de GPU NVIDIA ou driver non installé)',
    };
  }
}
