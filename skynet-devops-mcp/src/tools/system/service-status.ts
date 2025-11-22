import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { executeCommand, commandExists } from '../../lib/shell.js';
import { ExecutionError } from '../../lib/errors.js';
import { ServiceStatusSchema } from '../../schemas/system.js';

export async function serviceStatus(input: unknown) {
  const params = validate(ServiceStatusSchema, input);

  logger.info('Fetching service status', params);

  const systemctlExists = await commandExists('systemctl');
  if (!systemctlExists) {
    throw new ExecutionError('systemctl not found - systemd is required');
  }

  try {
    const statusCommand = `systemctl status ${params.serviceName} --no-pager`;

    let statusResult;
    try {
      statusResult = await executeCommand(statusCommand);
    } catch (error: any) {
      // Service might be inactive, that's ok
      statusResult = { stdout: error.details?.stdout || '', stderr: '', exitCode: error.details?.exitCode || 0 };
    }

    const statusOutput = statusResult.stdout;

    // Parser la sortie
    const active = /Active: (\w+)/.exec(statusOutput)?.[1] || 'unknown';
    const enabled = /Loaded: .+;\s*(\w+);/.exec(statusOutput)?.[1] === 'enabled';
    const pidMatch = /Main PID: (\d+)/.exec(statusOutput);
    const memoryMatch = /Memory: (.+)/.exec(statusOutput);
    const uptimeMatch = /Active: \w+ .+ since (.+);/.exec(statusOutput);

    const result: any = {
      name: params.serviceName,
      status: statusOutput,
      active: active === 'active',
      enabled,
    };

    if (pidMatch) {
      result.pid = parseInt(pidMatch[1], 10);
    }

    if (memoryMatch) {
      result.memory = memoryMatch[1];
    }

    if (uptimeMatch) {
      result.uptime = uptimeMatch[1];
    }

    // Récupérer quelques logs
    try {
      const logsResult = await executeCommand(`journalctl -u ${params.serviceName} -n 10 --no-pager`);
      result.logs = logsResult.stdout;
    } catch {
      // Ignore
    }

    logger.info('Service status fetched', { serviceName: params.serviceName, active: result.active });

    return result;
  } catch (error: any) {
    logger.error('Failed to fetch service status', { error: error.message });
    throw new ExecutionError(`Failed to fetch service status: ${error.message}`);
  }
}
