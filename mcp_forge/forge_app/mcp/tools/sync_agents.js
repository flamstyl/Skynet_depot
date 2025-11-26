/**
 * Agent Sync - MCP Forge
 * Handles agent deployment and synchronization
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class AgentSync {
  constructor() {
    this.skynetPath = process.env.SKYNET_AGENTS_PATH || '/agents/';
    this.exportsPath = path.join(__dirname, '../../../data/exports');
  }

  /**
   * Push agent to Skynet Core
   */
  async pushToSkynet(agentId, agentConfig, targetPath = null) {
    try {
      const deployPath = targetPath || this.skynetPath;

      // Ensure directory exists
      if (!fs.existsSync(deployPath)) {
        fs.mkdirSync(deployPath, { recursive: true });
      }

      // Convert to YAML
      const yamlContent = yaml.dump(agentConfig, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });

      // Generate filename
      const filename = `${this.sanitizeName(agentId)}.yaml`;
      const fullPath = path.join(deployPath, filename);

      // Write file
      fs.writeFileSync(fullPath, yamlContent, 'utf-8');

      // Create backup
      this.createBackup(agentId, agentConfig);

      return {
        success: true,
        path: fullPath,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Push to Skynet error:', error);
      throw error;
    }
  }

  /**
   * Pull agent from Skynet Core
   */
  async pullFromSkynet(agentId) {
    try {
      const filename = `${this.sanitizeName(agentId)}.yaml`;
      const fullPath = path.join(this.skynetPath, filename);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const agentConfig = yaml.load(content);

      return {
        success: true,
        config: agentConfig,
        source: fullPath
      };

    } catch (error) {
      console.error('Pull from Skynet error:', error);
      throw error;
    }
  }

  /**
   * Export agent to file
   */
  async exportAgent(agentConfig, format = 'yaml') {
    try {
      // Ensure exports directory exists
      if (!fs.existsSync(this.exportsPath)) {
        fs.mkdirSync(this.exportsPath, { recursive: true });
      }

      const agentName = this.sanitizeName(agentConfig.name || 'agent');
      const timestamp = Date.now();

      let content;
      let filename;

      if (format === 'yaml') {
        content = yaml.dump(agentConfig, {
          indent: 2,
          lineWidth: -1,
          noRefs: true
        });
        filename = `${agentName}_${timestamp}.yaml`;
      } else {
        content = JSON.stringify(agentConfig, null, 2);
        filename = `${agentName}_${timestamp}.json`;
      }

      const fullPath = path.join(this.exportsPath, filename);
      fs.writeFileSync(fullPath, content, 'utf-8');

      return {
        success: true,
        path: fullPath,
        format,
        content
      };

    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  /**
   * Sync to n8n
   */
  async syncToN8N(workflow) {
    // TODO: Implement n8n API integration
    throw new Error('n8n sync not yet implemented');
  }

  /**
   * Create version backup
   */
  createBackup(agentId, agentConfig) {
    try {
      const backupDir = path.join(__dirname, '../../../data/backups');

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${this.sanitizeName(agentId)}_${timestamp}.yaml`;
      const backupPath = path.join(backupDir, filename);

      const yamlContent = yaml.dump(agentConfig, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });

      fs.writeFileSync(backupPath, yamlContent, 'utf-8');

      console.log(`✅ Backup created: ${backupPath}`);

      return backupPath;

    } catch (error) {
      console.error('Backup error:', error);
      // Don't throw - backup is non-critical
      return null;
    }
  }

  /**
   * List deployed agents
   */
  async listDeployedAgents() {
    try {
      if (!fs.existsSync(this.skynetPath)) {
        return {
          success: true,
          agents: []
        };
      }

      const files = fs.readdirSync(this.skynetPath)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

      const agents = files.map(file => ({
        id: file.replace(/\.(yaml|yml)$/, ''),
        name: file,
        path: path.join(this.skynetPath, file),
        modified: fs.statSync(path.join(this.skynetPath, file)).mtime
      }));

      return {
        success: true,
        agents
      };

    } catch (error) {
      console.error('List agents error:', error);
      throw error;
    }
  }

  /**
   * Delete agent
   */
  async deleteAgent(agentId) {
    try {
      const filename = `${this.sanitizeName(agentId)}.yaml`;
      const fullPath = path.join(this.skynetPath, filename);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // Create backup before deletion
      const content = fs.readFileSync(fullPath, 'utf-8');
      const agentConfig = yaml.load(content);
      this.createBackup(agentId, agentConfig);

      // Delete file
      fs.unlinkSync(fullPath);

      return {
        success: true,
        deleted: agentId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Delete agent error:', error);
      throw error;
    }
  }

  /**
   * Sanitize name for filename
   */
  sanitizeName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}

module.exports = AgentSync;
