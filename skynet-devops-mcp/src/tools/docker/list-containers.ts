import Docker from 'dockerode';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { ExecutionError } from '../../lib/errors.js';
import { ListContainersSchema } from '../../schemas/docker.js';

const docker = new Docker();

export async function listContainers(input: unknown) {
  const params = validate(ListContainersSchema, input);

  logger.info('Listing Docker containers', params);

  try {
    const filters: any = {};

    if (params.filters?.name) {
      filters.name = [params.filters.name];
    }
    if (params.filters?.status) {
      filters.status = [params.filters.status];
    }

    const containers = await docker.listContainers({
      all: params.all,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    const result = containers.map((container) => ({
      id: container.Id,
      name: container.Names[0]?.replace(/^\//, '') || '',
      image: container.Image,
      status: container.Status,
      state: container.State,
      ports: container.Ports.map((p) => `${p.PublicPort || ''}:${p.PrivatePort}/${p.Type}`),
      created: new Date(container.Created * 1000).toISOString(),
    }));

    logger.info('Containers listed', { total: result.length });

    return {
      containers: result,
      total: result.length,
    };
  } catch (error: any) {
    logger.error('Failed to list containers', { error: error.message });
    throw new ExecutionError(`Failed to list containers: ${error.message}`);
  }
}
