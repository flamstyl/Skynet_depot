/**
 * ⚙️ Outils d'administration système
 * Systemd, processus, utilisateurs, permissions, monitoring
 */

import { z } from 'zod';
import { executeCommand, formatOutput } from '../utils.js';

// ==================== SYSTEMD ====================

export const systemdStatusSchema = z.object({
  service: z.string().describe('Nom du service'),
});

export async function systemdStatus(args: z.infer<typeof systemdStatusSchema>) {
  const result = await executeCommand(`systemctl status ${args.service}`);
  return formatOutput(result);
}

export const systemdStartSchema = z.object({
  services: z.array(z.string()).describe('Services à démarrer'),
});

export async function systemdStart(args: z.infer<typeof systemdStartSchema>) {
  const result = await executeCommand(`sudo systemctl start ${args.services.join(' ')}`);
  return formatOutput(result);
}

export const systemdStopSchema = z.object({
  services: z.array(z.string()).describe('Services à arrêter'),
});

export async function systemdStop(args: z.infer<typeof systemdStopSchema>) {
  const result = await executeCommand(`sudo systemctl stop ${args.services.join(' ')}`);
  return formatOutput(result);
}

export const systemdRestartSchema = z.object({
  services: z.array(z.string()).describe('Services à redémarrer'),
});

export async function systemdRestart(args: z.infer<typeof systemdRestartSchema>) {
  const result = await executeCommand(`sudo systemctl restart ${args.services.join(' ')}`);
  return formatOutput(result);
}

export const systemdEnableSchema = z.object({
  services: z.array(z.string()).describe('Services à activer au démarrage'),
});

export async function systemdEnable(args: z.infer<typeof systemdEnableSchema>) {
  const result = await executeCommand(`sudo systemctl enable ${args.services.join(' ')}`);
  return formatOutput(result);
}

export const systemdDisableSchema = z.object({
  services: z.array(z.string()).describe('Services à désactiver'),
});

export async function systemdDisable(args: z.infer<typeof systemdDisableSchema>) {
  const result = await executeCommand(`sudo systemctl disable ${args.services.join(' ')}`);
  return formatOutput(result);
}

export async function systemdListServices() {
  const result = await executeCommand('systemctl list-units --type=service --all');
  return formatOutput(result);
}

export const systemdLogsSchema = z.object({
  service: z.string().describe('Service dont voir les logs'),
  lines: z.number().optional().describe('Nombre de lignes (défaut: 100)'),
  follow: z.boolean().optional().describe('Suivre les logs'),
});

export async function systemdLogs(args: z.infer<typeof systemdLogsSchema>) {
  const { service, lines = 100, follow = false } = args;
  const followFlag = follow ? '-f' : '';
  const result = await executeCommand(`sudo journalctl -u ${service} -n ${lines} ${followFlag}`, {
    timeout: follow ? 60000 : 30000,
  });
  return formatOutput(result);
}

// ==================== PROCESSUS ====================

export async function processList() {
  const result = await executeCommand('ps aux --sort=-%mem | head -20');
  return formatOutput(result);
}

export const killProcessSchema = z.object({
  pid: z.number().describe('PID du processus à tuer'),
  signal: z.string().optional().describe('Signal (défaut: TERM)'),
});

export async function killProcess(args: z.infer<typeof killProcessSchema>) {
  const { pid, signal = 'TERM' } = args;
  const result = await executeCommand(`sudo kill -${signal} ${pid}`);
  return formatOutput(result);
}

export const findProcessSchema = z.object({
  name: z.string().describe('Nom du processus à chercher'),
});

export async function findProcess(args: z.infer<typeof findProcessSchema>) {
  const result = await executeCommand(`ps aux | grep -i "${args.name}" | grep -v grep`);
  return formatOutput(result);
}

// ==================== MONITORING SYSTÈME ====================

export async function systemResources() {
  const cpu = await executeCommand('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1"%"}\'');
  const mem = await executeCommand('free -h | grep Mem | awk \'{print $3 "/" $2}\'');
  const disk = await executeCommand('df -h / | tail -1 | awk \'{print $3 "/" $2 " (" $5 ")"}\'');
  const uptime = await executeCommand('uptime -p');

  return `🖥️  Ressources Système:
CPU: ${cpu.stdout}
RAM: ${mem.stdout}
Disque: ${disk.stdout}
Uptime: ${uptime.stdout}`;
}

export async function diskUsage() {
  const result = await executeCommand('df -h');
  return formatOutput(result);
}

export async function memoryUsage() {
  const result = await executeCommand('free -h');
  return formatOutput(result);
}

export async function cpuInfo() {
  const result = await executeCommand('lscpu');
  return formatOutput(result);
}

export const topProcessesSchema = z.object({
  count: z.number().optional().describe('Nombre de processus à afficher (défaut: 10)'),
  sortBy: z.enum(['cpu', 'mem']).optional().describe('Trier par CPU ou mémoire'),
});

export async function topProcesses(args: z.infer<typeof topProcessesSchema>) {
  const { count = 10, sortBy = 'mem' } = args;
  const sortFlag = sortBy === 'cpu' ? '-%cpu' : '-%mem';
  const result = await executeCommand(`ps aux --sort=${sortFlag} | head -${count + 1}`);
  return formatOutput(result);
}

// ==================== UTILISATEURS & GROUPES ====================

export const createUserSchema = z.object({
  username: z.string().describe('Nom d\'utilisateur'),
  createHome: z.boolean().optional().describe('Créer le home directory'),
  shell: z.string().optional().describe('Shell par défaut (ex: /bin/bash)'),
});

export async function createUser(args: z.infer<typeof createUserSchema>) {
  const { username, createHome = true, shell = '/bin/bash' } = args;

  const homeFlag = createHome ? '-m' : '';
  const result = await executeCommand(
    `sudo useradd ${homeFlag} -s ${shell} ${username}`
  );
  return formatOutput(result);
}

export const deleteUserSchema = z.object({
  username: z.string().describe('Utilisateur à supprimer'),
  removeHome: z.boolean().optional().describe('Supprimer le home directory'),
});

export async function deleteUser(args: z.infer<typeof deleteUserSchema>) {
  const { username, removeHome = false } = args;
  const flag = removeHome ? '-r' : '';
  const result = await executeCommand(`sudo userdel ${flag} ${username}`);
  return formatOutput(result);
}

export const addToGroupSchema = z.object({
  username: z.string().describe('Utilisateur'),
  groups: z.array(z.string()).describe('Groupes à ajouter'),
});

export async function addToGroup(args: z.infer<typeof addToGroupSchema>) {
  const { username, groups } = args;
  const result = await executeCommand(`sudo usermod -aG ${groups.join(',')} ${username}`);
  return formatOutput(result);
}

export async function listUsers() {
  const result = await executeCommand('cat /etc/passwd | cut -d: -f1,3,6 | grep -v "nologin"');
  return formatOutput(result);
}

// ==================== PERMISSIONS ====================

export const chmodSchema = z.object({
  path: z.string().describe('Fichier ou dossier'),
  mode: z.string().describe('Permissions (ex: 755, u+x)'),
  recursive: z.boolean().optional().describe('Récursif'),
});

export async function chmod(args: z.infer<typeof chmodSchema>) {
  const { path, mode, recursive = false } = args;
  const rFlag = recursive ? '-R' : '';
  const result = await executeCommand(`sudo chmod ${rFlag} ${mode} ${path}`);
  return formatOutput(result);
}

export const chownSchema = z.object({
  path: z.string().describe('Fichier ou dossier'),
  owner: z.string().describe('Propriétaire (user:group)'),
  recursive: z.boolean().optional().describe('Récursif'),
});

export async function chown(args: z.infer<typeof chownSchema>) {
  const { path, owner, recursive = false } = args;
  const rFlag = recursive ? '-R' : '';
  const result = await executeCommand(`sudo chown ${rFlag} ${owner} ${path}`);
  return formatOutput(result);
}

// ==================== RÉSEAU ====================

export async function networkInterfaces() {
  const result = await executeCommand('ip addr show');
  return formatOutput(result);
}

export async function networkConnections() {
  const result = await executeCommand('ss -tuln');
  return formatOutput(result);
}

export const pingSchema = z.object({
  host: z.string().describe('Host à pinger'),
  count: z.number().optional().describe('Nombre de pings (défaut: 4)'),
});

export async function ping(args: z.infer<typeof pingSchema>) {
  const { host, count = 4 } = args;
  const result = await executeCommand(`ping -c ${count} ${host}`);
  return formatOutput(result);
}

// ==================== FIREWALL (UFW) ====================

export async function ufwStatus() {
  const result = await executeCommand('sudo ufw status verbose');
  return formatOutput(result);
}

export const ufwAllowSchema = z.object({
  port: z.union([z.number(), z.string()]).describe('Port ou service (ex: 80, ssh)'),
  protocol: z.enum(['tcp', 'udp', 'any']).optional().describe('Protocole'),
});

export async function ufwAllow(args: z.infer<typeof ufwAllowSchema>) {
  const { port, protocol } = args;
  const proto = protocol ? `/${protocol}` : '';
  const result = await executeCommand(`sudo ufw allow ${port}${proto}`);
  return formatOutput(result);
}

export const ufwDenySchema = z.object({
  port: z.union([z.number(), z.string()]).describe('Port à bloquer'),
});

export async function ufwDeny(args: z.infer<typeof ufwDenySchema>) {
  const result = await executeCommand(`sudo ufw deny ${args.port}`);
  return formatOutput(result);
}

export async function ufwEnable() {
  const result = await executeCommand('sudo ufw --force enable');
  return formatOutput(result);
}

export async function ufwDisable() {
  const result = await executeCommand('sudo ufw disable');
  return formatOutput(result);
}

// ==================== LOGS SYSTÈME ====================

export const viewLogsSchema = z.object({
  logFile: z.string().describe('Fichier de log à consulter'),
  lines: z.number().optional().describe('Nombre de lignes (défaut: 50)'),
  follow: z.boolean().optional().describe('Suivre le fichier'),
});

export async function viewLogs(args: z.infer<typeof viewLogsSchema>) {
  const { logFile, lines = 50, follow = false } = args;
  const cmd = follow ? `tail -f -n ${lines} ${logFile}` : `tail -n ${lines} ${logFile}`;
  const result = await executeCommand(`sudo ${cmd}`, {
    timeout: follow ? 60000 : 30000,
  });
  return formatOutput(result);
}

export async function journalctlRecent() {
  const result = await executeCommand('sudo journalctl -n 50 --no-pager');
  return formatOutput(result);
}
