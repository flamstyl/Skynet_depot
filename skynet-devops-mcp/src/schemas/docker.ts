import { z } from 'zod';

export const ListContainersSchema = z.object({
  all: z.boolean().optional().default(false),
  filters: z
    .object({
      name: z.string().optional(),
      status: z.enum(['running', 'exited', 'paused']).optional(),
    })
    .optional(),
});

export const ContainerLogsSchema = z.object({
  containerId: z.string().min(1),
  tail: z.number().int().positive().optional().default(100),
  follow: z.boolean().optional().default(false),
  timestamps: z.boolean().optional().default(false),
});

export const ContainerActionSchema = z.object({
  containerId: z.string().min(1),
  timeout: z.number().int().positive().optional().default(10),
});

export const ListImagesSchema = z.object({
  filters: z
    .object({
      dangling: z.boolean().optional(),
      reference: z.string().optional(),
    })
    .optional(),
});

export type ListContainersInput = z.infer<typeof ListContainersSchema>;
export type ContainerLogsInput = z.infer<typeof ContainerLogsSchema>;
export type ContainerActionInput = z.infer<typeof ContainerActionSchema>;
export type ListImagesInput = z.infer<typeof ListImagesSchema>;
