import si from 'systeminformation';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { ExecutionError } from '../../lib/errors.js';
import { GetResourceUsageSchema } from '../../schemas/system.js';

export async function getResourceUsage(input: unknown) {
  const params = validate(GetResourceUsageSchema, input);

  logger.info('Fetching resource usage', params);

  try {
    const [currentLoad, mem, fsSize, processes] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      params.includeProcesses ? si.processes() : Promise.resolve(null),
    ]);

    const result: any = {
      cpu: {
        usage: parseFloat(currentLoad.currentLoad.toFixed(2)),
        loadAvg: currentLoad.avgLoad ? [currentLoad.avgLoad] : [0],
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usagePercent: parseFloat(((mem.used / mem.total) * 100).toFixed(2)),
      },
      disk: fsSize.map((disk) => ({
        mount: disk.mount,
        total: disk.size,
        used: disk.used,
        available: disk.available,
        usagePercent: parseFloat(disk.use.toFixed(2)),
      })),
    };

    if (params.includeProcesses && processes) {
      result.processes = processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, params.topN)
        .map((proc) => ({
          pid: proc.pid,
          name: proc.name,
          cpu: proc.cpu,
          memory: proc.mem,
        }));
    }

    logger.info('Resource usage fetched successfully');

    return result;
  } catch (error: any) {
    logger.error('Failed to fetch resource usage', { error: error.message });
    throw new ExecutionError(`Failed to fetch resource usage: ${error.message}`);
  }
}
