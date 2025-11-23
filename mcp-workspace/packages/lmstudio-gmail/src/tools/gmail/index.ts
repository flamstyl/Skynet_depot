import { gmailService } from '../../services/gmail.service.js';
import { GmailListThreadsSchema, GmailGetThreadSchema, GmailSearchSchema, GmailCreateDraftSchema } from '../../models/schemas.js';

export const gmailTools = [
  {
    name: 'gmail_list_threads',
    description: 'Liste les threads Gmail récents',
    inputSchema: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Label Gmail (INBOX, UNREAD, etc.)' },
        maxResults: { type: 'number', default: 50 },
        query: { type: 'string', description: 'Recherche Gmail (ex: from:user@example.com)' },
        pageToken: { type: 'string' },
      },
    },
    execute: async (args: any) => {
      const parsed = GmailListThreadsSchema.parse(args);

      const result = await gmailService.listThreads({
        labelIds: parsed.label ? [parsed.label] : undefined,
        q: parsed.query,
        maxResults: parsed.maxResults,
        pageToken: parsed.pageToken,
      });

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'gmail_get_thread',
    description: 'Récupère un thread Gmail complet',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string' },
      },
      required: ['threadId'],
    },
    execute: async (args: any) => {
      const parsed = GmailGetThreadSchema.parse(args);
      const thread = await gmailService.getThread(parsed.threadId);

      return {
        success: true,
        data: thread,
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'gmail_search',
    description: 'Recherche dans Gmail',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Gmail search query' },
        maxResults: { type: 'number', default: 50 },
      },
      required: ['query'],
    },
    execute: async (args: any) => {
      const parsed = GmailSearchSchema.parse(args);
      const results = await gmailService.search(parsed.query, parsed.maxResults);

      return {
        success: true,
        data: { results, total: results.length },
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'gmail_create_draft',
    description: 'Crée un brouillon Gmail',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'array', items: { type: 'string' } },
        cc: { type: 'array', items: { type: 'string' } },
        bcc: { type: 'array', items: { type: 'string' } },
        subject: { type: 'string' },
        body: { type: 'string' },
        html: { type: 'boolean', default: false },
      },
      required: ['to', 'subject', 'body'],
    },
    execute: async (args: any) => {
      const parsed = GmailCreateDraftSchema.parse(args);
      const draftId = await gmailService.createDraft(parsed);

      return {
        success: true,
        data: { draftId },
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'gmail_list_labels',
    description: 'Liste les labels Gmail',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      const labels = await gmailService.listLabels();

      return {
        success: true,
        data: { labels },
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'gmail_account_info',
    description: 'Informations du compte Gmail',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      const profile = await gmailService.getProfile();

      return {
        success: true,
        data: profile,
        timestamp: new Date().toISOString(),
      };
    },
  },
];
