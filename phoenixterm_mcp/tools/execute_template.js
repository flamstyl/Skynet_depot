/**
 * 🔥 PhoenixTerm MCP Tool: execute_template
 * Exécute des templates de commandes réutilisables
 */

import fs from 'fs/promises';
import path from 'path';

export const executeTemplate = {
  name: 'execute_template',
  description: 'Execute a command template with parameters, or save a command sequence as a template',

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['execute', 'save', 'list', 'delete'],
        description: 'Action to perform',
        default: 'execute',
      },
      template_name: {
        type: 'string',
        description: 'Name of the template',
      },
      commands: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of commands (for save action)',
      },
      parameters: {
        type: 'object',
        description: 'Parameters to substitute in the template',
      },
      session_id: {
        type: 'string',
        description: 'Session ID for execution',
        default: 'default',
      },
      chain_mode: {
        type: 'string',
        enum: ['sequential', 'parallel', 'conditional'],
        description: 'How to execute multiple commands',
        default: 'sequential',
      },
      stop_on_error: {
        type: 'boolean',
        description: 'Stop execution if a command fails',
        default: true,
      },
    },
  },

  templatesDir: './data/templates',

  async execute(params, context) {
    const {
      action = 'execute',
      template_name,
      commands,
      parameters = {},
      session_id = 'default',
      chain_mode = 'sequential',
      stop_on_error = true,
    } = params;

    try {
      await this.ensureTemplatesDir();

      switch (action) {
        case 'save':
          return await this.saveTemplate(template_name, commands, parameters);

        case 'list':
          return await this.listTemplates();

        case 'delete':
          return await this.deleteTemplate(template_name);

        case 'execute':
          return await this.executeTemplate(
            template_name,
            parameters,
            session_id,
            chain_mode,
            stop_on_error,
            context
          );

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      console.error('[ExecuteTemplate] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Assure que le répertoire des templates existe
   */
  async ensureTemplatesDir() {
    try {
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      // Ignore si le dossier existe déjà
    }
  },

  /**
   * Sauvegarde un template
   */
  async saveTemplate(name, commands, metadata = {}) {
    if (!name || !commands || commands.length === 0) {
      return {
        success: false,
        error: 'Template name and commands are required',
      };
    }

    const template = {
      name,
      commands,
      metadata: {
        ...metadata,
        created: Date.now(),
        version: '1.0',
      },
    };

    const filePath = path.join(this.templatesDir, `${name}.json`);
    await fs.writeFile(filePath, JSON.stringify(template, null, 2));

    console.error(`[ExecuteTemplate] Saved template: ${name}`);

    return {
      success: true,
      message: `Template "${name}" saved successfully`,
      template,
    };
  },

  /**
   * Liste tous les templates
   */
  async listTemplates() {
    try {
      const files = await fs.readdir(this.templatesDir);
      const templateFiles = files.filter(f => f.endsWith('.json'));

      const templates = [];
      for (const file of templateFiles) {
        try {
          const filePath = path.join(this.templatesDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const template = JSON.parse(data);
          templates.push({
            name: template.name,
            commandCount: template.commands.length,
            created: template.metadata?.created,
          });
        } catch (error) {
          console.error(`[ExecuteTemplate] Failed to read template ${file}:`, error);
        }
      }

      return {
        success: true,
        templates,
        count: templates.length,
      };
    } catch (error) {
      return {
        success: true,
        templates: [],
        count: 0,
      };
    }
  },

  /**
   * Supprime un template
   */
  async deleteTemplate(name) {
    if (!name) {
      return {
        success: false,
        error: 'Template name is required',
      };
    }

    try {
      const filePath = path.join(this.templatesDir, `${name}.json`);
      await fs.unlink(filePath);

      return {
        success: true,
        message: `Template "${name}" deleted successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Template "${name}" not found`,
      };
    }
  },

  /**
   * Charge un template
   */
  async loadTemplate(name) {
    const filePath = path.join(this.templatesDir, `${name}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  },

  /**
   * Substitue les paramètres dans une commande
   */
  substituteParameters(command, parameters) {
    let result = command;

    for (const [key, value] of Object.entries(parameters)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  },

  /**
   * Exécute un template
   */
  async executeTemplate(name, parameters, session_id, chain_mode, stop_on_error, context) {
    if (!name) {
      return {
        success: false,
        error: 'Template name is required',
      };
    }

    // Charger le template
    const template = await this.loadTemplate(name);

    // Substituer les paramètres
    const commands = template.commands.map(cmd =>
      this.substituteParameters(cmd, parameters)
    );

    console.error(`[ExecuteTemplate] Executing template "${name}" with ${commands.length} commands`);

    // Exécuter selon le mode
    let results = [];

    if (chain_mode === 'parallel') {
      // Exécution parallèle
      const promises = commands.map(async (command) => {
        const executeInteractive = (await import('./execute_interactive.js')).executeInteractiveCommand;
        return executeInteractive.execute(
          { command, session_id, validate: false },
          context
        );
      });

      results = await Promise.all(promises);

    } else if (chain_mode === 'sequential') {
      // Exécution séquentielle
      for (const command of commands) {
        const executeInteractive = (await import('./execute_interactive.js')).executeInteractiveCommand;
        const result = await executeInteractive.execute(
          { command, session_id, validate: false },
          context
        );

        results.push(result);

        // Stop on error si activé
        if (stop_on_error && !result.success) {
          console.error(`[ExecuteTemplate] Stopped on error at command: ${command}`);
          break;
        }
      }

    } else if (chain_mode === 'conditional') {
      // Exécution conditionnelle (seulement si le précédent a réussi)
      for (const command of commands) {
        if (results.length > 0 && !results[results.length - 1].success) {
          break;
        }

        const executeInteractive = (await import('./execute_interactive.js')).executeInteractiveCommand;
        const result = await executeInteractive.execute(
          { command, session_id, validate: false },
          context
        );

        results.push(result);
      }
    }

    // Statistiques
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      success: failureCount === 0,
      template: name,
      commands_executed: results.length,
      commands_total: commands.length,
      successes: successCount,
      failures: failureCount,
      results,
      timestamp: Date.now(),
    };
  },
};

export default executeTemplate;
