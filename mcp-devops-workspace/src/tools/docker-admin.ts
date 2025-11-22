import Docker from 'dockerode';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  ListContainersInput,
  ContainerActionInput,
  ContainerLogsInput,
  DockerComposeInput,
} from '../types/schemas.js';
import { MCPError, NotFoundError } from '../utils/errors.js';
import { validatePath, fileExists } from '../utils/security.js';

const execAsync = promisify(exec);
const docker = new Docker();

/**
 * Liste les containers Docker
 */
export async function listContainers(input: ListContainersInput) {
  try {
    const containers = await docker.listContainers({
      all: input.all,
      filters: input.filters,
    });

    const formatted = containers.map(container => ({
      id: container.Id.substring(0, 12),
      names: container.Names.map(n => n.replace('/', '')),
      image: container.Image,
      state: container.State,
      status: container.Status,
      ports: container.Ports.map(p => ({
        private: p.PrivatePort,
        public: p.PublicPort,
        type: p.Type,
      })),
      created: new Date(container.Created * 1000).toISOString(),
    }));

    return {
      containers: formatted,
      count: formatted.length,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la liste des containers : ${error}`);
  }
}

/**
 * Récupère le statut détaillé d'un container
 */
export async function getContainerStatus(input: ContainerActionInput) {
  try {
    const container = docker.getContainer(input.containerId);
    const info = await container.inspect();

    return {
      id: info.Id.substring(0, 12),
      name: info.Name.replace('/', ''),
      image: info.Config.Image,
      state: {
        status: info.State.Status,
        running: info.State.Running,
        paused: info.State.Paused,
        restarting: info.State.Restarting,
        exitCode: info.State.ExitCode,
        startedAt: info.State.StartedAt,
      },
      network: info.NetworkSettings.Networks,
      mounts: info.Mounts.map(m => ({
        type: m.Type,
        source: m.Source,
        destination: m.Destination,
        mode: m.Mode,
      })),
    };
  } catch (error) {
    throw new NotFoundError(`Container ${input.containerId} introuvable : ${error}`);
  }
}

/**
 * Récupère les logs d'un container
 */
export async function getContainerLogs(input: ContainerLogsInput) {
  try {
    const container = docker.getContainer(input.containerId);

    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: input.tail,
      since: input.since ? Math.floor(new Date(input.since).getTime() / 1000) : undefined,
      follow: input.follow,
      timestamps: true,
    });

    // Convertir Buffer en string
    const logsStr = logs.toString('utf-8');

    return {
      containerId: input.containerId,
      logs: logsStr,
      lines: logsStr.split('\n').length,
    };
  } catch (error) {
    throw new NotFoundError(`Impossible de récupérer les logs : ${error}`);
  }
}

/**
 * Démarre un container
 */
export async function startContainer(input: ContainerActionInput) {
  try {
    const container = docker.getContainer(input.containerId);
    await container.start();

    return {
      success: true,
      containerId: input.containerId,
      message: `Container ${input.containerId} démarré`,
    };
  } catch (error) {
    throw new MCPError(`Erreur au démarrage du container : ${error}`);
  }
}

/**
 * Arrête un container
 */
export async function stopContainer(input: ContainerActionInput) {
  try {
    const container = docker.getContainer(input.containerId);
    await container.stop();

    return {
      success: true,
      containerId: input.containerId,
      message: `Container ${input.containerId} arrêté`,
    };
  } catch (error) {
    throw new MCPError(`Erreur à l'arrêt du container : ${error}`);
  }
}

/**
 * Redémarre un container
 */
export async function restartContainer(input: ContainerActionInput) {
  try {
    const container = docker.getContainer(input.containerId);
    await container.restart();

    return {
      success: true,
      containerId: input.containerId,
      message: `Container ${input.containerId} redémarré`,
    };
  } catch (error) {
    throw new MCPError(`Erreur au redémarrage du container : ${error}`);
  }
}

/**
 * Liste les images Docker
 */
export async function listImages() {
  try {
    const images = await docker.listImages();

    const formatted = images.map(image => ({
      id: image.Id.split(':')[1]?.substring(0, 12) || 'N/A',
      tags: image.RepoTags || ['<none>'],
      size: `${(image.Size / 1024 / 1024).toFixed(2)} MB`,
      created: new Date(image.Created * 1000).toISOString(),
    }));

    return {
      images: formatted,
      count: formatted.length,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la liste des images : ${error}`);
  }
}

/**
 * Liste les volumes Docker
 */
export async function listVolumes() {
  try {
    const { Volumes } = await docker.listVolumes();

    const formatted = (Volumes || []).map(volume => ({
      name: volume.Name,
      driver: volume.Driver,
      mountpoint: volume.Mountpoint,
      created: volume.CreatedAt,
    }));

    return {
      volumes: formatted,
      count: formatted.length,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la liste des volumes : ${error}`);
  }
}

/**
 * Lance une stack Docker Compose
 */
export async function dockerComposeUp(input: DockerComposeInput) {
  const composePath = await validatePath(input.composePath);

  if (!(await fileExists(composePath))) {
    throw new NotFoundError(`Fichier docker-compose ${composePath} introuvable`);
  }

  const projectFlag = input.projectName ? `-p ${input.projectName}` : '';
  const detachedFlag = input.detached ? '-d' : '';
  const command = `docker-compose ${projectFlag} -f "${composePath}" up ${detachedFlag}`;

  try {
    const { stdout, stderr } = await execAsync(command);

    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      message: `Stack Docker Compose lancée depuis ${composePath}`,
    };
  } catch (error: any) {
    throw new MCPError(`Erreur docker-compose up : ${error.message}`);
  }
}

/**
 * Arrête une stack Docker Compose
 */
export async function dockerComposeDown(input: DockerComposeInput) {
  const composePath = await validatePath(input.composePath);

  if (!(await fileExists(composePath))) {
    throw new NotFoundError(`Fichier docker-compose ${composePath} introuvable`);
  }

  const projectFlag = input.projectName ? `-p ${input.projectName}` : '';
  const command = `docker-compose ${projectFlag} -f "${composePath}" down`;

  try {
    const { stdout, stderr } = await execAsync(command);

    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      message: `Stack Docker Compose arrêtée`,
    };
  } catch (error: any) {
    throw new MCPError(`Erreur docker-compose down : ${error.message}`);
  }
}

/**
 * Récupère les stats temps réel des containers
 */
export async function getDockerStats() {
  try {
    const containers = await docker.listContainers();
    const statsPromises = containers.map(async (containerInfo) => {
      const container = docker.getContainer(containerInfo.Id);
      const stats = await container.stats({ stream: false });

      // Calculer CPU %
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;

      // Calculer Memory
      const memUsage = stats.memory_stats.usage || 0;
      const memLimit = stats.memory_stats.limit || 0;
      const memPercent = memLimit > 0 ? (memUsage / memLimit) * 100 : 0;

      return {
        id: containerInfo.Id.substring(0, 12),
        name: containerInfo.Names[0]?.replace('/', '') || 'N/A',
        cpu: `${cpuPercent.toFixed(2)}%`,
        memory: `${(memUsage / 1024 / 1024).toFixed(2)} MB / ${(memLimit / 1024 / 1024).toFixed(2)} MB`,
        memoryPercent: `${memPercent.toFixed(2)}%`,
      };
    });

    const stats = await Promise.all(statsPromises);

    return {
      stats,
      count: stats.length,
    };
  } catch (error) {
    throw new MCPError(`Erreur lors de la récupération des stats : ${error}`);
  }
}
