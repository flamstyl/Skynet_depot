import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from './lib/logger.js';
import { formatError } from './lib/errors.js';

// Import all tools
import * as tools from './tools/index.js';

// Import schemas pour les descriptions
import * as devEnvSchemas from './schemas/dev-env.js';
import * as dockerSchemas from './schemas/docker.js';
import * as systemSchemas from './schemas/system.js';
import * as projectSchemas from './schemas/project.js';
import * as graphicsSchemas from './schemas/graphics.js';

export class DevOpsMcpServer {
  private server: Server;
  private toolHandlers: Map<string, (input: unknown) => Promise<any>>;
  private toolDefinitions: Tool[];

  constructor() {
    this.server = new Server(
      {
        name: 'skynet-devops-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.toolHandlers = new Map();
    this.toolDefinitions = [];

    this.registerTools();
    this.setupHandlers();
  }

  private registerTools() {
    // Dev Env Tools
    this.registerTool('create_project', tools.createProject, {
      description: 'Crée un nouveau projet avec une structure adaptée (Python, Node.js ou générique)',
      inputSchema: { type: 'object', properties: devEnvSchemas.CreateProjectSchema.shape, required: ['name', 'type'] },
    });

    this.registerTool('setup_python_env', tools.setupPythonEnv, {
      description: 'Configure un environnement virtuel Python (venv ou conda)',
      inputSchema: { type: 'object', properties: devEnvSchemas.SetupPythonEnvSchema.shape, required: ['projectPath'] },
    });

    this.registerTool('setup_node_env', tools.setupNodeEnv, {
      description: 'Configure un environnement Node.js avec le package manager choisi',
      inputSchema: { type: 'object', properties: devEnvSchemas.SetupNodeEnvSchema.shape, required: ['projectPath', 'packageManager'] },
    });

    this.registerTool('install_dependencies', tools.installDependencies, {
      description: 'Installe les dépendances d\'un projet Python ou Node.js',
      inputSchema: { type: 'object', properties: devEnvSchemas.InstallDependenciesSchema.shape, required: ['projectPath', 'type'] },
    });

    this.registerTool('list_envs', tools.listEnvs, {
      description: 'Liste tous les environnements de développement disponibles',
      inputSchema: { type: 'object', properties: devEnvSchemas.ListEnvsSchema.shape },
    });

    // Docker Tools
    this.registerTool('list_containers', tools.listContainers, {
      description: 'Liste les containers Docker (running ou tous)',
      inputSchema: { type: 'object', properties: dockerSchemas.ListContainersSchema.shape },
    });

    this.registerTool('container_logs', tools.containerLogs, {
      description: 'Récupère les logs d\'un container Docker',
      inputSchema: { type: 'object', properties: dockerSchemas.ContainerLogsSchema.shape, required: ['containerId'] },
    });

    this.registerTool('start_container', tools.startContainer, {
      description: 'Démarre un container Docker',
      inputSchema: { type: 'object', properties: dockerSchemas.ContainerActionSchema.shape, required: ['containerId'] },
    });

    this.registerTool('stop_container', tools.stopContainer, {
      description: 'Arrête un container Docker',
      inputSchema: { type: 'object', properties: dockerSchemas.ContainerActionSchema.shape, required: ['containerId'] },
    });

    this.registerTool('restart_container', tools.restartContainer, {
      description: 'Redémarre un container Docker',
      inputSchema: { type: 'object', properties: dockerSchemas.ContainerActionSchema.shape, required: ['containerId'] },
    });

    this.registerTool('list_images', tools.listImages, {
      description: 'Liste les images Docker disponibles',
      inputSchema: { type: 'object', properties: dockerSchemas.ListImagesSchema.shape },
    });

    // System Tools
    this.registerTool('get_system_info', tools.getSystemInfo, {
      description: 'Récupère les informations système (OS, CPU, uptime)',
      inputSchema: { type: 'object', properties: {} },
    });

    this.registerTool('get_resource_usage', tools.getResourceUsage, {
      description: 'Récupère l\'utilisation des ressources (CPU, RAM, disque, processus)',
      inputSchema: { type: 'object', properties: systemSchemas.GetResourceUsageSchema.shape },
    });

    this.registerTool('list_services', tools.listServices, {
      description: 'Liste les services systemd',
      inputSchema: { type: 'object', properties: systemSchemas.ListServicesSchema.shape },
    });

    this.registerTool('service_status', tools.serviceStatus, {
      description: 'Récupère le statut d\'un service systemd',
      inputSchema: { type: 'object', properties: systemSchemas.ServiceStatusSchema.shape, required: ['serviceName'] },
    });

    this.registerTool('restart_service', tools.restartService, {
      description: 'Redémarre un service systemd (attention : action sensible)',
      inputSchema: { type: 'object', properties: systemSchemas.RestartServiceSchema.shape, required: ['serviceName'] },
    });

    // Project Tools
    this.registerTool('list_directory', tools.listDirectory, {
      description: 'Liste le contenu d\'un dossier',
      inputSchema: { type: 'object', properties: projectSchemas.ListDirectorySchema.shape, required: ['path'] },
    });

    this.registerTool('read_file', tools.readFileContent, {
      description: 'Lit le contenu d\'un fichier texte',
      inputSchema: { type: 'object', properties: projectSchemas.ReadFileSchema.shape, required: ['filePath'] },
    });

    this.registerTool('write_file', tools.writeFileContent, {
      description: 'Écrit du contenu dans un fichier (avec backup optionnel)',
      inputSchema: { type: 'object', properties: projectSchemas.WriteFileSchema.shape, required: ['filePath', 'content'] },
    });

    this.registerTool('git_status', tools.gitStatus, {
      description: 'Récupère le statut Git d\'un dépôt',
      inputSchema: { type: 'object', properties: projectSchemas.GitStatusSchema.shape, required: ['repositoryPath'] },
    });

    this.registerTool('git_commit', tools.gitCommit, {
      description: 'Crée un commit Git',
      inputSchema: { type: 'object', properties: projectSchemas.GitCommitSchema.shape, required: ['repositoryPath', 'message'] },
    });

    this.registerTool('git_push', tools.gitPush, {
      description: 'Push vers un remote Git',
      inputSchema: { type: 'object', properties: projectSchemas.GitPushSchema.shape, required: ['repositoryPath'] },
    });

    // Graphics Tools
    this.registerTool('resize_image', tools.resizeImage, {
      description: 'Redimensionne une image',
      inputSchema: { type: 'object', properties: graphicsSchemas.ResizeImageSchema.shape, required: ['inputPath'] },
    });

    this.registerTool('convert_format', tools.convertFormat, {
      description: 'Convertit une image vers un autre format',
      inputSchema: { type: 'object', properties: graphicsSchemas.ConvertFormatSchema.shape, required: ['inputPath', 'outputFormat'] },
    });

    this.registerTool('generate_thumbnail', tools.generateThumbnail, {
      description: 'Génère une miniature d\'une image',
      inputSchema: { type: 'object', properties: graphicsSchemas.GenerateThumbnailSchema.shape, required: ['inputPath'] },
    });
  }

  private registerTool(
    name: string,
    handler: (input: unknown) => Promise<any>,
    definition: { description: string; inputSchema: any }
  ) {
    this.toolHandlers.set(name, handler);
    this.toolDefinitions.push({
      name,
      description: definition.description,
      inputSchema: definition.inputSchema,
    });
  }

  private setupHandlers() {
    // Liste des tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: this.toolDefinitions };
    });

    // Exécution des tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info('Tool called', { name, args });

      const handler = this.toolHandlers.get(name);

      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        const result = await handler(args);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Tool execution failed', { name, error });

        const formattedError = formatError(error);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formattedError, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('Skynet DevOps MCP Server started');
  }
}
