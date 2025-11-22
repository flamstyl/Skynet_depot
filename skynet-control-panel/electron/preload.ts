/**
 * Preload script - Skynet Control Panel
 * Expose sécurisée des APIs au renderer
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * API exposée au renderer (avec contextIsolation)
 */
contextBridge.exposeInMainWorld('skynetAPI', {
  // Docker API
  docker: {
    listContainers: () => ipcRenderer.invoke('docker:listContainers'),
    startContainer: (id: string) => ipcRenderer.invoke('docker:startContainer', id),
    stopContainer: (id: string) => ipcRenderer.invoke('docker:stopContainer', id),
    restartContainer: (id: string) => ipcRenderer.invoke('docker:restartContainer', id),
    getStats: (id: string) => ipcRenderer.invoke('docker:containerStats', id),
    getLogs: (id: string) => ipcRenderer.invoke('docker:containerLogs', id)
  },

  // MCP API
  mcp: {
    listServers: () => ipcRenderer.invoke('mcp:listServers'),
    getServerStatus: (name: string) => ipcRenderer.invoke('mcp:getServerStatus', name),
    startServer: (name: string) => ipcRenderer.invoke('mcp:startServer', name),
    stopServer: (name: string) => ipcRenderer.invoke('mcp:stopServer', name)
  },

  // n8n API
  n8n: {
    listWorkflows: () => ipcRenderer.invoke('n8n:listWorkflows'),
    executeWorkflow: (id: string) => ipcRenderer.invoke('n8n:executeWorkflow', id),
    getWorkflowRuns: (id: string) => ipcRenderer.invoke('n8n:getWorkflowRuns', id)
  },

  // Oracle Cloud API
  oracle: {
    listInstances: () => ipcRenderer.invoke('oracle:listInstances'),
    startInstance: (id: string) => ipcRenderer.invoke('oracle:startInstance', id),
    stopInstance: (id: string) => ipcRenderer.invoke('oracle:stopInstance', id),
    getInstanceStatus: (id: string) => ipcRenderer.invoke('oracle:getInstanceStatus', id)
  },

  // System API
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo')
  }
});

// Types pour TypeScript
export interface SkynetAPI {
  docker: {
    listContainers: () => Promise<any[]>;
    startContainer: (id: string) => Promise<void>;
    stopContainer: (id: string) => Promise<void>;
    restartContainer: (id: string) => Promise<void>;
    getStats: (id: string) => Promise<any>;
    getLogs: (id: string) => Promise<string>;
  };
  mcp: {
    listServers: () => Promise<any[]>;
    getServerStatus: (name: string) => Promise<any>;
    startServer: (name: string) => Promise<void>;
    stopServer: (name: string) => Promise<void>;
  };
  n8n: {
    listWorkflows: () => Promise<any[]>;
    executeWorkflow: (id: string) => Promise<any>;
    getWorkflowRuns: (id: string) => Promise<any[]>;
  };
  oracle: {
    listInstances: () => Promise<any[]>;
    startInstance: (id: string) => Promise<void>;
    stopInstance: (id: string) => Promise<void>;
    getInstanceStatus: (id: string) => Promise<any>;
  };
  system: {
    getInfo: () => Promise<any>;
  };
}

declare global {
  interface Window {
    skynetAPI: SkynetAPI;
  }
}
