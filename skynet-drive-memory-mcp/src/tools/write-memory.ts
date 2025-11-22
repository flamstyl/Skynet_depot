import { GoogleDriveClient } from '../lib/drive-client.js';
import { logger } from '../lib/logger.js';
import { WriteMemorySchema, type WriteMemoryInput } from '../schemas/drive.js';

export async function writeMemory(driveClient: GoogleDriveClient, input: unknown) {
  const params = WriteMemorySchema.parse(input);

  logger.info('Writing memory to Google Drive', { path: params.path, append: params.append });

  const fileId = await driveClient.writeFile(params.path, params.content, {
    mimeType: params.mimeType,
    append: params.append,
  });

  // Récupérer les métadonnées du fichier créé/mis à jour
  const files = await driveClient.listFiles({ maxResults: 1 });
  const createdFile = files.find((f) => f.id === fileId);

  const result = {
    success: true,
    fileId,
    path: params.path,
    size: parseInt(createdFile?.size || '0', 10),
    webViewLink: createdFile?.webViewLink || '',
  };

  logger.info('Memory written to Google Drive', result);

  return result;
}
