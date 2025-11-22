/**
 * Tool MCP : Git status
 */

import { gitService } from "../../services/git-service.js";
import {
  GitStatusInputSchema,
  GitStatusOutputSchema,
} from "../../models/schemas.js";

export async function gitStatus(input: unknown) {
  const params = GitStatusInputSchema.parse(input);

  const status = await gitService.getStatus(params.projectPath);

  return GitStatusOutputSchema.parse(status);
}

export const gitStatusTool = {
  name: "git_status",
  description: "Récupère le statut Git d'un projet (branch, fichiers modifiés, etc.)",
  inputSchema: GitStatusInputSchema,
  outputSchema: GitStatusOutputSchema,
  handler: gitStatus,
};
