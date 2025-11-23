import { gmailService } from '../../services/gmail.service.js';
import { lmstudioService } from '../../services/lmstudio.service.js';
import { PROMPTS } from '../../models/prompts.js';
import { LMStudioSummarizeSchema, LMStudioProposeReplySchema, LMStudioDailyDigestSchema, LMStudioClassifySchema } from '../../models/schemas.js';

export const lmstudioTools = [
  {
    name: 'lmstudio_summarize_thread',
    description: 'Résume un thread Gmail avec LM Studio',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string' },
        options: {
          type: 'object',
          properties: {
            length: { type: 'string', enum: ['short', 'medium', 'long'], default: 'medium' },
            language: { type: 'string', default: 'fr' },
            format: { type: 'string', enum: ['bullets', 'narrative'], default: 'bullets' },
            includeActions: { type: 'boolean', default: true },
          },
        },
      },
      required: ['threadId'],
    },
    execute: async (args: any) => {
      const parsed = LMStudioSummarizeSchema.parse(args);

      // Récupère le thread
      const thread = await gmailService.getThread(parsed.threadId);

      // Génère le prompt
      const prompt = PROMPTS.summarizeThread(thread.messages, parsed.options);

      // Appelle LM Studio
      const result = await lmstudioService.completeJSON(prompt);

      return {
        success: true,
        data: {
          threadId: parsed.threadId,
          ...result,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'lmstudio_propose_reply',
    description: 'Génère des propositions de réponse avec LM Studio',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string' },
        context: { type: 'string' },
        count: { type: 'number', default: 3 },
        style: { type: 'string', enum: ['formal', 'friendly', 'neutral'], default: 'neutral' },
      },
      required: ['threadId'],
    },
    execute: async (args: any) => {
      const parsed = LMStudioProposeReplySchema.parse(args);

      const thread = await gmailService.getThread(parsed.threadId);
      const prompt = PROMPTS.proposeReply(thread, parsed.context, parsed.style);

      const result = await lmstudioService.completeJSON(prompt);

      return {
        success: true,
        data: {
          threadId: parsed.threadId,
          ...result,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'lmstudio_daily_digest',
    description: 'Génère un digest quotidien de la boîte mail',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
        labels: { type: 'array', items: { type: 'string' } },
        maxEmails: { type: 'number', default: 100 },
      },
    },
    execute: async (args: any) => {
      const parsed = LMStudioDailyDigestSchema.parse(args);

      const date = parsed.date || new Date().toISOString().split('T')[0];
      const query = `after:${date}`;

      const messages = await gmailService.search(query, parsed.maxEmails);

      // Récupère les détails de chaque message (limité pour ne pas surcharger)
      const emailsData = await Promise.all(
        messages.slice(0, 50).map(async (msg: any) => {
          const thread = await gmailService.getThread(msg.threadId);
          return thread.messages[0]; // Premier message du thread
        })
      );

      const prompt = PROMPTS.dailyDigest(emailsData, date);
      const result = await lmstudioService.completeJSON(prompt);

      return {
        success: true,
        data: {
          date,
          totalEmails: messages.length,
          analyzed: emailsData.length,
          ...result,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },

  {
    name: 'lmstudio_classify_email',
    description: 'Classifie un email avec LM Studio',
    inputSchema: {
      type: 'object',
      properties: {
        messageId: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
      },
      required: ['messageId'],
    },
    execute: async (args: any) => {
      const parsed = LMStudioClassifySchema.parse(args);

      // Récupère le message (via son thread)
      const thread = await gmailService.getThread(parsed.messageId);
      const message = thread.messages.find((m: any) => m.id === parsed.messageId) || thread.messages[0];

      const categories = parsed.categories || ['work', 'personal', 'newsletter', 'spam', 'important'];

      const prompt = PROMPTS.classifyEmail(message, categories);
      const result = await lmstudioService.completeJSON(prompt);

      return {
        success: true,
        data: {
          messageId: parsed.messageId,
          ...result,
        },
        timestamp: new Date().toISOString(),
      };
    },
  },
];
