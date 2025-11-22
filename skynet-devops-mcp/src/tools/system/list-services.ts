import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { executeCommand, commandExists } from '../../lib/shell.js';
import { ExecutionError } from '../../lib/errors.js';
import { ListServicesSchema } from '../../schemas/system.js';

export async function listServices(input: unknown) {
  const params = validate(ListServicesSchema, input);

  logger.info('Listing systemd services', params);

  const systemctlExists = await commandExists('systemctl');
  if (!systemctlExists) {
    throw new ExecutionError('systemctl not found - systemd is required');
  }

  try {
    let command = 'systemctl list-units --type=service --all --no-pager --no-legend';

    if (params.filter === 'running') {
      command += ' --state=active';
    } else if (params.filter === 'failed') {
      command += ' --state=failed';
    }

    const result = await executeCommand(command);

    let services = result.stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        const name = parts[0]?.replace(/\.service$/, '') || '';
        const loaded = parts[1] || '';
        const active = parts[2] || '';
        const sub = parts[3] || '';
        const description = parts.slice(4).join(' ') || '';

        return {
          name,
          status: active as 'active' | 'inactive' | 'failed',
          enabled: loaded === 'loaded',
          description,
        };
      });

    // Filtrer par pattern si fourni
    if (params.pattern) {
      const regex = new RegExp(params.pattern, 'i');
      services = services.filter((s) => regex.test(s.name) || regex.test(s.description));
    }

    logger.info('Services listed', { count: services.length });

    return { services };
  } catch (error: any) {
    logger.error('Failed to list services', { error: error.message });
    throw new ExecutionError(`Failed to list services: ${error.message}`);
  }
}
