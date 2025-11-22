/**
 * Tool: container_logs
 */

import docker from '../utils/docker_client.js';
import { Validator } from '../../../core/validator.js';
import { ContainerLogsInput } from '../../../types/tools.js';

export async function containerLogs(input: ContainerLogsInput) {
  const validated = Validator.validate<ContainerLogsInput>(
    input,
    Validator.schemas.containerLogs
  );

  const container = docker.getContainer(validated.container);

  const logs = await container.logs({
    stdout: true,
    stderr: true,
    tail: validated.tail,
    since: validated.since ? Math.floor(new Date(validated.since).getTime() / 1000) : undefined,
    timestamps: true
  });

  const logsStr = logs.toString('utf-8');

  return {
    container: validated.container,
    logs: logsStr,
    lines: logsStr.split('\n').length,
    tail: validated.tail
  };
}
