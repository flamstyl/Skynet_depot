/**
 * Tool MCP : Récupérer l'utilisation des ressources système
 */

import { shell } from "../../services/shell-executor.js";
import { SystemResources } from "../../models/types.js";
import {
  GetResourceUsageInputSchema,
  GetResourceUsageOutputSchema,
} from "../../models/schemas.js";

export async function getResourceUsage(input: unknown) {
  const params = GetResourceUsageInputSchema.parse(input);

  // CPU usage (via top)
  const cpuOutput = await shell.run(
    "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1"
  );
  const cpuUsage = parseFloat(cpuOutput) || 0;

  const cpuCores = parseInt(await shell.run("nproc"), 10);

  // Memory usage (via free)
  const memOutput = await shell.run("free -h");
  const memLines = memOutput.split("\n");
  const memLine = memLines[1]; // ligne "Mem:"
  const memParts = memLine.split(/\s+/);

  const memTotal = memParts[1];
  const memUsed = memParts[2];
  const memFree = memParts[3];

  // Calculer le pourcentage
  const memTotalBytes = parseSize(memTotal);
  const memUsedBytes = parseSize(memUsed);
  const memPercentage = Math.round((memUsedBytes / memTotalBytes) * 100);

  // Disk usage (via df)
  const diskOutput = await shell.run("df -h");
  const diskLines = diskOutput.split("\n").slice(1); // ignorer header

  const disk = diskLines
    .filter((line) => line.trim() && !line.startsWith("tmpfs"))
    .map((line) => {
      const parts = line.split(/\s+/);
      return {
        filesystem: parts[0],
        total: parts[1],
        used: parts[2],
        available: parts[3],
        percentage: parseInt(parts[4].replace("%", ""), 10),
        mountpoint: parts[5],
      };
    });

  const resources: SystemResources = {
    cpu: {
      usage: cpuUsage,
      cores: cpuCores,
    },
    memory: {
      total: memTotal,
      used: memUsed,
      free: memFree,
      percentage: memPercentage,
    },
    disk,
  };

  return GetResourceUsageOutputSchema.parse(resources);
}

function parseSize(size: string): number {
  // Convertir les tailles human-readable en bytes
  const units: Record<string, number> = {
    K: 1024,
    M: 1024 ** 2,
    G: 1024 ** 3,
    T: 1024 ** 4,
  };

  const match = size.match(/^([\d.]+)([KMGT]?)i?$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2] || "";

  return value * (units[unit] || 1);
}

export const getResourceUsageTool = {
  name: "get_resource_usage",
  description: "Récupère l'utilisation des ressources système (CPU, RAM, disque)",
  inputSchema: GetResourceUsageInputSchema,
  outputSchema: GetResourceUsageOutputSchema,
  handler: getResourceUsage,
};
