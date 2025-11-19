import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import logger from './logger.js';

const CONFIG_FILE = path.resolve(process.cwd(), 'config.yaml');

const DEFAULT_CONFIG = {
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  docker: {
    image: 'devbox-sandbox:latest',
    memory: 512, // MB
    cpuQuota: 50000, // 50% of one CPU
    networkEnabled: true,
    timeout: 300000 // 5 minutes
  },
  autofix: {
    enabled: true,
    maxAttempts: 5,
    timeout: 60000 // 60 seconds per attempt
  },
  vm: {
    linux: {
      enabled: true,
      type: 'qemu',
      sshPort: 2222,
      user: 'devbox',
      password: 'devbox'
    },
    windows: {
      enabled: true,
      type: 'virtualbox',
      vmName: 'DevBox-Windows',
      user: 'devbox',
      password: 'devbox'
    }
  },
  workspace: {
    inputDir: '../workspace/input',
    outputDir: '../workspace/output'
  },
  logging: {
    level: 'info',
    retentionDays: 30
  },
  mcp: {
    enabled: false,
    claudeApiKey: process.env.CLAUDE_API_KEY || '',
    endpoint: process.env.MCP_ENDPOINT || ''
  }
};

let config = null;

/**
 * Load configuration from file or create default
 */
export async function loadConfig() {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const content = await fs.readFile(CONFIG_FILE, 'utf-8');
      config = yaml.parse(content);
      logger.info('Configuration loaded from file');
    } else {
      config = DEFAULT_CONFIG;
      await fs.writeFile(CONFIG_FILE, yaml.stringify(DEFAULT_CONFIG));
      logger.info('Created default configuration file');
    }

    return config;
  } catch (error) {
    logger.error('Failed to load configuration:', error);
    config = DEFAULT_CONFIG;
    return config;
  }
}

/**
 * Get configuration value
 * @param {string} key - Dot-notation key (e.g., 'docker.memory')
 * @param {*} defaultValue - Default value if key not found
 */
export function getConfig(key, defaultValue = null) {
  if (!config) {
    throw new Error('Configuration not loaded');
  }

  const keys = key.split('.');
  let value = config;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }

  return value;
}

/**
 * Set configuration value
 * @param {string} key - Dot-notation key
 * @param {*} value - Value to set
 */
export function setConfig(key, value) {
  if (!config) {
    throw new Error('Configuration not loaded');
  }

  const keys = key.split('.');
  let target = config;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in target) || typeof target[k] !== 'object') {
      target[k] = {};
    }
    target = target[k];
  }

  target[keys[keys.length - 1]] = value;
}

/**
 * Save configuration to file
 */
export async function saveConfig() {
  try {
    await fs.writeFile(CONFIG_FILE, yaml.stringify(config));
    logger.info('Configuration saved to file');
  } catch (error) {
    logger.error('Failed to save configuration:', error);
    throw error;
  }
}

/**
 * Get entire configuration object
 */
export function getAllConfig() {
  if (!config) {
    throw new Error('Configuration not loaded');
  }
  return { ...config };
}

/**
 * Reload configuration from file
 */
export async function reloadConfig() {
  logger.info('Reloading configuration...');
  return await loadConfig();
}
