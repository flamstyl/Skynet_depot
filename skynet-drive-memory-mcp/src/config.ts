import { join } from 'path';

export interface Config {
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  credentialsPath: string;
  embeddingMode: 'cloudflare' | 'local';
  cloudflare?: {
    apiKey: string;
    accountId: string;
    model: string;
  };
  cacheDir: string;
  cacheEmbeddings: boolean;
  logLevel: string;
  logFile: string;
  maxFileSizeMB: number;
  maxFilesToScan: number;
}

export const config: Config = {
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback',
  credentialsPath: process.env.CREDENTIALS_PATH || './credentials/tokens.json',
  embeddingMode: (process.env.EMBEDDING_MODE as 'cloudflare' | 'local') || 'local',
  cloudflare: process.env.CLOUDFLARE_API_KEY
    ? {
        apiKey: process.env.CLOUDFLARE_API_KEY,
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
        model: process.env.CLOUDFLARE_MODEL || '@cf/baai/bge-base-en-v1.5',
      }
    : undefined,
  cacheDir: process.env.CACHE_DIR || './cache',
  cacheEmbeddings: process.env.CACHE_EMBEDDINGS !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || '/var/log/skynet-drive-memory-mcp.log',
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  maxFilesToScan: parseInt(process.env.MAX_FILES_TO_SCAN || '1000', 10),
};
