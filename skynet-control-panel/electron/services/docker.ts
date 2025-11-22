/**
 * Service Docker - Skynet Control Panel
 */

import Docker from 'dockerode';

export class DockerService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }

  async listContainers() {
    try {
      const containers = await this.docker.listContainers({ all: true });
      return containers.map(c => ({
        id: c.Id,
        name: c.Names[0]?.replace(/^\//, ''),
        image: c.Image,
        status: c.Status,
        state: c.State,
        ports: c.Ports
      }));
    } catch (error: any) {
      console.error('Docker list error:', error);
      return [];
    }
  }

  async startContainer(id: string) {
    const container = this.docker.getContainer(id);
    await container.start();
  }

  async stopContainer(id: string) {
    const container = this.docker.getContainer(id);
    await container.stop();
  }

  async getStats(id: string) {
    const container = this.docker.getContainer(id);
    const stats: any = await container.stats({ stream: false });
    return stats;
  }

  async getLogs(id: string) {
    const container = this.docker.getContainer(id);
    const logs = await container.logs({ stdout: true, stderr: true, tail: 100 });
    return logs.toString('utf8');
  }
}
