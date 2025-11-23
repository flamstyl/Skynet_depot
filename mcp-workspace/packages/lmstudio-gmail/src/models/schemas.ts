import { z } from 'zod';

// Gmail Tools Schemas
export const GmailListThreadsSchema = z.object({
  label: z.string().optional(),
  maxResults: z.number().int().min(1).max(500).default(50),
  query: z.string().optional(),
  pageToken: z.string().optional(),
});

export const GmailGetThreadSchema = z.object({
  threadId: z.string(),
});

export const GmailSearchSchema = z.object({
  query: z.string(),
  maxResults: z.number().int().min(1).max(500).default(50),
});

export const GmailCreateDraftSchema = z.object({
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1).max(500),
  body: z.string(),
  html: z.boolean().default(false),
});

export const GmailApplyLabelsSchema = z.object({
  messageId: z.string().optional(),
  threadId: z.string().optional(),
  add: z.array(z.string()).optional(),
  remove: z.array(z.string()).optional(),
});

// LM Studio Tools Schemas
export const LMStudioSummarizeSchema = z.object({
  threadId: z.string(),
  options: z.object({
    length: z.enum(['short', 'medium', 'long']).default('medium'),
    language: z.string().default('fr'),
    format: z.enum(['bullets', 'narrative']).default('bullets'),
    includeActions: z.boolean().default(true),
  }).optional(),
});

export const LMStudioProposeReplySchema = z.object({
  threadId: z.string(),
  context: z.string().optional(),
  count: z.number().int().min(1).max(5).default(3),
  style: z.enum(['formal', 'friendly', 'neutral']).default('neutral'),
});

export const LMStudioDailyDigestSchema = z.object({
  date: z.string().optional(),
  labels: z.array(z.string()).optional(),
  maxEmails: z.number().int().min(1).max(200).default(100),
});

export const LMStudioClassifySchema = z.object({
  messageId: z.string(),
  categories: z.array(z.string()).optional(),
});
