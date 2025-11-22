import si from 'systeminformation';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { ExecutionError } from '../../lib/errors.js';
import { GetSystemInfoSchema } from '../../schemas/system.js';

export async function getSystemInfo(input: unknown) {
  validate(GetSystemInfoSchema, input);

  logger.info('Fetching system information');

  try {
    const [osInfo, cpuInfo, timeData] = await Promise.all([si.osInfo(), si.cpu(), si.time()]);

    const result = {
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        kernel: osInfo.kernel,
      },
      cpu: {
        manufacturer: cpuInfo.manufacturer,
        brand: cpuInfo.brand,
        cores: cpuInfo.cores,
        speed: cpuInfo.speed,
      },
      hostname: osInfo.hostname,
      uptime: timeData.uptime,
    };

    logger.info('System information fetched successfully');

    return result;
  } catch (error: any) {
    logger.error('Failed to fetch system information', { error: error.message });
    throw new ExecutionError(`Failed to fetch system information: ${error.message}`);
  }
}
