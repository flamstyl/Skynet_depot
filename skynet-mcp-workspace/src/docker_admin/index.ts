/**
 * Module docker_admin : Administration Docker
 * Tools pour gérer containers, images, volumes via Docker Engine API
 */

import { z } from 'zod';
import Docker from 'dockerode';
import { createLogger } from '../utils/logger.js';
import type { ToolResult } from '../utils/types.js';

const logger = createLogger('docker_admin');

// Instance Docker (socket Unix par défaut)
let docker: Docker;

try {
  docker = new Docker({ socketPath: '/var/run/docker.sock' });
} catch (error) {
  logger.warn('Docker socket non disponible, tentative avec paramètres par défaut');
  docker = new Docker();
}

/**
 * Schémas Zod pour validation
 */
export const ListContainersSchema = z.object({
  all: z.boolean().default(false).describe('Inclure les containers arrêtés')
});

export const ContainerActionSchema = z.object({
  containerId: z.string().describe('ID ou nom du container')
});

export const ContainerLogsSchema = z.object({
  containerId: z.string().describe('ID ou nom du container'),
  tail: z.number().default(100).describe('Nombre de lignes'),
  follow: z.boolean().default(false).describe('Mode suivi (streaming)')
});

export const ListImagesSchema = z.object({
  all: z.boolean().default(false).describe('Inclure les images intermédiaires')
});

export const PullImageSchema = z.object({
  image: z.string().describe('Nom de l\'image (ex: nginx:latest)')
});

export const ContainerStatsSchema = z.object({
  containerId: z.string().describe('ID ou nom du container')
});

export const CreateContainerSchema = z.object({
  name: z.string().optional().describe('Nom du container'),
  image: z.string().describe('Image à utiliser'),
  ports: z.record(z.string()).optional().describe('Mapping de ports {containerPort: hostPort}'),
  env: z.array(z.string()).optional().describe('Variables d\'environnement'),
  volumes: z.record(z.string()).optional().describe('Volumes {containerPath: hostPath}'),
  command: z.array(z.string()).optional().describe('Commande à exécuter')
});

/**
 * Tool: list_containers
 * Liste tous les containers Docker
 */
export async function listContainers(args: z.infer<typeof ListContainersSchema>): Promise<ToolResult> {
  try {
    const { all } = args;

    logger.info(`Liste des containers (all=${all})`);

    const containers = await docker.listContainers({ all });

    if (containers.length === 0) {
      return {
        content: [{
          type: 'text',
          text: all ? '📦 Aucun container trouvé' : '📦 Aucun container en cours d\'exécution'
        }]
      };
    }

    const formatted = containers.map(c => {
      const names = c.Names.map(n => n.replace(/^\//, '')).join(', ');
      const ports = c.Ports.map(p =>
        p.PublicPort ? `${p.PublicPort}→${p.PrivatePort}/${p.Type}` : `${p.PrivatePort}/${p.Type}`
      ).join(', ');

      return `🐳 ${names}\n` +
             `   ID: ${c.Id.substring(0, 12)}\n` +
             `   Image: ${c.Image}\n` +
             `   Status: ${c.Status}\n` +
             `   State: ${c.State}\n` +
             `   Ports: ${ports || 'aucun'}`;
    }).join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `📋 Containers Docker (${containers.length}):\n\n${formatted}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la liste des containers', error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erreur Docker: ${error.message}\n\nAssurez-vous que Docker est installé et en cours d'exécution.`
      }],
      isError: true
    };
  }
}

/**
 * Tool: start_container
 * Démarre un container
 */
export async function startContainer(args: z.infer<typeof ContainerActionSchema>): Promise<ToolResult> {
  try {
    const { containerId } = args;

    logger.info(`Démarrage du container: ${containerId}`);

    const container = docker.getContainer(containerId);
    await container.start();

    logger.success(`Container démarré: ${containerId}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Container "${containerId}" démarré avec succès`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors du démarrage', error);
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
 * Tool: stop_container
 * Arrête un container
 */
export async function stopContainer(args: z.infer<typeof ContainerActionSchema>): Promise<ToolResult> {
  try {
    const { containerId } = args;

    logger.info(`Arrêt du container: ${containerId}`);

    const container = docker.getContainer(containerId);
    await container.stop();

    logger.success(`Container arrêté: ${containerId}`);

    return {
      content: [{
        type: 'text',
        text: `⏹️  Container "${containerId}" arrêté avec succès`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de l\'arrêt', error);
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
 * Tool: restart_container
 * Redémarre un container
 */
export async function restartContainer(args: z.infer<typeof ContainerActionSchema>): Promise<ToolResult> {
  try {
    const { containerId } = args;

    logger.info(`Redémarrage du container: ${containerId}`);

    const container = docker.getContainer(containerId);
    await container.restart();

    logger.success(`Container redémarré: ${containerId}`);

    return {
      content: [{
        type: 'text',
        text: `🔄 Container "${containerId}" redémarré avec succès`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors du redémarrage', error);
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
 * Tool: remove_container
 * Supprime un container
 */
export async function removeContainer(args: z.infer<typeof ContainerActionSchema>): Promise<ToolResult> {
  try {
    const { containerId } = args;

    logger.info(`Suppression du container: ${containerId}`);

    const container = docker.getContainer(containerId);
    await container.remove({ force: true });

    logger.success(`Container supprimé: ${containerId}`);

    return {
      content: [{
        type: 'text',
        text: `🗑️  Container "${containerId}" supprimé avec succès`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la suppression', error);
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
 * Tool: container_logs
 * Récupère les logs d'un container
 */
export async function containerLogs(args: z.infer<typeof ContainerLogsSchema>): Promise<ToolResult> {
  try {
    const { containerId, tail } = args;

    logger.info(`Récupération logs: ${containerId} (tail=${tail})`);

    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true
    });

    const logsStr = logs.toString('utf8');

    return {
      content: [{
        type: 'text',
        text: `📜 Logs de "${containerId}" (${tail} dernières lignes):\n\n${logsStr || '(vide)'}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des logs', error);
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
 * Tool: container_stats
 * Récupère les stats CPU/RAM d'un container
 */
export async function containerStats(args: z.infer<typeof ContainerStatsSchema>): Promise<ToolResult> {
  try {
    const { containerId } = args;

    logger.info(`Récupération stats: ${containerId}`);

    const container = docker.getContainer(containerId);
    const stats: any = await container.stats({ stream: false });

    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100 : 0;

    const memUsage = stats.memory_stats.usage || 0;
    const memLimit = stats.memory_stats.limit || 1;
    const memPercent = (memUsage / memLimit) * 100;

    const netInput = stats.networks?.eth0?.rx_bytes || 0;
    const netOutput = stats.networks?.eth0?.tx_bytes || 0;

    return {
      content: [{
        type: 'text',
        text: `📊 Stats de "${containerId}":\n\n` +
              `CPU: ${cpuPercent.toFixed(2)}%\n` +
              `Mémoire: ${(memUsage / 1024 / 1024).toFixed(2)} MB / ${(memLimit / 1024 / 1024).toFixed(2)} MB (${memPercent.toFixed(2)}%)\n` +
              `Réseau IN: ${(netInput / 1024 / 1024).toFixed(2)} MB\n` +
              `Réseau OUT: ${(netOutput / 1024 / 1024).toFixed(2)} MB`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des stats', error);
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
 * Tool: list_images
 * Liste les images Docker
 */
export async function listImages(args: z.infer<typeof ListImagesSchema>): Promise<ToolResult> {
  try {
    const { all } = args;

    logger.info(`Liste des images (all=${all})`);

    const images = await docker.listImages({ all });

    if (images.length === 0) {
      return {
        content: [{
          type: 'text',
          text: '📦 Aucune image Docker trouvée'
        }]
      };
    }

    const formatted = images.map(img => {
      const tags = img.RepoTags || ['<none>'];
      const size = (img.Size / 1024 / 1024).toFixed(2);

      return `🖼️  ${tags.join(', ')}\n` +
             `   ID: ${img.Id.substring(7, 19)}\n` +
             `   Size: ${size} MB\n` +
             `   Created: ${new Date(img.Created * 1000).toLocaleString()}`;
    }).join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `🖼️  Images Docker (${images.length}):\n\n${formatted}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la liste des images', error);
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
 * Tool: pull_image
 * Télécharge une image Docker
 */
export async function pullImage(args: z.infer<typeof PullImageSchema>): Promise<ToolResult> {
  try {
    const { image } = args;

    logger.info(`Pull de l'image: ${image}`);

    return new Promise((resolve) => {
      docker.pull(image, (err: any, stream: any) => {
        if (err) {
          logger.error('Erreur lors du pull', err);
          resolve({
            content: [{
              type: 'text',
              text: `❌ Erreur: ${err.message}`
            }],
            isError: true
          });
          return;
        }

        const chunks: string[] = [];

        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk.toString());
        });

        stream.on('end', () => {
          logger.success(`Image pullée: ${image}`);
          resolve({
            content: [{
              type: 'text',
              text: `✅ Image "${image}" téléchargée avec succès`
            }]
          });
        });

        stream.on('error', (streamErr: Error) => {
          logger.error('Erreur stream', streamErr);
          resolve({
            content: [{
              type: 'text',
              text: `❌ Erreur: ${streamErr.message}`
            }],
            isError: true
          });
        });
      });
    });
  } catch (error: any) {
    logger.error('Erreur lors du pull', error);
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
 * Tool: create_container
 * Crée un nouveau container
 */
export async function createContainer(args: z.infer<typeof CreateContainerSchema>): Promise<ToolResult> {
  try {
    const { name, image, ports, env, volumes, command } = args;

    logger.info(`Création container: ${name || 'sans nom'} (image: ${image})`);

    const exposedPorts: any = {};
    const portBindings: any = {};

    if (ports) {
      for (const [containerPort, hostPort] of Object.entries(ports)) {
        exposedPorts[containerPort] = {};
        portBindings[containerPort] = [{ HostPort: hostPort }];
      }
    }

    const binds: string[] = [];
    if (volumes) {
      for (const [containerPath, hostPath] of Object.entries(volumes)) {
        binds.push(`${hostPath}:${containerPath}`);
      }
    }

    const container = await docker.createContainer({
      name,
      Image: image,
      Env: env,
      Cmd: command,
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        Binds: binds
      }
    });

    logger.success(`Container créé: ${container.id}`);

    return {
      content: [{
        type: 'text',
        text: `✅ Container créé avec succès!\n\n` +
              `ID: ${container.id}\n` +
              `Image: ${image}\n` +
              `${name ? `Nom: ${name}\n` : ''}` +
              `\nPour démarrer: start_container avec ID ${container.id.substring(0, 12)}`
      }]
    };
  } catch (error: any) {
    logger.error('Erreur lors de la création', error);
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
 * Export des tools pour le serveur MCP
 */
export const dockerAdminTools = {
  list_containers: {
    description: 'Liste tous les containers Docker (actifs ou tous)',
    inputSchema: ListContainersSchema,
    handler: listContainers
  },
  start_container: {
    description: 'Démarre un container Docker',
    inputSchema: ContainerActionSchema,
    handler: startContainer
  },
  stop_container: {
    description: 'Arrête un container Docker',
    inputSchema: ContainerActionSchema,
    handler: stopContainer
  },
  restart_container: {
    description: 'Redémarre un container Docker',
    inputSchema: ContainerActionSchema,
    handler: restartContainer
  },
  remove_container: {
    description: 'Supprime un container Docker',
    inputSchema: ContainerActionSchema,
    handler: removeContainer
  },
  container_logs: {
    description: 'Récupère les logs d\'un container Docker',
    inputSchema: ContainerLogsSchema,
    handler: containerLogs
  },
  container_stats: {
    description: 'Affiche les statistiques CPU/RAM d\'un container',
    inputSchema: ContainerStatsSchema,
    handler: containerStats
  },
  list_images: {
    description: 'Liste toutes les images Docker disponibles',
    inputSchema: ListImagesSchema,
    handler: listImages
  },
  pull_image: {
    description: 'Télécharge une image Docker depuis Docker Hub',
    inputSchema: PullImageSchema,
    handler: pullImage
  },
  create_container: {
    description: 'Crée un nouveau container Docker à partir d\'une image',
    inputSchema: CreateContainerSchema,
    handler: createContainer
  }
};
