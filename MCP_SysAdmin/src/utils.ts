/**
 * 🔧 Utilitaires pour le serveur MCP SysAdmin
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

/**
 * Exécute une commande shell et retourne le résultat
 */
export async function executeCommand(
  command: string,
  options: { timeout?: number; cwd?: string } = {}
): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: options.timeout || 30000,
      cwd: options.cwd || process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
      success: true,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString().trim() || '',
      stderr: error.stderr?.toString().trim() || error.message,
      exitCode: error.code || 1,
      success: false,
    };
  }
}

/**
 * Vérifie si une commande existe sur le système
 */
export async function commandExists(command: string): Promise<boolean> {
  const result = await executeCommand(`which ${command}`);
  return result.success;
}

/**
 * Formate la sortie d'une commande pour l'affichage
 */
export function formatOutput(result: CommandResult): string {
  if (result.success) {
    return result.stdout || '✅ Commande exécutée avec succès';
  } else {
    return `❌ Erreur (code ${result.exitCode}):\n${result.stderr}`;
  }
}

/**
 * Extrait les informations système
 */
export async function getSystemInfo() {
  const [hostname, kernel, distro, uptime] = await Promise.all([
    executeCommand('hostname'),
    executeCommand('uname -r'),
    executeCommand('cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\''),
    executeCommand('uptime -p'),
  ]);

  return {
    hostname: hostname.stdout,
    kernel: kernel.stdout,
    distro: distro.stdout,
    uptime: uptime.stdout,
  };
}

/**
 * Vérifie si l'utilisateur est root ou a sudo
 */
export async function checkPrivileges(): Promise<{
  isRoot: boolean;
  hasSudo: boolean;
}> {
  const uid = await executeCommand('id -u');
  const isRoot = uid.stdout === '0';

  const sudoCheck = await executeCommand('sudo -n true 2>&1');
  const hasSudo = sudoCheck.success;

  return { isRoot, hasSudo };
}
