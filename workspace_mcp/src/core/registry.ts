/**
 * Registre de tous les tools MCP disponibles
 */

import { MCPTool } from '../types/tools.js';

export class ToolRegistry {
  private static tools: Map<string, MCPTool> = new Map();

  /**
   * Enregistrer un tool
   */
  static register(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Récupérer un tool par nom
   */
  static get(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Lister tous les tools
   */
  static list(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Lister les tools par module
   */
  static listByModule(module: string): MCPTool[] {
    return this.list().filter(tool => tool.name.startsWith(`${module}_`));
  }

  /**
   * Vérifier si un tool existe
   */
  static exists(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Obtenir le nombre total de tools
   */
  static count(): number {
    return this.tools.size;
  }

  /**
   * Nettoyer tous les tools (pour les tests)
   */
  static clear(): void {
    this.tools.clear();
  }
}

/**
 * Helper pour créer un tool MCP
 */
export function createTool(
  name: string,
  description: string,
  properties: Record<string, any>,
  required: string[] = []
): MCPTool {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties,
      required
    }
  };
}
