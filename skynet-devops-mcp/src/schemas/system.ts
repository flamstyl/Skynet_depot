import { z } from 'zod';

export const GetSystemInfoSchema = z.object({});

export const GetResourceUsageSchema = z.object({
  includeProcesses: z.boolean().optional().default(false),
  topN: z.number().int().positive().optional().default(10),
});

export const ListServicesSchema = z.object({
  filter: z.enum(['running', 'failed', 'all']).optional().default('all'),
  pattern: z.string().optional(),
});

export const ServiceStatusSchema = z.object({
  serviceName: z.string().min(1),
});

export const RestartServiceSchema = z.object({
  serviceName: z.string().min(1),
  sudo: z.boolean().optional().default(false),
});

export type GetSystemInfoInput = z.infer<typeof GetSystemInfoSchema>;
export type GetResourceUsageInput = z.infer<typeof GetResourceUsageSchema>;
export type ListServicesInput = z.infer<typeof ListServicesSchema>;
export type ServiceStatusInput = z.infer<typeof ServiceStatusSchema>;
export type RestartServiceInput = z.infer<typeof RestartServiceSchema>;
