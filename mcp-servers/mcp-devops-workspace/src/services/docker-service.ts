/**
 * Service pour les opérations Docker
 */

import { shell } from "./shell-executor.js";
import { ContainerInfo, ImageInfo } from "../models/types.js";
import { DockerError } from "../models/errors.js";
import { validateContainerId } from "../utils/validators.js";
import { logger } from "../utils/logger.js";

export class DockerService {
  /**
   * Vérifie que Docker est disponible
   */
  async checkDocker(): Promise<void> {
    const exists = await shell.commandExists("docker");
    if (!exists) {
      throw new DockerError("Docker is not installed or not in PATH");
    }

    try {
      await shell.run("docker info");
    } catch (error) {
      throw new DockerError(
        "Docker daemon is not running or user lacks permissions",
        { originalError: error }
      );
    }
  }

  /**
   * Liste les containers
   */
  async listContainers(
    all = false,
    filters?: { name?: string; status?: string }
  ): Promise<ContainerInfo[]> {
    await this.checkDocker();

    let command = "docker ps --format '{{json .}}'";
    if (all) {
      command += " -a";
    }

    if (filters?.name) {
      command += ` --filter "name=${filters.name}"`;
    }

    if (filters?.status) {
      const statusMap: Record<string, string> = {
        running: "running",
        stopped: "exited",
        paused: "paused",
      };
      command += ` --filter "status=${statusMap[filters.status] || filters.status}"`;
    }

    const output = await shell.run(command);

    if (!output) {
      return [];
    }

    const containers: ContainerInfo[] = [];
    for (const line of output.split("\n")) {
      if (!line.trim()) continue;

      try {
        const data = JSON.parse(line);
        containers.push({
          id: data.ID,
          name: data.Names,
          image: data.Image,
          status: data.Status,
          ports: data.Ports ? data.Ports.split(", ") : [],
          created: data.CreatedAt,
        });
      } catch (error) {
        logger.warn(`Failed to parse container JSON: ${line}`);
      }
    }

    return containers;
  }

  /**
   * Récupère les logs d'un container
   */
  async getContainerLogs(
    containerId: string,
    tail = 100,
    since?: string
  ): Promise<{ logs: string; containerName: string }> {
    validateContainerId(containerId);
    await this.checkDocker();

    let command = `docker logs ${containerId} --tail ${tail}`;
    if (since) {
      command += ` --since ${since}`;
    }

    const logs = await shell.run(command);

    // Récupérer le nom du container
    const nameOutput = await shell.run(
      `docker inspect --format '{{.Name}}' ${containerId}`
    );
    const containerName = nameOutput.replace("/", "");

    return { logs, containerName };
  }

  /**
   * Démarre un container
   */
  async startContainer(containerId: string): Promise<string> {
    validateContainerId(containerId);
    await this.checkDocker();

    await shell.run(`docker start ${containerId}`);
    logger.info(`Container started: ${containerId}`);

    const status = await this.getContainerStatus(containerId);
    return status;
  }

  /**
   * Arrête un container
   */
  async stopContainer(containerId: string): Promise<string> {
    validateContainerId(containerId);
    await this.checkDocker();

    await shell.run(`docker stop ${containerId}`);
    logger.info(`Container stopped: ${containerId}`);

    const status = await this.getContainerStatus(containerId);
    return status;
  }

  /**
   * Redémarre un container
   */
  async restartContainer(containerId: string): Promise<string> {
    validateContainerId(containerId);
    await this.checkDocker();

    await shell.run(`docker restart ${containerId}`);
    logger.info(`Container restarted: ${containerId}`);

    const status = await this.getContainerStatus(containerId);
    return status;
  }

  /**
   * Liste les images Docker
   */
  async listImages(dangling?: boolean): Promise<ImageInfo[]> {
    await this.checkDocker();

    let command = "docker images --format '{{json .}}'";
    if (dangling) {
      command += ' --filter "dangling=true"';
    }

    const output = await shell.run(command);

    if (!output) {
      return [];
    }

    const images: ImageInfo[] = [];
    for (const line of output.split("\n")) {
      if (!line.trim()) continue;

      try {
        const data = JSON.parse(line);
        images.push({
          id: data.ID,
          repository: data.Repository,
          tag: data.Tag,
          size: data.Size,
          created: data.CreatedAt,
        });
      } catch (error) {
        logger.warn(`Failed to parse image JSON: ${line}`);
      }
    }

    return images;
  }

  /**
   * Récupère le statut d'un container
   */
  private async getContainerStatus(containerId: string): Promise<string> {
    const output = await shell.run(
      `docker inspect --format '{{.State.Status}}' ${containerId}`
    );
    return output;
  }
}

export const dockerService = new DockerService();
