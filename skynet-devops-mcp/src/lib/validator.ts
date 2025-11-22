import { z, ZodSchema } from 'zod';
import { ValidationError } from './errors.js';

/**
 * Valide des données avec un schéma Zod
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError('Validation failed', {
      errors: result.error.errors,
    });
  }

  return result.data;
}

/**
 * Validation asynchrone
 */
export async function validateAsync<T>(schema: ZodSchema<T>, data: unknown): Promise<T> {
  return validate(schema, data);
}
