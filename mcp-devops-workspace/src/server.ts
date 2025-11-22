import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { formatError } from './utils/errors.js';
import {
  CreateProjectSchema,
  SetupPythonEnvSchema,
  SetupNodeEnvSchema,
  InstallDependenciesSchema,
  ListContainersSchema,
  ContainerActionSchema,
  ContainerLogsSchema,
  DockerComposeSchema,
  ServiceActionSchema,
  CheckPortSchema,
  ProcessListSchema,
  ListDirectorySchema,
  ReadFileSchema,
  WriteFileSchema,
  DeleteFileSchema,
  GitActionSchema,
  ResizeImageSchema,
  ConvertImageSchema,
  CompressImageSchema,
  ImageInfoSchema,
  ComposeImagesSchema,
} from './types/schemas.js';

// Import tools
import {
  createProject,
  setupPythonEnv,
  setupNodeEnv,
  installDependencies,
  listEnvironments,
} from './tools/dev-env.js';

import {
  listContainers,
  getContainerStatus,
  getContainerLogs,
  startContainer,
  stopContainer,
  restartContainer,
  listImages,
  listVolumes,
  dockerComposeUp,
  dockerComposeDown,
  getDockerStats,
} from './tools/docker-admin.js';

import {
  getSystemInfo,
  getResourceUsage,
  listServices,
  getServiceStatus,
  restartService,
  getProcessList,
  checkPort,
  getGPUInfo,
} from './tools/server-admin.js';

import {
  listDirectory,
  readFile,
  writeFile,
  deleteFile,
  gitInit,
  gitStatus,
  gitAdd,
  gitCommit,
  gitBranch,
  gitCheckout,
  gitPull,
  gitPush,
  gitLog,
} from './tools/project-ops.js';

import {
  resizeImage,
  convertImage,
  compressImage,
  getImageInfo,
  createThumbnail,
  composeImages,
} from './tools/graphics.js';

/**
 * Définition de tous les tools MCP
 */
const TOOLS: Tool[] = [
  // ===== DEV ENV =====
  {
    name: 'create_project',
    description: 'Crée une structure de projet (Python, Node, Go, Rust, générique) avec dossiers, README, .gitignore, et git init optionnel',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nom du projet' },
        path: { type: 'string', description: 'Chemin de base (optionnel, défaut: cwd)' },
        language: { type: 'string', enum: ['python', 'node', 'go', 'rust', 'generic'], description: 'Langage du projet' },
        initGit: { type: 'boolean', default: true, description: 'Initialiser git ?' },
        createReadme: { type: 'boolean', default: true, description: 'Créer README.md ?' },
      },
      required: ['name', 'language'],
    },
  },
  {
    name: 'setup_python_env',
    description: 'Configure un environnement Python (virtualenv) et installe les dépendances depuis requirements.txt si fourni',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Chemin du projet' },
        pythonVersion: { type: 'string', description: 'Version Python (ex: 3.11)' },
        requirements: { type: 'string', description: 'Chemin vers requirements.txt' },
        venvName: { type: 'string', default: '.venv', description: 'Nom du virtualenv' },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'setup_node_env',
    description: 'Configure un environnement Node.js (npm/yarn/pnpm) et initialise package.json si demandé',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Chemin du projet' },
        packageManager: { type: 'string', enum: ['npm', 'yarn', 'pnpm'], default: 'npm', description: 'Package manager' },
        initPackageJson: { type: 'boolean', default: true, description: 'Initialiser package.json ?' },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'install_dependencies',
    description: 'Installe les dépendances d\'un projet (requirements.txt pour Python, package.json pour Node)',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Chemin du projet' },
        language: { type: 'string', enum: ['python', 'node'], description: 'Langage du projet' },
        dependenciesFile: { type: 'string', description: 'Fichier de dépendances (optionnel)' },
      },
      required: ['projectPath', 'language'],
    },
  },
  {
    name: 'list_environments',
    description: 'Liste les environnements de développement (venv Python, node_modules) présents dans un projet',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Chemin du projet' },
      },
      required: ['projectPath'],
    },
  },

  // ===== DOCKER ADMIN =====
  {
    name: 'docker_list_containers',
    description: 'Liste les containers Docker (running ou all)',
    inputSchema: {
      type: 'object',
      properties: {
        all: { type: 'boolean', default: false, description: 'Lister tous les containers (y compris stopped) ?' },
        filters: { type: 'object', description: 'Filtres Docker (optionnel)' },
      },
    },
  },
  {
    name: 'docker_container_status',
    description: 'Récupère le statut détaillé d\'un container Docker',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: { type: 'string', description: 'ID ou nom du container' },
      },
      required: ['containerId'],
    },
  },
  {
    name: 'docker_container_logs',
    description: 'Récupère les logs d\'un container Docker',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: { type: 'string', description: 'ID ou nom du container' },
        tail: { type: 'number', default: 100, description: 'Nombre de lignes à récupérer' },
        since: { type: 'string', description: 'Timestamp depuis (optionnel)' },
        follow: { type: 'boolean', default: false, description: 'Suivre les logs en temps réel ?' },
      },
      required: ['containerId'],
    },
  },
  {
    name: 'docker_start_container',
    description: 'Démarre un container Docker',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: { type: 'string', description: 'ID ou nom du container' },
      },
      required: ['containerId'],
    },
  },
  {
    name: 'docker_stop_container',
    description: 'Arrête un container Docker',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: { type: 'string', description: 'ID ou nom du container' },
      },
      required: ['containerId'],
    },
  },
  {
    name: 'docker_restart_container',
    description: 'Redémarre un container Docker',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: { type: 'string', description: 'ID ou nom du container' },
      },
      required: ['containerId'],
    },
  },
  {
    name: 'docker_list_images',
    description: 'Liste les images Docker disponibles localement',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'docker_list_volumes',
    description: 'Liste les volumes Docker',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'docker_compose_up',
    description: 'Lance une stack Docker Compose',
    inputSchema: {
      type: 'object',
      properties: {
        composePath: { type: 'string', description: 'Chemin vers docker-compose.yml' },
        projectName: { type: 'string', description: 'Nom du projet Compose (optionnel)' },
        detached: { type: 'boolean', default: true, description: 'Lancer en détaché (-d) ?' },
      },
      required: ['composePath'],
    },
  },
  {
    name: 'docker_compose_down',
    description: 'Arrête une stack Docker Compose',
    inputSchema: {
      type: 'object',
      properties: {
        composePath: { type: 'string', description: 'Chemin vers docker-compose.yml' },
        projectName: { type: 'string', description: 'Nom du projet Compose (optionnel)' },
      },
      required: ['composePath'],
    },
  },
  {
    name: 'docker_stats',
    description: 'Récupère les stats temps réel (CPU, RAM, I/O) de tous les containers Docker',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ===== SERVER ADMIN =====
  {
    name: 'get_system_info',
    description: 'Récupère les informations système (OS, CPU, RAM, disque, réseau, uptime)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_resource_usage',
    description: 'Récupère l\'utilisation actuelle des ressources (CPU%, RAM%, disque%, processus)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_services',
    description: 'Liste les services systemd disponibles',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'service_status',
    description: 'Récupère le statut d\'un service systemd',
    inputSchema: {
      type: 'object',
      properties: {
        serviceName: { type: 'string', description: 'Nom du service (ex: nginx, docker)' },
      },
      required: ['serviceName'],
    },
  },
  {
    name: 'restart_service',
    description: 'Redémarre un service systemd (ATTENTION : nécessite confirmation explicite)',
    inputSchema: {
      type: 'object',
      properties: {
        serviceName: { type: 'string', description: 'Nom du service' },
        confirm: { type: 'boolean', description: 'Confirmation explicite (requis pour exécution)' },
      },
      required: ['serviceName', 'confirm'],
    },
  },
  {
    name: 'get_process_list',
    description: 'Liste les processus en cours (top processes par CPU ou RAM)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 10, description: 'Nombre de processus à afficher' },
        sortBy: { type: 'string', enum: ['cpu', 'memory', 'pid'], default: 'cpu', description: 'Trier par' },
      },
    },
  },
  {
    name: 'check_port',
    description: 'Vérifie si un port est ouvert sur un hôte',
    inputSchema: {
      type: 'object',
      properties: {
        port: { type: 'number', description: 'Numéro de port (1-65535)' },
        host: { type: 'string', default: 'localhost', description: 'Hôte à vérifier' },
      },
      required: ['port'],
    },
  },
  {
    name: 'get_gpu_info',
    description: 'Récupère les informations GPU (nvidia-smi si disponible)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ===== PROJECT OPS =====
  {
    name: 'list_directory',
    description: 'Liste le contenu d\'un répertoire (avec infos: taille, type, permissions, date)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Chemin du répertoire' },
        recursive: { type: 'boolean', default: false, description: 'Récursif ?' },
        showHidden: { type: 'boolean', default: false, description: 'Afficher fichiers cachés ?' },
      },
      required: ['path'],
    },
  },
  {
    name: 'read_file',
    description: 'Lit le contenu d\'un fichier texte (max 10MB)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Chemin du fichier' },
        encoding: { type: 'string', default: 'utf-8', description: 'Encodage' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Écrit ou modifie un fichier (avec backup automatique optionnel)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Chemin du fichier' },
        content: { type: 'string', description: 'Contenu à écrire' },
        createBackup: { type: 'boolean', default: true, description: 'Créer backup si fichier existe ?' },
        mode: { type: 'string', description: 'Permissions fichier (ex: "0644")' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'delete_file',
    description: 'Supprime un fichier (ATTENTION : nécessite confirmation explicite)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Chemin du fichier' },
        confirm: { type: 'boolean', description: 'Confirmation explicite (requis)' },
      },
      required: ['path', 'confirm'],
    },
  },
  {
    name: 'git_init',
    description: 'Initialise un dépôt Git dans un répertoire',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Chemin du répertoire' },
      },
      required: ['repoPath'],
    },
  },
  {
    name: 'git_status',
    description: 'Récupère le statut Git d\'un dépôt (branch, staged, modified, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Chemin du dépôt' },
      },
      required: ['repoPath'],
    },
  },
  {
    name: 'git_add',
    description: 'Stage des fichiers pour un commit Git',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Chemin du dépôt' },
        files: { type: 'array', items: { type: 'string' }, description: 'Fichiers à ajouter (défaut: .)' },
      },
      required: ['repoPath'],
    },
  },
  {
    name: 'git_commit',
    description: 'Crée un commit Git',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Chemin du dépôt' },
        message: { type: 'string', description: 'Message de commit' },
      },
      required: ['repoPath', 'message'],
    },
  },
  {
    name: 'git_branch',
    description: 'Liste les branches Git ou crée une nouvelle branche',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Chemin du dépôt' },
        branch: { type: 'string', description: 'Nom de la branche à créer (optionnel)' },
      },
      required: ['repoPath'],
    },
  },
  {
    name: 'git_checkout',
    description: 'Change de branche Git',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Chemin du dépôt' },
        branch: { type: 'string', description: 'Nom de la branche' },
      },
      required: ['repoPath', 'branch'],
    },
  },
  {
    name: 'git_pull',
    description: 'Pull depuis un remote Git',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Chemin du dépôt' },
        remote: { type: 'string', default: 'origin', description: 'Remote' },
        branch: { type: 'string', default: 'main', description: 'Branche' },
      },
      required: ['repoPath'],
    },
  },
  {
    name: 'git_push',
    description: 'Push vers un remote Git',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Chemin du dépôt' },
        remote: { type: 'string', default: 'origin', description: 'Remote' },
        branch: { type: 'string', default: 'main', description: 'Branche' },
      },
      required: ['repoPath'],
    },
  },
  {
    name: 'git_log',
    description: 'Affiche l\'historique Git (20 derniers commits)',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Chemin du dépôt' },
      },
      required: ['repoPath'],
    },
  },

  // ===== GRAPHICS =====
  {
    name: 'resize_image',
    description: 'Redimensionne une image',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Chemin image source' },
        outputPath: { type: 'string', description: 'Chemin image destination (optionnel)' },
        width: { type: 'number', description: 'Largeur (optionnel)' },
        height: { type: 'number', description: 'Hauteur (optionnel)' },
        fit: { type: 'string', enum: ['cover', 'contain', 'fill', 'inside', 'outside'], default: 'cover', description: 'Mode de fit' },
      },
      required: ['inputPath'],
    },
  },
  {
    name: 'convert_image',
    description: 'Convertit une image dans un autre format',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Chemin image source' },
        outputPath: { type: 'string', description: 'Chemin image destination' },
        format: { type: 'string', enum: ['jpeg', 'png', 'webp', 'avif', 'tiff'], description: 'Format de destination' },
        quality: { type: 'number', default: 80, description: 'Qualité (1-100)' },
      },
      required: ['inputPath', 'outputPath', 'format'],
    },
  },
  {
    name: 'compress_image',
    description: 'Compresse une image pour réduire sa taille',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Chemin image source' },
        outputPath: { type: 'string', description: 'Chemin image destination (optionnel)' },
        quality: { type: 'number', default: 70, description: 'Qualité de compression (1-100)' },
      },
      required: ['inputPath'],
    },
  },
  {
    name: 'get_image_info',
    description: 'Récupère les métadonnées d\'une image (dimensions, format, taille, EXIF)',
    inputSchema: {
      type: 'object',
      properties: {
        imagePath: { type: 'string', description: 'Chemin de l\'image' },
      },
      required: ['imagePath'],
    },
  },
  {
    name: 'create_thumbnail',
    description: 'Crée une miniature d\'une image (200x200 par défaut)',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Chemin image source' },
        outputPath: { type: 'string', description: 'Chemin miniature (optionnel)' },
        width: { type: 'number', default: 200, description: 'Largeur miniature' },
        height: { type: 'number', default: 200, description: 'Hauteur miniature' },
      },
      required: ['inputPath'],
    },
  },
  {
    name: 'compose_images',
    description: 'Compose deux images (watermark, overlay)',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string', description: 'Image de base' },
        overlayPath: { type: 'string', description: 'Image à superposer' },
        outputPath: { type: 'string', description: 'Chemin image résultat' },
        position: { type: 'string', enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'], default: 'center', description: 'Position overlay' },
        opacity: { type: 'number', default: 1, description: 'Opacité overlay (0-1)' },
      },
      required: ['basePath', 'overlayPath', 'outputPath'],
    },
  },
];

/**
 * Crée et configure le serveur MCP
 */
export function createMCPServer() {
  const server = new Server(
    {
      name: 'mcp-devops-workspace',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handler pour lister les tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handler pour appeler un tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: any;

      // Router les appels vers les bonnes fonctions
      switch (name) {
        // DEV ENV
        case 'create_project':
          result = await createProject(CreateProjectSchema.parse(args));
          break;
        case 'setup_python_env':
          result = await setupPythonEnv(SetupPythonEnvSchema.parse(args));
          break;
        case 'setup_node_env':
          result = await setupNodeEnv(SetupNodeEnvSchema.parse(args));
          break;
        case 'install_dependencies':
          result = await installDependencies(InstallDependenciesSchema.parse(args));
          break;
        case 'list_environments':
          result = await listEnvironments((args as any).projectPath);
          break;

        // DOCKER ADMIN
        case 'docker_list_containers':
          result = await listContainers(ListContainersSchema.parse(args));
          break;
        case 'docker_container_status':
          result = await getContainerStatus(ContainerActionSchema.parse(args));
          break;
        case 'docker_container_logs':
          result = await getContainerLogs(ContainerLogsSchema.parse(args));
          break;
        case 'docker_start_container':
          result = await startContainer(ContainerActionSchema.parse(args));
          break;
        case 'docker_stop_container':
          result = await stopContainer(ContainerActionSchema.parse(args));
          break;
        case 'docker_restart_container':
          result = await restartContainer(ContainerActionSchema.parse(args));
          break;
        case 'docker_list_images':
          result = await listImages();
          break;
        case 'docker_list_volumes':
          result = await listVolumes();
          break;
        case 'docker_compose_up':
          result = await dockerComposeUp(DockerComposeSchema.parse(args));
          break;
        case 'docker_compose_down':
          result = await dockerComposeDown(DockerComposeSchema.parse(args));
          break;
        case 'docker_stats':
          result = await getDockerStats();
          break;

        // SERVER ADMIN
        case 'get_system_info':
          result = await getSystemInfo();
          break;
        case 'get_resource_usage':
          result = await getResourceUsage();
          break;
        case 'list_services':
          result = await listServices();
          break;
        case 'service_status':
          result = await getServiceStatus(ServiceActionSchema.parse(args));
          break;
        case 'restart_service':
          result = await restartService(ServiceActionSchema.parse(args));
          break;
        case 'get_process_list':
          result = await getProcessList(ProcessListSchema.parse(args));
          break;
        case 'check_port':
          result = await checkPort(CheckPortSchema.parse(args));
          break;
        case 'get_gpu_info':
          result = await getGPUInfo();
          break;

        // PROJECT OPS
        case 'list_directory':
          result = await listDirectory(ListDirectorySchema.parse(args));
          break;
        case 'read_file':
          result = await readFile(ReadFileSchema.parse(args));
          break;
        case 'write_file':
          result = await writeFile(WriteFileSchema.parse(args));
          break;
        case 'delete_file':
          result = await deleteFile(DeleteFileSchema.parse(args));
          break;
        case 'git_init':
          result = await gitInit(GitActionSchema.parse(args));
          break;
        case 'git_status':
          result = await gitStatus(GitActionSchema.parse(args));
          break;
        case 'git_add':
          result = await gitAdd(GitActionSchema.parse(args));
          break;
        case 'git_commit':
          result = await gitCommit(GitActionSchema.parse(args));
          break;
        case 'git_branch':
          result = await gitBranch(GitActionSchema.parse(args));
          break;
        case 'git_checkout':
          result = await gitCheckout(GitActionSchema.parse(args));
          break;
        case 'git_pull':
          result = await gitPull(GitActionSchema.parse(args));
          break;
        case 'git_push':
          result = await gitPush(GitActionSchema.parse(args));
          break;
        case 'git_log':
          result = await gitLog(GitActionSchema.parse(args));
          break;

        // GRAPHICS
        case 'resize_image':
          result = await resizeImage(ResizeImageSchema.parse(args));
          break;
        case 'convert_image':
          result = await convertImage(ConvertImageSchema.parse(args));
          break;
        case 'compress_image':
          result = await compressImage(CompressImageSchema.parse(args));
          break;
        case 'get_image_info':
          result = await getImageInfo(ImageInfoSchema.parse(args));
          break;
        case 'create_thumbnail':
          result = await createThumbnail(ResizeImageSchema.parse(args));
          break;
        case 'compose_images':
          result = await composeImages(ComposeImagesSchema.parse(args));
          break;

        default:
          throw new Error(`Tool inconnu : ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return formatError(error);
    }
  });

  return server;
}

/**
 * Lance le serveur MCP
 */
export async function runServer() {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MCP DevOps Workspace Server démarré');
}
