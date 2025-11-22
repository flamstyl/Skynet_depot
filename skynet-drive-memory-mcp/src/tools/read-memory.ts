import { GoogleDriveClient } from '../lib/drive-client.js';
import { logger } from '../lib/logger.js';
import { ReadMemorySchema, type ReadMemoryInput } from '../schemas/drive.js';

export async function readMemory(driveClient: GoogleDriveClient, input: unknown) {
  const params = ReadMemorySchema.parse(input);

  logger.info('Reading memory from Google Drive', params);

  // Lister les fichiers correspondants
  const files = await driveClient.listFiles({
    path: params.path,
    maxResults: 100,
  });

  // Filtrer par pattern si fourni
  let filteredFiles = files;

  if (params.match) {
    const regex = new RegExp(params.match.replace(/\*/g, '.*'), 'i');
    filteredFiles = files.filter((f) => regex.test(f.name!));
  }

  // Lire le contenu de chaque fichier
  const results = [];

  for (const file of filteredFiles) {
    try {
      const content = await driveClient.readFile(file.id!);

      results.push({
        path: file.name!,
        content,
        mimeType: file.mimeType!,
        size: parseInt(file.size || '0', 10),
        modifiedTime: file.modifiedTime!,
      });
    } catch (error: any) {
      logger.warn('Failed to read file', { fileId: file.id, error: error.message });
    }
  }

  logger.info('Memory read from Google Drive', { filesRead: results.length });

  return { files: results };
}
