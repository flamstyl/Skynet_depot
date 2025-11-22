/**
 * 📦 Outils de gestion de paquets système
 * APT, NPM, PIP, Cargo, Go, Snap, Flatpak, etc.
 */

import { z } from 'zod';
import { executeCommand, formatOutput, commandExists } from '../utils.js';

// ==================== APT ====================

export const aptInstallSchema = z.object({
  packages: z.array(z.string()).describe('Liste des paquets à installer'),
  update: z.boolean().optional().describe('Faire apt update avant (défaut: true)'),
  yes: z.boolean().optional().describe('Accepter automatiquement (défaut: true)'),
});

export async function aptInstall(args: z.infer<typeof aptInstallSchema>) {
  const { packages, update = true, yes = true } = args;

  let commands = [];
  if (update) {
    commands.push('sudo apt-get update');
  }

  const yesFlag = yes ? '-y' : '';
  commands.push(`sudo apt-get install ${yesFlag} ${packages.join(' ')}`);

  const result = await executeCommand(commands.join(' && '));
  return formatOutput(result);
}

export const aptSearchSchema = z.object({
  query: z.string().describe('Terme de recherche'),
});

export async function aptSearch(args: z.infer<typeof aptSearchSchema>) {
  const result = await executeCommand(`apt-cache search ${args.query}`);
  return formatOutput(result);
}

export const aptRemoveSchema = z.object({
  packages: z.array(z.string()).describe('Paquets à supprimer'),
  purge: z.boolean().optional().describe('Supprimer aussi les fichiers de config'),
});

export async function aptRemove(args: z.infer<typeof aptRemoveSchema>) {
  const { packages, purge = false } = args;
  const command = purge ? 'purge' : 'remove';
  const result = await executeCommand(`sudo apt-get ${command} -y ${packages.join(' ')}`);
  return formatOutput(result);
}

export async function aptUpdate() {
  const result = await executeCommand('sudo apt-get update');
  return formatOutput(result);
}

export async function aptUpgrade() {
  const result = await executeCommand('sudo apt-get upgrade -y');
  return formatOutput(result);
}

export async function aptListInstalled() {
  const result = await executeCommand('apt list --installed');
  return formatOutput(result);
}

// ==================== NPM ====================

export const npmInstallSchema = z.object({
  packages: z.array(z.string()).describe('Paquets npm à installer'),
  global: z.boolean().optional().describe('Installation globale'),
  dev: z.boolean().optional().describe('Installer comme dépendance de dev'),
});

export async function npmInstall(args: z.infer<typeof npmInstallSchema>) {
  const { packages, global = false, dev = false } = args;

  let flags = '';
  if (global) flags += ' -g';
  if (dev) flags += ' -D';

  const result = await executeCommand(`npm install${flags} ${packages.join(' ')}`);
  return formatOutput(result);
}

export const npmListSchema = z.object({
  global: z.boolean().optional().describe('Lister les paquets globaux'),
});

export async function npmList(args: z.infer<typeof npmListSchema>) {
  const { global = false } = args;
  const flag = global ? '-g' : '';
  const result = await executeCommand(`npm list ${flag} --depth=0`);
  return formatOutput(result);
}

// ==================== PIP ====================

export const pipInstallSchema = z.object({
  packages: z.array(z.string()).describe('Paquets Python à installer'),
  python3: z.boolean().optional().describe('Utiliser pip3 (défaut: true)'),
  user: z.boolean().optional().describe('Installation utilisateur (--user)'),
});

export async function pipInstall(args: z.infer<typeof pipInstallSchema>) {
  const { packages, python3 = true, user = false } = args;

  const pip = python3 ? 'pip3' : 'pip';
  const userFlag = user ? '--user' : '';

  const result = await executeCommand(`${pip} install ${userFlag} ${packages.join(' ')}`);
  return formatOutput(result);
}

export async function pipList() {
  const result = await executeCommand('pip3 list');
  return formatOutput(result);
}

// ==================== CARGO (Rust) ====================

export const cargoInstallSchema = z.object({
  packages: z.array(z.string()).describe('Crates Rust à installer'),
});

export async function cargoInstall(args: z.infer<typeof cargoInstallSchema>) {
  const result = await executeCommand(`cargo install ${args.packages.join(' ')}`);
  return formatOutput(result);
}

// ==================== GO ====================

export const goInstallSchema = z.object({
  packages: z.array(z.string()).describe('Paquets Go à installer (URLs complètes)'),
});

export async function goInstall(args: z.infer<typeof goInstallSchema>) {
  const result = await executeCommand(`go install ${args.packages.join(' ')}`);
  return formatOutput(result);
}

// ==================== SNAP ====================

export const snapInstallSchema = z.object({
  packages: z.array(z.string()).describe('Snaps à installer'),
  classic: z.boolean().optional().describe('Installer en mode classic'),
});

export async function snapInstall(args: z.infer<typeof snapInstallSchema>) {
  const { packages, classic = false } = args;
  const flag = classic ? '--classic' : '';
  const result = await executeCommand(`sudo snap install ${flag} ${packages.join(' ')}`);
  return formatOutput(result);
}

export async function snapList() {
  const result = await executeCommand('snap list');
  return formatOutput(result);
}

// ==================== FLATPAK ====================

export const flatpakInstallSchema = z.object({
  packages: z.array(z.string()).describe('Applications Flatpak à installer'),
  remote: z.string().optional().describe('Remote (défaut: flathub)'),
});

export async function flatpakInstall(args: z.infer<typeof flatpakInstallSchema>) {
  const { packages, remote = 'flathub' } = args;
  const result = await executeCommand(`flatpak install -y ${remote} ${packages.join(' ')}`);
  return formatOutput(result);
}

export async function flatpakList() {
  const result = await executeCommand('flatpak list');
  return formatOutput(result);
}
