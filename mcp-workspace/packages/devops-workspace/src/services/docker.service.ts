import { shellService } from './shell.service.js';
import { Container, DockerImage, ContainerStats } from '../models/types.js';
import { logger } from '../utils/logger.js';

/**
 * Service Docker (wrapper du CLI Docker)
 */
export class DockerService {
  /**
   * Liste les containers
   */
  async listContainers(all = false): Promise<Container[]> {
    const args = ['ps', '--format', '{{json .}}'];
    if (all) args.push('-a');

    const result = await shellService.exec('docker', args);

    if (result.exitCode !== 0) {
      throw new Error(`Erreur Docker : ${result.stderr}`);
    }

    // Parse les lignes JSON
    const containers: Container[] = result.stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const data = JSON.parse(line);
        return {
          id: data.ID,
          name: data.Names,
          image: data.Image,
          status: data.Status,
          state: data.State,
          created: data.CreatedAt,
          ports: data.Ports ? data.Ports.split(',').map((p: string) => p.trim()) : [],
        };
      });

    logger.info(`Containers listés : ${containers.length}`);
    return containers;
  }

  /**
   * Récupère les logs d'un container
   */
  async getLogs(
    container: string,
    tail = 100,
    follow = false
  ): Promise<string> {
    const args = ['logs', '--tail', tail.toString()];
    if (follow) args.push('-f');
    args.push(container);

    const result = await shellService.exec('docker', args);
    return result.stdout + result.stderr; // Docker logs peuvent être sur stderr
  }

  /**
   * Démarre un container
   */
  async startContainer(container: string): Promise<void> {
    await shellService.execSimple('docker', ['start', container]);
    logger.info(`Container démarré : ${container}`);
  }

  /**
   * Arrête un container
   */
  async stopContainer(container: string, timeout = 10): Promise<void> {
    await shellService.execSimple('docker', [
      'stop',
      '-t',
      timeout.toString(),
      container,
    ]);
    logger.info(`Container arrêté : ${container}`);
  }

  /**
   * Redémarre un container
   */
  async restartContainer(container: string): Promise<void> {
    await shellService.execSimple('docker', ['restart', container]);
    logger.info(`Container redémarré : ${container}`);
  }

  /**
   * Liste les images
   */
  async listImages(): Promise<DockerImage[]> {
    const result = await shellService.exec('docker', [
      'images',
      '--format',
      '{{json .}}',
    ]);

    if (result.exitCode !== 0) {
      throw new Error(`Erreur Docker : ${result.stderr}`);
    }

    const images: DockerImage[] = result.stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const data = JSON.parse(line);
        return {
          id: data.ID,
          repository: data.Repository,
          tag: data.Tag,
          size: data.Size,
          created: data.CreatedAt,
        };
      });

    return images;
  }

  /**
   * Inspecte un container
   */
  async inspectContainer(container: string): Promise<any> {
    const result = await shellService.execSimple('docker', ['inspect', container]);
    return JSON.parse(result)[0];
  }

  /**
   * Stats d'un container
   */
  async getContainerStats(container: string): Promise<ContainerStats> {
    const result = await shellService.exec('docker', [
      'stats',
      '--no-stream',
      '--format',
      '{{json .}}',
      container,
    ]);

    if (result.exitCode !== 0) {
      throw new Error(`Erreur Docker stats : ${result.stderr}`);
    }

    const data = JSON.parse(result.stdout);

    // Parse le format Docker (ex: "2.5%" -> 2.5)
    const parseCpu = (str: string) => parseFloat(str.replace('%', ''));
    const parseMem = (str: string) => {
      const match = str.match(/([0-9.]+)([KMGT]?iB)/);
      if (!match) return 0;
      const value = parseFloat(match[1]);
      const unit = match[2];
      const multipliers: Record<string, number> = {
        'B': 1,
        'KiB': 1024,
        'MiB': 1024 * 1024,
        'GiB': 1024 * 1024 * 1024,
        'TiB': 1024 * 1024 * 1024 * 1024,
      };
      return value * (multipliers[unit] || 1);
    };

    const memParts = data.MemUsage.split(' / ');

    return {
      cpu: parseCpu(data.CPUPerc),
      memory: parseMem(memParts[0]),
      memoryLimit: parseMem(memParts[1]),
      networkRx: parseMem(data.NetIO.split(' / ')[0]),
      networkTx: parseMem(data.NetIO.split(' / ')[1]),
      diskRead: parseMem(data.BlockIO.split(' / ')[0]),
      diskWrite: parseMem(data.BlockIO.split(' / ')[1]),
    };
  }

  /**
   * Docker Compose UP
   */
  async composeUp(composePath: string, detach = true): Promise<string> {
    const args = ['compose', '-f', composePath, 'up'];
    if (detach) args.push('-d');

    const result = await shellService.exec('docker', args, {
      cwd: composePath,
    });

    if (result.exitCode !== 0) {
      throw new Error(`Erreur Docker Compose : ${result.stderr}`);
    }

    logger.info(`Docker Compose up : ${composePath}`);
    return result.stdout;
  }

  /**
   * Docker Compose DOWN
   */
  async composeDown(composePath: string, removeVolumes = false): Promise<string> {
    const args = ['compose', '-f', composePath, 'down'];
    if (removeVolumes) args.push('-v');

    const result = await shellService.exec('docker', args, {
      cwd: composePath,
    });

    if (result.exitCode !== 0) {
      throw new Error(`Erreur Docker Compose : ${result.stderr}`);
    }

    logger.info(`Docker Compose down : ${composePath}`);
    return result.stdout;
  }
}

export const dockerService = new DockerService();
