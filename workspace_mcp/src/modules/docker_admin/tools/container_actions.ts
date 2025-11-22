/**
 * Tools: start/stop/restart container
 */

import docker from '../utils/docker_client.js';
import { Validator } from '../../../core/validator.js';
import { ContainerActionInput } from '../../../types/tools.js';

export async function startContainer(input: ContainerActionInput) {
  const validated = Validator.validate<ContainerActionInput>(
    input,
    Validator.schemas.containerAction
  );

  const container = docker.getContainer(validated.container);
  await container.start();

  if (validated.wait_healthy) {
    // Attendre que le container soit healthy (max 30s)
    let attempts = 0;
    while (attempts < 30) {
      const info = await container.inspect();
      if (info.State.Running) {
        if (!info.State.Health || info.State.Health.Status === 'healthy') {
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
  }

  const info = await container.inspect();

  return {
    container: validated.container,
    status: info.State.Status,
    running: info.State.Running,
    message: `Container démarré avec succès`
  };
}

export async function stopContainer(input: ContainerActionInput) {
  const validated = Validator.validate<ContainerActionInput>(
    input,
    Validator.schemas.containerAction
  );

  const container = docker.getContainer(validated.container);
  await container.stop({ t: validated.timeout || 10 });

  const info = await container.inspect();

  return {
    container: validated.container,
    status: info.State.Status,
    running: info.State.Running,
    message: `Container arrêté avec succès`
  };
}

export async function restartContainer(input: ContainerActionInput) {
  const validated = Validator.validate<ContainerActionInput>(
    input,
    Validator.schemas.containerAction
  );

  const container = docker.getContainer(validated.container);
  await container.restart({ t: validated.timeout || 10 });

  const info = await container.inspect();

  return {
    container: validated.container,
    status: info.State.Status,
    running: info.State.Running,
    message: `Container redémarré avec succès`
  };
}
