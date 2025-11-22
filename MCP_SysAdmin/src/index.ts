#!/usr/bin/env node
/**
 * 🚀 MCP SysAdmin Server
 * Serveur MCP complet pour l'administration système Linux
 * Conçu pour Claude Code CLI
 *
 * @author Skynet Depot
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';

// Import des outils de gestion de paquets
import * as PackageTools from './tools/package-tools.js';
// Import des outils Docker
import * as DockerTools from './tools/docker-tools.js';
// Import des outils d'environnement de dev
import * as DevEnvTools from './tools/devenv-tools.js';
// Import des outils système
import * as SystemTools from './tools/system-tools.js';
// Import des outils média
import * as MediaTools from './tools/media-tools.js';

// Import utilitaires
import { getSystemInfo, checkPrivileges } from './utils.js';

/**
 * Création du serveur MCP
 */
const server = new Server(
  {
    name: 'mcp-sysadmin',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Définition de tous les outils disponibles
 */
const tools = [
  // ==================== GESTION DE PAQUETS ====================
  {
    name: 'apt_install',
    description: '📦 Installer des paquets via APT (Debian/Ubuntu)',
    inputSchema: PackageTools.aptInstallSchema,
    handler: PackageTools.aptInstall,
  },
  {
    name: 'apt_search',
    description: '🔍 Rechercher des paquets APT',
    inputSchema: PackageTools.aptSearchSchema,
    handler: PackageTools.aptSearch,
  },
  {
    name: 'apt_remove',
    description: '🗑️  Supprimer des paquets APT',
    inputSchema: PackageTools.aptRemoveSchema,
    handler: PackageTools.aptRemove,
  },
  {
    name: 'apt_update',
    description: '🔄 Mettre à jour la liste des paquets APT',
    inputSchema: { type: 'object', properties: {} },
    handler: PackageTools.aptUpdate,
  },
  {
    name: 'apt_upgrade',
    description: '⬆️  Mettre à jour tous les paquets installés',
    inputSchema: { type: 'object', properties: {} },
    handler: PackageTools.aptUpgrade,
  },
  {
    name: 'apt_list_installed',
    description: '📋 Lister les paquets APT installés',
    inputSchema: { type: 'object', properties: {} },
    handler: PackageTools.aptListInstalled,
  },
  {
    name: 'npm_install',
    description: '📦 Installer des paquets NPM',
    inputSchema: PackageTools.npmInstallSchema,
    handler: PackageTools.npmInstall,
  },
  {
    name: 'npm_list',
    description: '📋 Lister les paquets NPM',
    inputSchema: PackageTools.npmListSchema,
    handler: PackageTools.npmList,
  },
  {
    name: 'pip_install',
    description: '🐍 Installer des paquets Python (pip)',
    inputSchema: PackageTools.pipInstallSchema,
    handler: PackageTools.pipInstall,
  },
  {
    name: 'pip_list',
    description: '📋 Lister les paquets Python installés',
    inputSchema: { type: 'object', properties: {} },
    handler: PackageTools.pipList,
  },
  {
    name: 'cargo_install',
    description: '🦀 Installer des crates Rust (cargo)',
    inputSchema: PackageTools.cargoInstallSchema,
    handler: PackageTools.cargoInstall,
  },
  {
    name: 'go_install',
    description: '🔷 Installer des paquets Go',
    inputSchema: PackageTools.goInstallSchema,
    handler: PackageTools.goInstall,
  },
  {
    name: 'snap_install',
    description: '📦 Installer des Snaps',
    inputSchema: PackageTools.snapInstallSchema,
    handler: PackageTools.snapInstall,
  },
  {
    name: 'snap_list',
    description: '📋 Lister les Snaps installés',
    inputSchema: { type: 'object', properties: {} },
    handler: PackageTools.snapList,
  },
  {
    name: 'flatpak_install',
    description: '📦 Installer des applications Flatpak',
    inputSchema: PackageTools.flatpakInstallSchema,
    handler: PackageTools.flatpakInstall,
  },
  {
    name: 'flatpak_list',
    description: '📋 Lister les Flatpaks installés',
    inputSchema: { type: 'object', properties: {} },
    handler: PackageTools.flatpakList,
  },

  // ==================== DOCKER ====================
  {
    name: 'docker_ps',
    description: '🐳 Lister les containers Docker',
    inputSchema: { type: 'object', properties: {} },
    handler: DockerTools.dockerPsList,
  },
  {
    name: 'docker_start',
    description: '▶️  Démarrer des containers Docker',
    inputSchema: DockerTools.dockerStartSchema,
    handler: DockerTools.dockerStart,
  },
  {
    name: 'docker_stop',
    description: '⏹️  Arrêter des containers Docker',
    inputSchema: DockerTools.dockerStopSchema,
    handler: DockerTools.dockerStop,
  },
  {
    name: 'docker_restart',
    description: '🔄 Redémarrer des containers Docker',
    inputSchema: DockerTools.dockerRestartSchema,
    handler: DockerTools.dockerRestart,
  },
  {
    name: 'docker_logs',
    description: '📜 Voir les logs d\'un container Docker',
    inputSchema: DockerTools.dockerLogsSchema,
    handler: DockerTools.dockerLogs,
  },
  {
    name: 'docker_exec',
    description: '⚡ Exécuter une commande dans un container',
    inputSchema: DockerTools.dockerExecSchema,
    handler: DockerTools.dockerExec,
  },
  {
    name: 'docker_stats',
    description: '📊 Statistiques des containers Docker',
    inputSchema: DockerTools.dockerStatsSchema,
    handler: DockerTools.dockerStats,
  },
  {
    name: 'docker_remove',
    description: '🗑️  Supprimer des containers Docker',
    inputSchema: DockerTools.dockerRemoveSchema,
    handler: DockerTools.dockerRemove,
  },
  {
    name: 'docker_inspect',
    description: '🔍 Inspecter un container Docker',
    inputSchema: DockerTools.dockerInspectSchema,
    handler: DockerTools.dockerInspect,
  },
  {
    name: 'docker_images',
    description: '🖼️  Lister les images Docker',
    inputSchema: { type: 'object', properties: {} },
    handler: DockerTools.dockerImagesList,
  },
  {
    name: 'docker_pull',
    description: '⬇️  Télécharger une image Docker',
    inputSchema: DockerTools.dockerPullSchema,
    handler: DockerTools.dockerPull,
  },
  {
    name: 'docker_build',
    description: '🏗️  Construire une image Docker',
    inputSchema: DockerTools.dockerBuildSchema,
    handler: DockerTools.dockerBuild,
  },
  {
    name: 'docker_rmi',
    description: '🗑️  Supprimer des images Docker',
    inputSchema: DockerTools.dockerRmiSchema,
    handler: DockerTools.dockerRmi,
  },
  {
    name: 'docker_tag',
    description: '🏷️  Tagger une image Docker',
    inputSchema: DockerTools.dockerTagSchema,
    handler: DockerTools.dockerTag,
  },
  {
    name: 'docker_network_list',
    description: '🌐 Lister les réseaux Docker',
    inputSchema: { type: 'object', properties: {} },
    handler: DockerTools.dockerNetworkList,
  },
  {
    name: 'docker_network_create',
    description: '➕ Créer un réseau Docker',
    inputSchema: DockerTools.dockerNetworkCreateSchema,
    handler: DockerTools.dockerNetworkCreate,
  },
  {
    name: 'docker_network_remove',
    description: '🗑️  Supprimer des réseaux Docker',
    inputSchema: DockerTools.dockerNetworkRemoveSchema,
    handler: DockerTools.dockerNetworkRemove,
  },
  {
    name: 'docker_volume_list',
    description: '💾 Lister les volumes Docker',
    inputSchema: { type: 'object', properties: {} },
    handler: DockerTools.dockerVolumeList,
  },
  {
    name: 'docker_volume_create',
    description: '➕ Créer un volume Docker',
    inputSchema: DockerTools.dockerVolumeCreateSchema,
    handler: DockerTools.dockerVolumeCreate,
  },
  {
    name: 'docker_volume_remove',
    description: '🗑️  Supprimer des volumes Docker',
    inputSchema: DockerTools.dockerVolumeRemoveSchema,
    handler: DockerTools.dockerVolumeRemove,
  },
  {
    name: 'docker_compose_up',
    description: '🚀 Démarrer Docker Compose',
    inputSchema: DockerTools.dockerComposeUpSchema,
    handler: DockerTools.dockerComposeUp,
  },
  {
    name: 'docker_compose_down',
    description: '⏬ Arrêter Docker Compose',
    inputSchema: DockerTools.dockerComposeDownSchema,
    handler: DockerTools.dockerComposeDown,
  },
  {
    name: 'docker_compose_logs',
    description: '📜 Logs Docker Compose',
    inputSchema: DockerTools.dockerComposeLogsSchema,
    handler: DockerTools.dockerComposeLogs,
  },
  {
    name: 'docker_compose_ps',
    description: '📋 Status Docker Compose',
    inputSchema: DockerTools.dockerComposePsSchema,
    handler: DockerTools.dockerComposePs,
  },
  {
    name: 'docker_system_info',
    description: 'ℹ️  Informations système Docker',
    inputSchema: { type: 'object', properties: {} },
    handler: DockerTools.dockerSystemInfo,
  },
  {
    name: 'docker_system_df',
    description: '💽 Utilisation disque Docker',
    inputSchema: { type: 'object', properties: {} },
    handler: DockerTools.dockerSystemDf,
  },
  {
    name: 'docker_system_prune',
    description: '🧹 Nettoyer le système Docker',
    inputSchema: DockerTools.dockerSystemPruneSchema,
    handler: DockerTools.dockerSystemPrune,
  },

  // ==================== ENVIRONNEMENTS DE DEV ====================
  {
    name: 'install_node',
    description: '💚 Installer Node.js et NPM',
    inputSchema: DevEnvTools.installNodeSchema,
    handler: DevEnvTools.installNode,
  },
  {
    name: 'node_version',
    description: '📌 Version de Node.js et NPM',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.nodeVersion,
  },
  {
    name: 'install_python',
    description: '🐍 Installer Python',
    inputSchema: DevEnvTools.installPythonSchema,
    handler: DevEnvTools.installPython,
  },
  {
    name: 'python_version',
    description: '📌 Version de Python et pip',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.pythonVersion,
  },
  {
    name: 'create_venv',
    description: '🔧 Créer un virtualenv Python',
    inputSchema: DevEnvTools.createVenvSchema,
    handler: DevEnvTools.createVenv,
  },
  {
    name: 'install_go',
    description: '🔷 Installer Go',
    inputSchema: DevEnvTools.installGoSchema,
    handler: DevEnvTools.installGo,
  },
  {
    name: 'go_version',
    description: '📌 Version de Go',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.goVersion,
  },
  {
    name: 'install_rust',
    description: '🦀 Installer Rust et Cargo',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.installRust,
  },
  {
    name: 'rust_version',
    description: '📌 Version de Rust et Cargo',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.rustVersion,
  },
  {
    name: 'install_java',
    description: '☕ Installer Java JDK',
    inputSchema: DevEnvTools.installJavaSchema,
    handler: DevEnvTools.installJava,
  },
  {
    name: 'java_version',
    description: '📌 Version de Java',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.javaVersion,
  },
  {
    name: 'install_php',
    description: '🐘 Installer PHP',
    inputSchema: DevEnvTools.installPhpSchema,
    handler: DevEnvTools.installPhp,
  },
  {
    name: 'php_version',
    description: '📌 Version de PHP',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.phpVersion,
  },
  {
    name: 'install_postgres',
    description: '🐘 Installer PostgreSQL',
    inputSchema: DevEnvTools.installPostgresSchema,
    handler: DevEnvTools.installPostgres,
  },
  {
    name: 'install_mysql',
    description: '🐬 Installer MySQL',
    inputSchema: DevEnvTools.installMysqlSchema,
    handler: DevEnvTools.installMysql,
  },
  {
    name: 'install_mongodb',
    description: '🍃 Installer MongoDB',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.installMongodb,
  },
  {
    name: 'install_redis',
    description: '🔴 Installer Redis',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.installRedis,
  },
  {
    name: 'install_vscode',
    description: '💻 Installer Visual Studio Code',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.installVscode,
  },
  {
    name: 'install_neovim',
    description: '📝 Installer Neovim',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.installNeovim,
  },
  {
    name: 'configure_git',
    description: '🔧 Configurer Git (user.name et user.email)',
    inputSchema: DevEnvTools.configureGitSchema,
    handler: DevEnvTools.configureGit,
  },
  {
    name: 'install_git_tools',
    description: '🛠️  Installer Git, Git LFS et GitHub CLI',
    inputSchema: { type: 'object', properties: {} },
    handler: DevEnvTools.installGitTools,
  },

  // ==================== SYSTÈME ====================
  {
    name: 'systemd_status',
    description: '🔍 Voir le status d\'un service systemd',
    inputSchema: SystemTools.systemdStatusSchema,
    handler: SystemTools.systemdStatus,
  },
  {
    name: 'systemd_start',
    description: '▶️  Démarrer des services systemd',
    inputSchema: SystemTools.systemdStartSchema,
    handler: SystemTools.systemdStart,
  },
  {
    name: 'systemd_stop',
    description: '⏹️  Arrêter des services systemd',
    inputSchema: SystemTools.systemdStopSchema,
    handler: SystemTools.systemdStop,
  },
  {
    name: 'systemd_restart',
    description: '🔄 Redémarrer des services systemd',
    inputSchema: SystemTools.systemdRestartSchema,
    handler: SystemTools.systemdRestart,
  },
  {
    name: 'systemd_enable',
    description: '✅ Activer des services au démarrage',
    inputSchema: SystemTools.systemdEnableSchema,
    handler: SystemTools.systemdEnable,
  },
  {
    name: 'systemd_disable',
    description: '❌ Désactiver des services au démarrage',
    inputSchema: SystemTools.systemdDisableSchema,
    handler: SystemTools.systemdDisable,
  },
  {
    name: 'systemd_list',
    description: '📋 Lister tous les services systemd',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.systemdListServices,
  },
  {
    name: 'systemd_logs',
    description: '📜 Voir les logs d\'un service (journalctl)',
    inputSchema: SystemTools.systemdLogsSchema,
    handler: SystemTools.systemdLogs,
  },
  {
    name: 'process_list',
    description: '📋 Lister les processus actifs',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.processList,
  },
  {
    name: 'kill_process',
    description: '☠️  Tuer un processus',
    inputSchema: SystemTools.killProcessSchema,
    handler: SystemTools.killProcess,
  },
  {
    name: 'find_process',
    description: '🔍 Rechercher des processus par nom',
    inputSchema: SystemTools.findProcessSchema,
    handler: SystemTools.findProcess,
  },
  {
    name: 'system_resources',
    description: '📊 Ressources système (CPU, RAM, Disque)',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.systemResources,
  },
  {
    name: 'disk_usage',
    description: '💽 Utilisation disque (df)',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.diskUsage,
  },
  {
    name: 'memory_usage',
    description: '🧠 Utilisation mémoire (free)',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.memoryUsage,
  },
  {
    name: 'cpu_info',
    description: '🖥️  Informations CPU',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.cpuInfo,
  },
  {
    name: 'top_processes',
    description: '🔝 Top processus (par CPU ou mémoire)',
    inputSchema: SystemTools.topProcessesSchema,
    handler: SystemTools.topProcesses,
  },
  {
    name: 'create_user',
    description: '👤 Créer un utilisateur',
    inputSchema: SystemTools.createUserSchema,
    handler: SystemTools.createUser,
  },
  {
    name: 'delete_user',
    description: '🗑️  Supprimer un utilisateur',
    inputSchema: SystemTools.deleteUserSchema,
    handler: SystemTools.deleteUser,
  },
  {
    name: 'add_to_group',
    description: '👥 Ajouter un utilisateur à des groupes',
    inputSchema: SystemTools.addToGroupSchema,
    handler: SystemTools.addToGroup,
  },
  {
    name: 'list_users',
    description: '📋 Lister les utilisateurs système',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.listUsers,
  },
  {
    name: 'chmod',
    description: '🔒 Changer les permissions (chmod)',
    inputSchema: SystemTools.chmodSchema,
    handler: SystemTools.chmod,
  },
  {
    name: 'chown',
    description: '👤 Changer le propriétaire (chown)',
    inputSchema: SystemTools.chownSchema,
    handler: SystemTools.chown,
  },
  {
    name: 'network_interfaces',
    description: '🌐 Lister les interfaces réseau',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.networkInterfaces,
  },
  {
    name: 'network_connections',
    description: '🔌 Connexions réseau actives',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.networkConnections,
  },
  {
    name: 'ping',
    description: '🏓 Ping un host',
    inputSchema: SystemTools.pingSchema,
    handler: SystemTools.ping,
  },
  {
    name: 'ufw_status',
    description: '🛡️  Status du firewall UFW',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.ufwStatus,
  },
  {
    name: 'ufw_allow',
    description: '✅ Autoriser un port (UFW)',
    inputSchema: SystemTools.ufwAllowSchema,
    handler: SystemTools.ufwAllow,
  },
  {
    name: 'ufw_deny',
    description: '❌ Bloquer un port (UFW)',
    inputSchema: SystemTools.ufwDenySchema,
    handler: SystemTools.ufwDeny,
  },
  {
    name: 'ufw_enable',
    description: '🛡️  Activer le firewall UFW',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.ufwEnable,
  },
  {
    name: 'ufw_disable',
    description: '⚠️  Désactiver le firewall UFW',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.ufwDisable,
  },
  {
    name: 'view_logs',
    description: '📜 Voir un fichier de log',
    inputSchema: SystemTools.viewLogsSchema,
    handler: SystemTools.viewLogs,
  },
  {
    name: 'journalctl_recent',
    description: '📰 Logs système récents (journalctl)',
    inputSchema: { type: 'object', properties: {} },
    handler: SystemTools.journalctlRecent,
  },

  // ==================== GRAPHISME & MULTIMÉDIA ====================
  {
    name: 'image_convert',
    description: '🖼️  Convertir une image (ImageMagick)',
    inputSchema: MediaTools.imageConvertSchema,
    handler: MediaTools.imageConvert,
  },
  {
    name: 'image_resize',
    description: '📐 Redimensionner une image',
    inputSchema: MediaTools.imageResizeSchema,
    handler: MediaTools.imageResize,
  },
  {
    name: 'image_crop',
    description: '✂️  Rogner une image',
    inputSchema: MediaTools.imageCropSchema,
    handler: MediaTools.imageCrop,
  },
  {
    name: 'image_rotate',
    description: '🔄 Rotation d\'image',
    inputSchema: MediaTools.imageRotateSchema,
    handler: MediaTools.imageRotate,
  },
  {
    name: 'image_effect',
    description: '✨ Appliquer un effet à une image',
    inputSchema: MediaTools.imageEffectSchema,
    handler: MediaTools.imageEffect,
  },
  {
    name: 'image_info',
    description: 'ℹ️  Informations sur une image',
    inputSchema: MediaTools.imageInfoSchema,
    handler: MediaTools.imageInfo,
  },
  {
    name: 'video_convert',
    description: '🎬 Convertir une vidéo (FFmpeg)',
    inputSchema: MediaTools.videoConvertSchema,
    handler: MediaTools.videoConvert,
  },
  {
    name: 'extract_audio',
    description: '🎵 Extraire l\'audio d\'une vidéo',
    inputSchema: MediaTools.extractAudioSchema,
    handler: MediaTools.extractAudio,
  },
  {
    name: 'video_resize',
    description: '📐 Redimensionner une vidéo',
    inputSchema: MediaTools.videoResizeSchema,
    handler: MediaTools.videoResize,
  },
  {
    name: 'video_trim',
    description: '✂️  Couper une vidéo',
    inputSchema: MediaTools.videoTrimSchema,
    handler: MediaTools.videoTrim,
  },
  {
    name: 'video_info',
    description: 'ℹ️  Informations sur une vidéo',
    inputSchema: MediaTools.videoInfoSchema,
    handler: MediaTools.videoInfo,
  },
  {
    name: 'figlet',
    description: '🎨 Créer du texte ASCII art (figlet)',
    inputSchema: MediaTools.figletSchema,
    handler: MediaTools.figlet,
  },
  {
    name: 'qrcode',
    description: '📱 Générer un QR code',
    inputSchema: MediaTools.qrcodeSchema,
    handler: MediaTools.qrcode,
  },
  {
    name: 'install_imagemagick',
    description: '📦 Installer ImageMagick',
    inputSchema: { type: 'object', properties: {} },
    handler: MediaTools.installImageMagick,
  },
  {
    name: 'install_ffmpeg',
    description: '📦 Installer FFmpeg',
    inputSchema: { type: 'object', properties: {} },
    handler: MediaTools.installFfmpeg,
  },
  {
    name: 'install_media_tools',
    description: '📦 Installer tous les outils média',
    inputSchema: { type: 'object', properties: {} },
    handler: MediaTools.installMediaTools,
  },
];

/**
 * Convertit un schéma Zod en JSON Schema pour MCP
 */
function zodToJsonSchema(schema: any): any {
  // Si c'est déjà un objet JSON simple, le retourner tel quel
  if (schema.type && schema.properties) {
    return schema;
  }

  // Si c'est un schéma Zod, utiliser une conversion basique
  if (schema._def) {
    return {
      type: 'object',
      properties: {},
    };
  }

  return {
    type: 'object',
    properties: {},
  };
}

/**
 * Handler pour lister les outils disponibles
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    })),
  };
});

/**
 * Handler pour appeler un outil
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Outil inconnu: ${toolName}`);
  }

  try {
    // Valider les arguments avec le schema Zod si disponible
    let validatedArgs = request.params.arguments || {};

    if (tool.inputSchema && typeof tool.inputSchema === 'object' && 'parse' in tool.inputSchema) {
      validatedArgs = tool.inputSchema.parse(request.params.arguments);
    }

    // Exécuter l'outil
    const result = await tool.handler(validatedArgs as any);

    return {
      content: [
        {
          type: 'text',
          text: String(result),
        },
      ],
    };
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Erreur lors de l'exécution de ${toolName}:\n${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Démarrage du serveur
 */
async function main() {
  // Afficher les informations système au démarrage
  const sysInfo = await getSystemInfo();
  const privileges = await checkPrivileges();

  console.error('🚀 MCP SysAdmin Server v1.0.0');
  console.error('================================');
  console.error(`📍 Hostname: ${sysInfo.hostname}`);
  console.error(`🐧 Distro: ${sysInfo.distro}`);
  console.error(`🔧 Kernel: ${sysInfo.kernel}`);
  console.error(`⏱️  Uptime: ${sysInfo.uptime}`);
  console.error(`👤 Root: ${privileges.isRoot ? '✅' : '❌'}`);
  console.error(`🔐 Sudo: ${privileges.hasSudo ? '✅' : '❌'}`);
  console.error(`🛠️  ${tools.length} outils disponibles`);
  console.error('================================\n');

  // Démarrer le transport stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('✅ Serveur MCP démarré et prêt!\n');
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
