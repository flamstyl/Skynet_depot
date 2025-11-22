/**
 * Tool MCP : Lister les containers Docker
 */

import { dockerService } from "../../services/docker-service.js";
import {
  ListContainersInputSchema,
  ListContainersOutputSchema,
} from "../../models/schemas.js";

export async function listContainers(input: unknown) {
  const params = ListContainersInputSchema.parse(input);

  const containers = await dockerService.listContainers(
    params.all,
    params.filters
  );

  return ListContainersOutputSchema.parse({
    containers,
  });
}

export const listContainersTool = {
  name: "list_containers",
  description: "Liste les containers Docker (actifs ou tous)",
  inputSchema: ListContainersInputSchema,
  outputSchema: ListContainersOutputSchema,
  handler: listContainers,
};
