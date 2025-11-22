/**
 * 💻 Outils d'installation d'environnements de développement
 * Node.js, Python, Go, Rust, Java, PHP, bases de données, etc.
 */

import { z } from 'zod';
import { executeCommand, formatOutput } from '../utils.js';

// ==================== NODE.JS ====================

export const installNodeSchema = z.object({
  version: z.string().optional().describe('Version de Node.js (ex: 20, lts, latest)'),
  useNvm: z.boolean().optional().describe('Utiliser NVM (défaut: true)'),
});

export async function installNode(args: z.infer<typeof installNodeSchema>) {
  const { version = 'lts', useNvm = true } = args;

  if (useNvm) {
    const commands = [
      // Installer NVM si pas déjà installé
      'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash',
      'export NVM_DIR="$HOME/.nvm"',
      '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"',
      `nvm install ${version}`,
      `nvm use ${version}`,
    ];
    const result = await executeCommand(commands.join(' && '), { timeout: 300000 });
    return formatOutput(result);
  } else {
    // Installation via apt
    const commands = [
      'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -',
      'sudo apt-get install -y nodejs',
    ];
    const result = await executeCommand(commands.join(' && '), { timeout: 300000 });
    return formatOutput(result);
  }
}

export async function nodeVersion() {
  const node = await executeCommand('node --version');
  const npm = await executeCommand('npm --version');
  return `Node: ${node.stdout}\nNPM: ${npm.stdout}`;
}

// ==================== PYTHON ====================

export const installPythonSchema = z.object({
  version: z.string().optional().describe('Version Python (ex: 3.11, 3.12)'),
  pipTools: z.boolean().optional().describe('Installer pip, venv, etc.'),
});

export async function installPython(args: z.infer<typeof installPythonSchema>) {
  const { version = '3', pipTools = true } = args;

  const packages = [`python${version}`, `python${version}-dev`];
  if (pipTools) {
    packages.push(`python${version}-pip`, `python${version}-venv`);
  }

  const result = await executeCommand(
    `sudo apt-get update && sudo apt-get install -y ${packages.join(' ')}`,
    { timeout: 300000 }
  );
  return formatOutput(result);
}

export async function pythonVersion() {
  const python = await executeCommand('python3 --version');
  const pip = await executeCommand('pip3 --version');
  return `${python.stdout}\n${pip.stdout}`;
}

export const createVenvSchema = z.object({
  path: z.string().describe('Chemin du virtualenv à créer'),
  python: z.string().optional().describe('Version Python (défaut: python3)'),
});

export async function createVenv(args: z.infer<typeof createVenvSchema>) {
  const { path, python = 'python3' } = args;
  const result = await executeCommand(`${python} -m venv ${path}`);
  return formatOutput(result);
}

// ==================== GO ====================

export const installGoSchema = z.object({
  version: z.string().optional().describe('Version Go (ex: 1.21.5)'),
});

export async function installGo(args: z.infer<typeof installGoSchema>) {
  const { version = '1.22.0' } = args;

  const commands = [
    `wget https://go.dev/dl/go${version}.linux-amd64.tar.gz`,
    'sudo rm -rf /usr/local/go',
    `sudo tar -C /usr/local -xzf go${version}.linux-amd64.tar.gz`,
    `rm go${version}.linux-amd64.tar.gz`,
    'echo "export PATH=$PATH:/usr/local/go/bin" >> ~/.bashrc',
  ];

  const result = await executeCommand(commands.join(' && '), { timeout: 300000 });
  return formatOutput(result);
}

export async function goVersion() {
  const result = await executeCommand('go version');
  return formatOutput(result);
}

// ==================== RUST ====================

export async function installRust() {
  const commands = [
    'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y',
    'source $HOME/.cargo/env',
  ];

  const result = await executeCommand(commands.join(' && '), { timeout: 300000 });
  return formatOutput(result);
}

export async function rustVersion() {
  const rustc = await executeCommand('rustc --version');
  const cargo = await executeCommand('cargo --version');
  return `${rustc.stdout}\n${cargo.stdout}`;
}

// ==================== JAVA ====================

export const installJavaSchema = z.object({
  version: z.string().optional().describe('Version JDK (8, 11, 17, 21)'),
  jdk: z.string().optional().describe('Distribution JDK (openjdk, temurin)'),
});

export async function installJava(args: z.infer<typeof installJavaSchema>) {
  const { version = '17', jdk = 'openjdk' } = args;

  const package_name = `${jdk}-${version}-jdk`;
  const result = await executeCommand(
    `sudo apt-get update && sudo apt-get install -y ${package_name}`,
    { timeout: 300000 }
  );
  return formatOutput(result);
}

export async function javaVersion() {
  const result = await executeCommand('java -version 2>&1');
  return formatOutput(result);
}

// ==================== PHP ====================

export const installPhpSchema = z.object({
  version: z.string().optional().describe('Version PHP (8.1, 8.2, 8.3)'),
  extensions: z.array(z.string()).optional().describe('Extensions PHP à installer'),
});

export async function installPhp(args: z.infer<typeof installPhpSchema>) {
  const { version = '8.2', extensions = ['cli', 'common', 'mysql', 'curl'] } = args;

  const packages = [`php${version}`].concat(
    extensions.map((ext) => `php${version}-${ext}`)
  );

  const result = await executeCommand(
    `sudo apt-get update && sudo apt-get install -y ${packages.join(' ')}`,
    { timeout: 300000 }
  );
  return formatOutput(result);
}

export async function phpVersion() {
  const result = await executeCommand('php --version');
  return formatOutput(result);
}

// ==================== BASES DE DONNÉES ====================

export const installPostgresSchema = z.object({
  version: z.string().optional().describe('Version PostgreSQL (défaut: latest)'),
  createUser: z.boolean().optional().describe('Créer un utilisateur postgres'),
});

export async function installPostgres(args: z.infer<typeof installPostgresSchema>) {
  const { version = '', createUser = false } = args;

  const package_name = version ? `postgresql-${version}` : 'postgresql postgresql-contrib';

  let commands = [
    'sudo apt-get update',
    `sudo apt-get install -y ${package_name}`,
    'sudo systemctl enable postgresql',
    'sudo systemctl start postgresql',
  ];

  if (createUser) {
    commands.push('sudo -u postgres createuser -s $USER');
  }

  const result = await executeCommand(commands.join(' && '), { timeout: 300000 });
  return formatOutput(result);
}

export const installMysqlSchema = z.object({
  server: z.boolean().optional().describe('Installer le serveur (défaut: true)'),
});

export async function installMysql(args: z.infer<typeof installMysqlSchema>) {
  const { server = true } = args;

  const package_name = server ? 'mysql-server' : 'mysql-client';

  const commands = [
    'sudo apt-get update',
    `sudo apt-get install -y ${package_name}`,
  ];

  if (server) {
    commands.push('sudo systemctl enable mysql', 'sudo systemctl start mysql');
  }

  const result = await executeCommand(commands.join(' && '), { timeout: 300000 });
  return formatOutput(result);
}

export async function installMongodb() {
  const commands = [
    'curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor',
    'echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list',
    'sudo apt-get update',
    'sudo apt-get install -y mongodb-org',
    'sudo systemctl enable mongod',
    'sudo systemctl start mongod',
  ];

  const result = await executeCommand(commands.join(' && '), { timeout: 300000 });
  return formatOutput(result);
}

export async function installRedis() {
  const commands = [
    'sudo apt-get update',
    'sudo apt-get install -y redis-server',
    'sudo systemctl enable redis-server',
    'sudo systemctl start redis-server',
  ];

  const result = await executeCommand(commands.join(' && '), { timeout: 300000 });
  return formatOutput(result);
}

// ==================== ÉDITEURS & IDE ====================

export async function installVscode() {
  const commands = [
    'wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg',
    'sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg',
    'sudo sh -c \'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list\'',
    'rm -f packages.microsoft.gpg',
    'sudo apt-get update',
    'sudo apt-get install -y code',
  ];

  const result = await executeCommand(commands.join(' && '), { timeout: 300000 });
  return formatOutput(result);
}

export async function installNeovim() {
  const commands = [
    'sudo apt-get update',
    'sudo apt-get install -y neovim',
  ];

  const result = await executeCommand(commands.join(' && '), { timeout: 180000 });
  return formatOutput(result);
}

// ==================== GIT ====================

export const configureGitSchema = z.object({
  name: z.string().describe('Nom d\'utilisateur Git'),
  email: z.string().describe('Email Git'),
});

export async function configureGit(args: z.infer<typeof configureGitSchema>) {
  const { name, email } = args;

  const commands = [
    `git config --global user.name "${name}"`,
    `git config --global user.email "${email}"`,
  ];

  const result = await executeCommand(commands.join(' && '));
  return formatOutput(result);
}

export async function installGitTools() {
  const commands = [
    'sudo apt-get update',
    'sudo apt-get install -y git git-lfs gh',
  ];

  const result = await executeCommand(commands.join(' && '), { timeout: 180000 });
  return formatOutput(result);
}
