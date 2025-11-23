import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/default.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Service Gmail (via googleapis)
 */
export class GmailService {
  private auth: OAuth2Client | null = null;
  private gmail: any = null;

  /**
   * Initialise l'authentification OAuth2
   */
  async initialize(): Promise<void> {
    try {
      // Charge credentials
      const credsPath = path.resolve(config.gmailCredentialsPath);
      const credentials = JSON.parse(await fs.readFile(credsPath, 'utf-8'));

      const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

      this.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      // Charge tokens
      const tokenPath = path.resolve(config.gmailTokenPath);
      try {
        const tokens = JSON.parse(await fs.readFile(tokenPath, 'utf-8'));
        this.auth.setCredentials(tokens);
        logger.info('OAuth tokens chargés avec succès');
      } catch {
        throw new Error(
          'Tokens OAuth introuvables. Exécute : npm run setup-oauth'
        );
      }

      this.gmail = google.gmail({ version: 'v1', auth: this.auth });
      logger.info('Gmail service initialisé');
    } catch (error: any) {
      logger.error('Erreur initialisation Gmail', { error: error.message });
      throw error;
    }
  }

  /**
   * Liste les threads
   */
  async listThreads(params: {
    labelIds?: string[];
    q?: string;
    maxResults?: number;
    pageToken?: string;
  }): Promise<any> {
    if (!this.gmail) await this.initialize();

    const response = await this.gmail.users.threads.list({
      userId: 'me',
      ...params,
    });

    return {
      threads: response.data.threads || [],
      nextPageToken: response.data.nextPageToken,
    };
  }

  /**
   * Récupère un thread complet
   */
  async getThread(threadId: string): Promise<any> {
    if (!this.gmail) await this.initialize();

    const response = await this.gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    });

    const thread = response.data;

    // Parse messages
    const messages = thread.messages.map((msg: any) => ({
      id: msg.id,
      threadId: msg.threadId,
      labelIds: msg.labelIds,
      snippet: msg.snippet,
      date: new Date(parseInt(msg.internalDate, 10)).toISOString(),
      ...this.parseMessage(msg),
    }));

    return {
      id: thread.id,
      subject: messages[0]?.subject || 'No Subject',
      participants: [...new Set(messages.flatMap((m: any) => [m.from, ...m.to]))],
      messages,
      labels: thread.messages[0]?.labelIds || [],
    };
  }

  /**
   * Parse un message Gmail
   */
  private parseMessage(message: any): any {
    const headers = message.payload.headers;
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const body = this.decodeBody(message.payload);

    return {
      from: getHeader('from'),
      to: getHeader('to').split(',').map((s: string) => s.trim()),
      cc: getHeader('cc').split(',').filter(Boolean),
      subject: getHeader('subject'),
      body,
    };
  }

  /**
   * Décode le body d'un message
   */
  private decodeBody(payload: any): string {
    let body = '';

    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return body.trim();
  }

  /**
   * Recherche dans Gmail
   */
  async search(query: string, maxResults = 50): Promise<any[]> {
    if (!this.gmail) await this.initialize();

    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    return response.data.messages || [];
  }

  /**
   * Crée un brouillon
   */
  async createDraft(params: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    html?: boolean;
  }): Promise<string> {
    if (!this.gmail) await this.initialize();

    const message = [
      `To: ${params.to.join(', ')}`,
      params.cc ? `Cc: ${params.cc.join(', ')}` : '',
      params.bcc ? `Bcc: ${params.bcc.join(', ')}` : '',
      `Subject: ${params.subject}`,
      `Content-Type: text/${params.html ? 'html' : 'plain'}; charset=utf-8`,
      '',
      params.body,
    ]
      .filter(Boolean)
      .join('\n');

    const encodedMessage = Buffer.from(message).toString('base64url');

    const response = await this.gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
        },
      },
    });

    logger.info(`Draft créé : ${response.data.id}`);
    return response.data.id;
  }

  /**
   * Liste les labels
   */
  async listLabels(): Promise<any[]> {
    if (!this.gmail) await this.initialize();

    const response = await this.gmail.users.labels.list({
      userId: 'me',
    });

    return response.data.labels || [];
  }

  /**
   * Applique des labels
   */
  async modifyLabels(
    messageId: string,
    addLabels: string[] = [],
    removeLabels: string[] = []
  ): Promise<void> {
    if (!this.gmail) await this.initialize();

    await this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: addLabels,
        removeLabelIds: removeLabels,
      },
    });

    logger.info(`Labels modifiés pour message ${messageId}`);
  }

  /**
   * Infos du compte
   */
  async getProfile(): Promise<any> {
    if (!this.gmail) await this.initialize();

    const response = await this.gmail.users.getProfile({
      userId: 'me',
    });

    return {
      email: response.data.emailAddress,
      messagesTotal: response.data.messagesTotal,
      threadsTotal: response.data.threadsTotal,
    };
  }
}

export const gmailService = new GmailService();
