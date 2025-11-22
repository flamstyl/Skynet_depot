/**
 * Service MCP - Skynet Control Panel
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class MCPService {
  private configPath: string;

  constructor() {
    this.configPath = path.join(os.homedir(), '.claude.json');
  }

  async listServers() {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(content);
      const servers = config.mcpServers || {};

      return Object.entries(servers).map(([name, server]: [string, any]) => ({
        name,
        command: server.command,
        args: server.args,
        type: server.type,
        description: server.description
      }));
    } catch {
      return [];
    }
  }

  async getServerStatus(name: string) {
    // Simplified: check if server is configured
    const servers = await this.listServers();
    return servers.find(s => s.name === name) ? { status: 'configured' } : { status: 'not_found' };
  }
}
