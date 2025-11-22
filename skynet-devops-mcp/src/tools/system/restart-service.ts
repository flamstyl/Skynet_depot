import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { executeCommand, commandExists } from '../../lib/shell.js';
import { ExecutionError, PermissionError } from '../../lib/errors.js';
import { RestartServiceSchema } from '../../schemas/system.js';
import { config } from '../../config.js';

const CRITICAL_SERVICES = ['sshd', 'ssh', 'network', 'networking', 'systemd-networkd'];

export async function restartService(input: unknown) {
  const params = validate(RestartServiceSchema, input);

  logger.info('Restarting service', params);

  // Vérifier si c'est un service critique
  if (CRITICAL_SERVICES.includes(params.serviceName)) {
    if (config.requireConfirmationForSystemRestart) {
      throw new PermissionError(
        `Service ${params.serviceName} is critical and requires explicit confirmation`
      );
    }
  }

  const systemctlExists = await commandExists('systemctl');
  if (!systemctlExists) {
    throw new ExecutionError('systemctl not found - systemd is required');
  }

  try {
    const sudoPrefix = params.sudo ? 'sudo ' : '';
    const command = `${sudoPrefix}systemctl restart ${params.serviceName}`;

    await executeCommand(command);

    // Vérifier le nouveau statut
    const statusCommand = `systemctl is-active ${params.serviceName}`;
    const statusResult = await executeCommand(statusCommand);
    const newStatus = statusResult.stdout.trim();

    logger.info('Service restarted successfully', { serviceName: params.serviceName, newStatus });

    return {
      success: true,
      serviceName: params.serviceName,
      newStatus,
      message: `Service ${params.serviceName} restarted successfully`,
    };
  } catch (error: any) {
    logger.error('Failed to restart service', { error: error.message });
    throw new ExecutionError(`Failed to restart service: ${error.message}`);
  }
}
