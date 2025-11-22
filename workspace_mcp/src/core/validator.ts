/**
 * Validation des inputs pour les tools MCP
 */

import Joi from 'joi';
import { MCPErrorHandler } from './error_handler.js';

export class Validator {
  /**
   * Valider un input avec un schema Joi
   */
  static validate<T>(input: any, schema: Joi.Schema): T {
    const { error, value } = schema.validate(input, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(d => d.message).join(', ');
      throw MCPErrorHandler.createError(
        MCPErrorHandler.CODES.INVALID_INPUT,
        `Validation échouée: ${details}`,
        { errors: error.details }
      );
    }

    return value as T;
  }

  /**
   * Schemas de validation communs
   */
  static readonly schemas = {
    // Dev Env
    createProject: Joi.object({
      name: Joi.string().required().pattern(/^[a-zA-Z0-9_-]+$/),
      type: Joi.string().valid('python', 'node', 'mixed').required(),
      path: Joi.string().optional(),
      template: Joi.string().optional(),
      git_init: Joi.boolean().optional().default(true)
    }),

    setupPythonEnv: Joi.object({
      project_path: Joi.string().required(),
      python_version: Joi.string().optional(),
      env_name: Joi.string().optional().default('venv'),
      requirements: Joi.string().optional(),
      install_deps: Joi.boolean().optional().default(true)
    }),

    setupNodeEnv: Joi.object({
      project_path: Joi.string().required(),
      node_version: Joi.string().optional(),
      package_manager: Joi.string().valid('npm', 'yarn', 'pnpm').required(),
      install_deps: Joi.boolean().optional().default(true)
    }),

    installDependencies: Joi.object({
      project_path: Joi.string().required(),
      type: Joi.string().valid('python', 'node').required(),
      force: Joi.boolean().optional().default(false)
    }),

    listEnvs: Joi.object({
      filter: Joi.string().valid('python', 'node', 'all').optional().default('all'),
      search_path: Joi.string().optional()
    }),

    // Docker
    listContainers: Joi.object({
      all: Joi.boolean().optional().default(false),
      filter: Joi.string().optional(),
      format: Joi.string().valid('simple', 'detailed').optional().default('simple')
    }),

    containerLogs: Joi.object({
      container: Joi.string().required(),
      tail: Joi.number().optional().default(100),
      since: Joi.string().optional(),
      follow: Joi.boolean().optional().default(false)
    }),

    containerAction: Joi.object({
      container: Joi.string().required(),
      timeout: Joi.number().optional(),
      wait_healthy: Joi.boolean().optional().default(false)
    }),

    // Server Admin
    getResourceUsage: Joi.object({
      detailed: Joi.boolean().optional().default(false),
      include_gpu: Joi.boolean().optional().default(false)
    }),

    listServices: Joi.object({
      filter: Joi.string().valid('active', 'failed', 'all').optional().default('active'),
      search: Joi.string().optional()
    }),

    serviceAction: Joi.object({
      service: Joi.string().required(),
      confirm: Joi.boolean().optional().default(false)
    }),

    // Project Ops
    listDirectory: Joi.object({
      path: Joi.string().required(),
      recursive: Joi.boolean().optional().default(false),
      include_hidden: Joi.boolean().optional().default(false),
      filter: Joi.string().optional()
    }),

    readFile: Joi.object({
      path: Joi.string().required(),
      encoding: Joi.string().optional().default('utf-8'),
      max_size: Joi.number().optional()
    }),

    writeFile: Joi.object({
      path: Joi.string().required(),
      content: Joi.string().required(),
      encoding: Joi.string().optional().default('utf-8'),
      create_backup: Joi.boolean().optional().default(true),
      create_dirs: Joi.boolean().optional().default(false)
    }),

    deleteFile: Joi.object({
      path: Joi.string().required(),
      recursive: Joi.boolean().optional().default(false),
      confirm: Joi.boolean().required()
    }),

    gitAction: Joi.object({
      repo_path: Joi.string().required(),
      message: Joi.string().optional(),
      files: Joi.array().items(Joi.string()).optional(),
      remote: Joi.string().optional().default('origin'),
      branch: Joi.string().optional(),
      force: Joi.boolean().optional().default(false),
      author: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      }).optional()
    }),

    // Graphics
    resizeImage: Joi.object({
      input_path: Joi.string().required(),
      output_path: Joi.string().required(),
      width: Joi.number().optional(),
      height: Joi.number().optional(),
      maintain_aspect: Joi.boolean().optional().default(true),
      quality: Joi.number().min(1).max(100).optional().default(80)
    }),

    convertFormat: Joi.object({
      input_path: Joi.string().required(),
      output_path: Joi.string().required(),
      format: Joi.string().valid('jpg', 'png', 'webp', 'gif', 'bmp').required(),
      quality: Joi.number().min(1).max(100).optional().default(80)
    }),

    generateThumbnail: Joi.object({
      input_path: Joi.string().required(),
      output_path: Joi.string().required(),
      max_size: Joi.number().optional().default(200),
      crop: Joi.boolean().optional().default(false)
    })
  };
}
