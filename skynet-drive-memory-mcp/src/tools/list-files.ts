import { GoogleDriveClient } from '../lib/drive-client.js';
import { logger } from '../lib/logger.js';
import { ListFilesSchema, type ListFilesInput } from '../schemas/drive.js';

export async function listFiles(driveClient: GoogleDriveClient, input: unknown) {
  const params = ListFilesSchema.parse(input);

  logger.info('Listing files from Google Drive', params);

  const files = await driveClient.listFiles({
    path: params.path,
    mimeType: params.mimeType,
    maxResults: params.maxResults,
  });

  const result = {
    files: files.map((file) => ({
      id: file.id!,
      name: file.name!,
      path: file.name!,
      mimeType: file.mimeType!,
      size: parseInt(file.size || '0', 10),
      modifiedTime: file.modifiedTime!,
      webViewLink: file.webViewLink || '',
    })),
    total: files.length,
  };

  logger.info('Files listed from Google Drive', { total: result.total });

  return result;
}
