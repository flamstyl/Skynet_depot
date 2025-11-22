import Docker from 'dockerode';
import { logger } from '../../lib/logger.js';
import { validate } from '../../lib/validator.js';
import { ExecutionError } from '../../lib/errors.js';
import { ListImagesSchema } from '../../schemas/docker.js';

const docker = new Docker();

export async function listImages(input: unknown) {
  const params = validate(ListImagesSchema, input);

  logger.info('Listing Docker images', params);

  try {
    const filters: any = {};

    if (params.filters?.dangling !== undefined) {
      filters.dangling = [params.filters.dangling.toString()];
    }
    if (params.filters?.reference) {
      filters.reference = [params.filters.reference];
    }

    const images = await docker.listImages({
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    let totalSize = 0;

    const result = images.map((image) => {
      totalSize += image.Size;

      return {
        id: image.Id,
        tags: image.RepoTags || [],
        size: image.Size,
        created: new Date(image.Created * 1000).toISOString(),
      };
    });

    logger.info('Images listed', { total: result.length, totalSize });

    return {
      images: result,
      total: result.length,
      totalSize,
    };
  } catch (error: any) {
    logger.error('Failed to list images', { error: error.message });
    throw new ExecutionError(`Failed to list images: ${error.message}`);
  }
}
