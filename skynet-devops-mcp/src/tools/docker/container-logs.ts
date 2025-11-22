import Docker from 'dockerode';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { ExecutionError } from '../../lib/errors.js';
import { ContainerLogsSchema } from '../../schemas/docker.js';

const docker = new Docker();

export async function containerLogs(input: unknown) {
  const params = validate(ContainerLogsSchema, input);

  logger.info('Fetching container logs', params);

  try {
    const container = docker.getContainer(params.containerId);

    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: params.tail,
      timestamps: params.timestamps,
    });

    const logsStr = logs.toString('utf-8');

    logger.info('Container logs fetched', {
      containerId: params.containerId,
      lines: logsStr.split('\n').length,
    });

    return {
      logs: logsStr,
      container: params.containerId,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Failed to fetch container logs', { error: error.message });
    throw new ExecutionError(`Failed to fetch container logs: ${error.message}`);
  }
}
