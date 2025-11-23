/**
 * Node Registry
 * Central catalog of all available node types
 */

import type { NodeType } from '@gemini-flow/shared-types';
import { coreNodes } from './nodes/core';
import { triggerNodes } from './nodes/triggers';
import { actionNodes } from './nodes/actions';

export class NodeRegistry {
  private nodes: Map<string, NodeType>;

  constructor() {
    this.nodes = new Map();
    this.registerDefaultNodes();
  }

  /**
   * Register default nodes
   */
  private registerDefaultNodes(): void {
    // Core nodes
    for (const node of coreNodes) {
      this.register(node);
    }

    // Trigger nodes
    for (const node of triggerNodes) {
      this.register(node);
    }

    // Action nodes
    for (const node of actionNodes) {
      this.register(node);
    }
  }

  /**
   * Register a node type
   */
  register(nodeType: NodeType): void {
    this.nodes.set(nodeType.name, nodeType);
  }

  /**
   * Get a node type by name
   */
  get(name: string): NodeType | undefined {
    return this.nodes.get(name);
  }

  /**
   * List all nodes
   */
  list(): NodeType[] {
    return Array.from(this.nodes.values());
  }

  /**
   * List nodes by group
   */
  listByGroup(group: string): NodeType[] {
    return this.list().filter(node => node.group.includes(group as any));
  }

  /**
   * Search nodes
   */
  search(query: string): NodeType[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(
      node =>
        node.name.toLowerCase().includes(lowerQuery) ||
        node.displayName.toLowerCase().includes(lowerQuery) ||
        node.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Check if a node type exists
   */
  has(name: string): boolean {
    return this.nodes.has(name);
  }

  /**
   * Unregister a node type
   */
  unregister(name: string): boolean {
    return this.nodes.delete(name);
  }

  /**
   * Get node count
   */
  count(): number {
    return this.nodes.size;
  }
}

/**
 * Singleton instance
 */
export const nodeRegistry = new NodeRegistry();
