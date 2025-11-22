/**
 * 🐳 Outils d'administration Docker
 * Containers, Images, Networks, Volumes, Docker Compose
 */

import { z } from 'zod';
import { executeCommand, formatOutput } from '../utils.js';

// ==================== CONTAINERS ====================

export async function dockerPsList() {
  const result = await executeCommand('docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Image}}"');
  return formatOutput(result);
}

export const dockerStartSchema = z.object({
  containers: z.array(z.string()).describe('IDs ou noms des containers à démarrer'),
});

export async function dockerStart(args: z.infer<typeof dockerStartSchema>) {
  const result = await executeCommand(`docker start ${args.containers.join(' ')}`);
  return formatOutput(result);
}

export const dockerStopSchema = z.object({
  containers: z.array(z.string()).describe('Containers à arrêter'),
});

export async function dockerStop(args: z.infer<typeof dockerStopSchema>) {
  const result = await executeCommand(`docker stop ${args.containers.join(' ')}`);
  return formatOutput(result);
}

export const dockerRestartSchema = z.object({
  containers: z.array(z.string()).describe('Containers à redémarrer'),
});

export async function dockerRestart(args: z.infer<typeof dockerRestartSchema>) {
  const result = await executeCommand(`docker restart ${args.containers.join(' ')}`);
  return formatOutput(result);
}

export const dockerLogsSchema = z.object({
  container: z.string().describe('Container dont afficher les logs'),
  tail: z.number().optional().describe('Nombre de lignes à afficher (défaut: 100)'),
  follow: z.boolean().optional().describe('Suivre les logs en temps réel'),
});

export async function dockerLogs(args: z.infer<typeof dockerLogsSchema>) {
  const { container, tail = 100, follow = false } = args;
  const followFlag = follow ? '-f' : '';
  const result = await executeCommand(`docker logs ${followFlag} --tail ${tail} ${container}`, {
    timeout: follow ? 60000 : 30000,
  });
  return formatOutput(result);
}

export const dockerExecSchema = z.object({
  container: z.string().describe('Container dans lequel exécuter'),
  command: z.string().describe('Commande à exécuter'),
  interactive: z.boolean().optional().describe('Mode interactif'),
});

export async function dockerExec(args: z.infer<typeof dockerExecSchema>) {
  const { container, command, interactive = false } = args;
  const itFlag = interactive ? '-it' : '';
  const result = await executeCommand(`docker exec ${itFlag} ${container} ${command}`);
  return formatOutput(result);
}

export const dockerStatsSchema = z.object({
  container: z.string().optional().describe('Container spécifique (optionnel)'),
  noStream: z.boolean().optional().describe('Ne pas streamer (défaut: true)'),
});

export async function dockerStats(args: z.infer<typeof dockerStatsSchema>) {
  const { container = '', noStream = true } = args;
  const noStreamFlag = noStream ? '--no-stream' : '';
  const result = await executeCommand(`docker stats ${noStreamFlag} ${container}`);
  return formatOutput(result);
}

export const dockerRemoveSchema = z.object({
  containers: z.array(z.string()).describe('Containers à supprimer'),
  force: z.boolean().optional().describe('Forcer la suppression'),
});

export async function dockerRemove(args: z.infer<typeof dockerRemoveSchema>) {
  const { containers, force = false } = args;
  const forceFlag = force ? '-f' : '';
  const result = await executeCommand(`docker rm ${forceFlag} ${containers.join(' ')}`);
  return formatOutput(result);
}

export const dockerInspectSchema = z.object({
  container: z.string().describe('Container à inspecter'),
});

export async function dockerInspect(args: z.infer<typeof dockerInspectSchema>) {
  const result = await executeCommand(`docker inspect ${args.container}`);
  return formatOutput(result);
}

// ==================== IMAGES ====================

export async function dockerImagesList() {
  const result = await executeCommand('docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.ID}}"');
  return formatOutput(result);
}

export const dockerPullSchema = z.object({
  image: z.string().describe('Image à télécharger (ex: nginx:latest)'),
});

export async function dockerPull(args: z.infer<typeof dockerPullSchema>) {
  const result = await executeCommand(`docker pull ${args.image}`, { timeout: 180000 });
  return formatOutput(result);
}

export const dockerBuildSchema = z.object({
  path: z.string().describe('Chemin du contexte de build'),
  tag: z.string().describe('Tag de l\'image (ex: myapp:1.0)'),
  dockerfile: z.string().optional().describe('Nom du Dockerfile (défaut: Dockerfile)'),
});

export async function dockerBuild(args: z.infer<typeof dockerBuildSchema>) {
  const { path, tag, dockerfile = 'Dockerfile' } = args;
  const result = await executeCommand(`docker build -t ${tag} -f ${dockerfile} ${path}`, {
    timeout: 300000,
  });
  return formatOutput(result);
}

export const dockerRmiSchema = z.object({
  images: z.array(z.string()).describe('Images à supprimer'),
  force: z.boolean().optional().describe('Forcer la suppression'),
});

export async function dockerRmi(args: z.infer<typeof dockerRmiSchema>) {
  const { images, force = false } = args;
  const forceFlag = force ? '-f' : '';
  const result = await executeCommand(`docker rmi ${forceFlag} ${images.join(' ')}`);
  return formatOutput(result);
}

export const dockerTagSchema = z.object({
  source: z.string().describe('Image source'),
  target: z.string().describe('Nouveau tag'),
});

export async function dockerTag(args: z.infer<typeof dockerTagSchema>) {
  const result = await executeCommand(`docker tag ${args.source} ${args.target}`);
  return formatOutput(result);
}

// ==================== NETWORKS ====================

export async function dockerNetworkList() {
  const result = await executeCommand('docker network ls');
  return formatOutput(result);
}

export const dockerNetworkCreateSchema = z.object({
  name: z.string().describe('Nom du réseau'),
  driver: z.string().optional().describe('Driver réseau (bridge, overlay, etc.)'),
});

export async function dockerNetworkCreate(args: z.infer<typeof dockerNetworkCreateSchema>) {
  const { name, driver = 'bridge' } = args;
  const result = await executeCommand(`docker network create --driver ${driver} ${name}`);
  return formatOutput(result);
}

export const dockerNetworkRemoveSchema = z.object({
  networks: z.array(z.string()).describe('Réseaux à supprimer'),
});

export async function dockerNetworkRemove(args: z.infer<typeof dockerNetworkRemoveSchema>) {
  const result = await executeCommand(`docker network rm ${args.networks.join(' ')}`);
  return formatOutput(result);
}

// ==================== VOLUMES ====================

export async function dockerVolumeList() {
  const result = await executeCommand('docker volume ls');
  return formatOutput(result);
}

export const dockerVolumeCreateSchema = z.object({
  name: z.string().describe('Nom du volume'),
});

export async function dockerVolumeCreate(args: z.infer<typeof dockerVolumeCreateSchema>) {
  const result = await executeCommand(`docker volume create ${args.name}`);
  return formatOutput(result);
}

export const dockerVolumeRemoveSchema = z.object({
  volumes: z.array(z.string()).describe('Volumes à supprimer'),
});

export async function dockerVolumeRemove(args: z.infer<typeof dockerVolumeRemoveSchema>) {
  const result = await executeCommand(`docker volume rm ${args.volumes.join(' ')}`);
  return formatOutput(result);
}

// ==================== DOCKER COMPOSE ====================

export const dockerComposeUpSchema = z.object({
  file: z.string().optional().describe('Fichier docker-compose (défaut: docker-compose.yml)'),
  detach: z.boolean().optional().describe('Mode détaché (défaut: true)'),
  build: z.boolean().optional().describe('Rebuilder les images'),
});

export async function dockerComposeUp(args: z.infer<typeof dockerComposeUpSchema>) {
  const { file = 'docker-compose.yml', detach = true, build = false } = args;
  const dFlag = detach ? '-d' : '';
  const buildFlag = build ? '--build' : '';
  const result = await executeCommand(`docker compose -f ${file} up ${dFlag} ${buildFlag}`, {
    timeout: 180000,
  });
  return formatOutput(result);
}

export const dockerComposeDownSchema = z.object({
  file: z.string().optional().describe('Fichier docker-compose'),
  volumes: z.boolean().optional().describe('Supprimer aussi les volumes'),
});

export async function dockerComposeDown(args: z.infer<typeof dockerComposeDownSchema>) {
  const { file = 'docker-compose.yml', volumes = false } = args;
  const vFlag = volumes ? '-v' : '';
  const result = await executeCommand(`docker compose -f ${file} down ${vFlag}`);
  return formatOutput(result);
}

export const dockerComposeLogsSchema = z.object({
  file: z.string().optional().describe('Fichier docker-compose'),
  service: z.string().optional().describe('Service spécifique'),
  tail: z.number().optional().describe('Nombre de lignes'),
});

export async function dockerComposeLogs(args: z.infer<typeof dockerComposeLogsSchema>) {
  const { file = 'docker-compose.yml', service = '', tail = 100 } = args;
  const result = await executeCommand(`docker compose -f ${file} logs --tail ${tail} ${service}`);
  return formatOutput(result);
}

export const dockerComposePsSchema = z.object({
  file: z.string().optional().describe('Fichier docker-compose'),
});

export async function dockerComposePs(args: z.infer<typeof dockerComposePsSchema>) {
  const { file = 'docker-compose.yml' } = args;
  const result = await executeCommand(`docker compose -f ${file} ps`);
  return formatOutput(result);
}

// ==================== SYSTEM ====================

export async function dockerSystemInfo() {
  const result = await executeCommand('docker system info');
  return formatOutput(result);
}

export async function dockerSystemDf() {
  const result = await executeCommand('docker system df -v');
  return formatOutput(result);
}

export const dockerSystemPruneSchema = z.object({
  all: z.boolean().optional().describe('Supprimer toutes les images non utilisées'),
  volumes: z.boolean().optional().describe('Supprimer aussi les volumes'),
});

export async function dockerSystemPrune(args: z.infer<typeof dockerSystemPruneSchema>) {
  const { all = false, volumes = false } = args;
  let flags = '';
  if (all) flags += ' -a';
  if (volumes) flags += ' --volumes';
  const result = await executeCommand(`docker system prune -f${flags}`);
  return formatOutput(result);
}
