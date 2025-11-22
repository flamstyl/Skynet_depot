/**
 * Tool: list_containers
 */

import docker from '../utils/docker_client.js';
import { Validator } from '../../../core/validator.js';
import { ListContainersInput } from '../../../types/tools.js';

export async function listContainers(input: ListContainersInput) {
  const validated = Validator.validate<ListContainersInput>(
    input,
    Validator.schemas.listContainers
  );

  const containers = await docker.listContainers({
    all: validated.all,
    filters: validated.filter ? { name: [validated.filter] } : undefined
  });

  const formatted = containers.map(container => {
    if (validated.format === 'detailed') {
      return {
        id: container.Id.substring(0, 12),
        name: container.Names[0].replace('/', ''),
        image: container.Image,
        status: container.Status,
        state: container.State,
        ports: container.Ports.map(p =>
          `${p.PublicPort || ''}:${p.PrivatePort}/${p.Type}`
        ),
        created: new Date(container.Created * 1000).toISOString()
      };
    }

    return {
      id: container.Id.substring(0, 12),
      name: container.Names[0].replace('/', ''),
      image: container.Image,
      status: container.Status
    };
  });

  return {
    containers: formatted,
    total: formatted.length
  };
}
