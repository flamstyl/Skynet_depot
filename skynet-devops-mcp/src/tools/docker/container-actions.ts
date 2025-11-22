import Docker from 'dockerode';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { ExecutionError } from '../../lib/errors.js';
import { ContainerActionSchema } from '../../schemas/docker.js';

const docker = new Docker();

export async function startContainer(input: unknown) {
  const params = validate(ContainerActionSchema, input);

  logger.info('Starting container', params);

  try {
    const container = docker.getContainer(params.containerId);
    await container.start();

    const inspectData = await container.inspect();

    return {
      success: true,
      containerId: params.containerId,
      newStatus: inspectData.State.Status,
      message: 'Container started successfully',
    };
  } catch (error: any) {
    logger.error('Failed to start container', { error: error.message });
    throw new ExecutionError(`Failed to start container: ${error.message}`);
  }
}

export async function stopContainer(input: unknown) {
  const params = validate(ContainerActionSchema, input);

  logger.info('Stopping container', params);

  try {
    const container = docker.getContainer(params.containerId);
    await container.stop({ t: params.timeout });

    const inspectData = await container.inspect();

    return {
      success: true,
      containerId: params.containerId,
      newStatus: inspectData.State.Status,
      message: 'Container stopped successfully',
    };
  } catch (error: any) {
    logger.error('Failed to stop container', { error: error.message });
    throw new ExecutionError(`Failed to stop container: ${error.message}`);
  }
}

export async function restartContainer(input: unknown) {
  const params = validate(ContainerActionSchema, input);

  logger.info('Restarting container', params);

  try {
    const container = docker.getContainer(params.containerId);
    await container.restart({ t: params.timeout });

    const inspectData = await container.inspect();

    return {
      success: true,
      containerId: params.containerId,
      newStatus: inspectData.State.Status,
      message: 'Container restarted successfully',
    };
  } catch (error: any) {
    logger.error('Failed to restart container', { error: error.message });
    throw new ExecutionError(`Failed to restart container: ${error.message}`);
  }
}
