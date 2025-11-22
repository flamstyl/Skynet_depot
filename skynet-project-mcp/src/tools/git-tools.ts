/**
 * 🔧 Git Tools
 * MCP Tools pour Git workflow avancé
 */

import { z } from 'zod';
import { GitManager } from '../git-manager.js';

// Schemas
export const gitInitSchema = z.object({
  path: z.string().describe('Chemin du projet'),
});

export const gitStatusSchema = z.object({});

export const gitAddSchema = z.object({
  files: z.union([z.string(), z.array(z.string())]).describe('Fichiers à ajouter'),
});

export const gitCommitSchema = z.object({
  message: z.string().describe('Message de commit'),
});

export const gitBranchListSchema = z.object({});

export const gitBranchCreateSchema = z.object({
  branchName: z.string().describe('Nom de la branche'),
  startPoint: z.string().optional().describe('Point de départ (défaut: HEAD)'),
});

export const gitCheckoutSchema = z.object({
  branchName: z.string().describe('Nom de la branche'),
});

export const gitMergeSchema = z.object({
  branchName: z.string().describe('Branche à merger'),
});

export const gitPullSchema = z.object({
  remote: z.string().optional().describe('Remote (défaut: origin)'),
  branch: z.string().optional().describe('Branche'),
});

export const gitPushSchema = z.object({
  remote: z.string().optional().describe('Remote (défaut: origin)'),
  branch: z.string().optional().describe('Branche'),
  setUpstream: z.boolean().optional().describe('Set upstream (-u)'),
});

export const gitAddRemoteSchema = z.object({
  name: z.string().describe('Nom du remote'),
  url: z.string().describe('URL du remote'),
});

export const gitLogSchema = z.object({
  maxCount: z.number().optional().describe('Nombre de commits max'),
});

export const gitDiffSchema = z.object({
  options: z.array(z.string()).optional().describe('Options de diff'),
});

export const gitStashSchema = z.object({
  command: z.enum(['push', 'pop', 'list']).optional().describe('Commande stash'),
});

// Handlers
export async function gitInit(args: z.infer<typeof gitInitSchema>): Promise<string> {
  try {
    const git = new GitManager(args.path);
    const result = await git.init(args.path);
    return JSON.stringify({ success: true, message: result });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitStatus(args: z.infer<typeof gitStatusSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const status = await git.status();
    return JSON.stringify({ success: true, status }, null, 2);
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitAdd(args: z.infer<typeof gitAddSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const result = await git.add(args.files);
    return JSON.stringify({ success: true, message: result });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitCommit(args: z.infer<typeof gitCommitSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const result = await git.commit(args.message);
    return JSON.stringify({ success: true, message: result });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitBranchList(args: z.infer<typeof gitBranchListSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const branches = await git.listBranches();
    return JSON.stringify({ success: true, branches }, null, 2);
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitBranchCreate(args: z.infer<typeof gitBranchCreateSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const result = await git.createBranch(args.branchName, args.startPoint);
    return JSON.stringify({ success: true, message: result });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitCheckout(args: z.infer<typeof gitCheckoutSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const result = await git.checkout(args.branchName);
    return JSON.stringify({ success: true, message: result });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitMerge(args: z.infer<typeof gitMergeSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const result = await git.merge(args.branchName);
    return JSON.stringify({ success: true, message: result });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitPull(args: z.infer<typeof gitPullSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const result = await git.pull(args.remote, args.branch);
    return JSON.stringify({ success: true, message: result });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitPush(args: z.infer<typeof gitPushSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const result = await git.push(args.remote, args.branch, args.setUpstream);
    return JSON.stringify({ success: true, message: result });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitAddRemote(args: z.infer<typeof gitAddRemoteSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const result = await git.addRemote(args.name, args.url);
    return JSON.stringify({ success: true, message: result });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitLog(args: z.infer<typeof gitLogSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const log = await git.log({ maxCount: args.maxCount || 10 });
    return JSON.stringify({ success: true, log }, null, 2);
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitDiff(args: z.infer<typeof gitDiffSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const diff = await git.diff(args.options);
    return JSON.stringify({ success: true, diff });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

export async function gitStash(args: z.infer<typeof gitStashSchema>): Promise<string> {
  try {
    const git = new GitManager();
    const result = await git.stash(args.command);
    return JSON.stringify({ success: true, message: result });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
