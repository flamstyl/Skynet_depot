import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { config } from '../config.js';
import { logger } from './logger.js';
import { AuthenticationError, ExecutionError } from './errors.js';

export class GoogleDriveClient {
  private oauth2Client: OAuth2Client;
  private drive: drive_v3.Drive | null = null;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRedirectUri
    );
  }

  async initialize() {
    // Charger les tokens sauvegardés
    if (existsSync(config.credentialsPath)) {
      try {
        const tokensStr = await readFile(config.credentialsPath, 'utf-8');
        const tokens = JSON.parse(tokensStr);
        this.oauth2Client.setCredentials(tokens);

        this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });

        logger.info('Google Drive client initialized with saved credentials');
      } catch (error) {
        logger.error('Failed to load credentials', { error });
        throw new AuthenticationError('Failed to load Google Drive credentials');
      }
    } else {
      throw new AuthenticationError(
        'No credentials found. Please authenticate first using getAuthUrl() and saveCredentials()'
      );
    }
  }

  getAuthUrl(): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive'],
    });

    return authUrl;
  }

  async saveCredentials(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    await writeFile(config.credentialsPath, JSON.stringify(tokens, null, 2));

    this.oauth2Client.setCredentials(tokens);
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    logger.info('Credentials saved successfully');
  }

  async listFiles(options: {
    path?: string;
    mimeType?: string;
    maxResults?: number;
  }): Promise<drive_v3.Schema$File[]> {
    if (!this.drive) throw new AuthenticationError('Drive client not initialized');

    let query = "trashed=false";

    if (options.mimeType) {
      query += ` and mimeType='${options.mimeType}'`;
    }

    if (options.path) {
      // Rechercher le dossier par nom
      const folderQuery = `name='${options.path}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const folderResult = await this.drive.files.list({
        q: folderQuery,
        fields: 'files(id)',
      });

      if (folderResult.data.files && folderResult.data.files.length > 0) {
        const folderId = folderResult.data.files[0].id;
        query += ` and '${folderId}' in parents`;
      }
    }

    const result = await this.drive.files.list({
      q: query,
      pageSize: options.maxResults || 100,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
    });

    return result.data.files || [];
  }

  async readFile(fileId: string): Promise<string> {
    if (!this.drive) throw new AuthenticationError('Drive client not initialized');

    try {
      // Récupérer les métadonnées
      const metadata = await this.drive.files.get({ fileId, fields: 'mimeType,name' });
      const mimeType = metadata.data.mimeType || '';

      // Convertir les Google Docs en texte
      if (mimeType === 'application/vnd.google-apps.document') {
        const response = await this.drive.files.export({
          fileId,
          mimeType: 'text/plain',
        });
        return response.data as string;
      } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        const response = await this.drive.files.export({
          fileId,
          mimeType: 'text/csv',
        });
        return response.data as string;
      } else {
        // Télécharger le fichier brut
        const response = await this.drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'text' }
        );
        return response.data as string;
      }
    } catch (error: any) {
      logger.error('Failed to read file from Drive', { fileId, error: error.message });
      throw new ExecutionError(`Failed to read file: ${error.message}`);
    }
  }

  async writeFile(path: string, content: string, options: { mimeType?: string; append?: boolean }): Promise<string> {
    if (!this.drive) throw new AuthenticationError('Drive client not initialized');

    try {
      const fileName = path.split('/').pop() || 'untitled';
      const folderPath = path.substring(0, path.lastIndexOf('/'));

      let folderId: string | undefined;

      // Créer/trouver le dossier
      if (folderPath) {
        folderId = await this.createFolder(folderPath);
      }

      // Chercher si le fichier existe
      let query = `name='${fileName}' and trashed=false`;
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      const existing = await this.drive.files.list({ q: query, fields: 'files(id)' });

      if (existing.data.files && existing.data.files.length > 0 && options.append) {
        // Append : lire le contenu existant et ajouter
        const existingContent = await this.readFile(existing.data.files[0].id!);
        content = existingContent + content;
      }

      const media = {
        mimeType: options.mimeType || 'text/plain',
        body: content,
      };

      if (existing.data.files && existing.data.files.length > 0) {
        // Mettre à jour
        const result = await this.drive.files.update({
          fileId: existing.data.files[0].id!,
          media,
        });
        return result.data.id!;
      } else {
        // Créer
        const result = await this.drive.files.create({
          requestBody: {
            name: fileName,
            parents: folderId ? [folderId] : undefined,
          },
          media,
          fields: 'id',
        });
        return result.data.id!;
      }
    } catch (error: any) {
      logger.error('Failed to write file to Drive', { path, error: error.message });
      throw new ExecutionError(`Failed to write file: ${error.message}`);
    }
  }

  private async createFolder(folderPath: string): Promise<string> {
    if (!this.drive) throw new AuthenticationError('Drive client not initialized');

    const parts = folderPath.split('/').filter((p) => p);
    let parentId: string | undefined;

    for (const part of parts) {
      let query = `name='${part}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const existing = await this.drive.files.list({ q: query, fields: 'files(id)' });

      if (existing.data.files && existing.data.files.length > 0) {
        parentId = existing.data.files[0].id!;
      } else {
        const result = await this.drive.files.create({
          requestBody: {
            name: part,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : undefined,
          },
          fields: 'id',
        });
        parentId = result.data.id!;
      }
    }

    return parentId!;
  }
}
