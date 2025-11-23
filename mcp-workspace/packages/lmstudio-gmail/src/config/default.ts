export const config = {
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || '/tmp/mcp-lmstudio-gmail.log',

  // Gmail API
  gmailCredentialsPath: process.env.GMAIL_CREDENTIALS_PATH || './auth/credentials.json',
  gmailTokenPath: process.env.GMAIL_TOKEN_PATH || './auth/tokens.json',
  gmailScopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
  ],

  // LM Studio
  lmstudioBaseUrl: process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1',
  lmstudioModel: process.env.LMSTUDIO_MODEL || 'local-model',
  lmstudioTimeout: parseInt(process.env.LMSTUDIO_TIMEOUT || '30000', 10),

  // Security
  requireLocalLMStudio: process.env.REQUIRE_LOCAL_LMSTUDIO !== 'false',
  maxEmailsPerRequest: parseInt(process.env.MAX_EMAILS_PER_REQUEST || '100', 10),

  // Cache
  cacheTTL: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
};

export type Config = typeof config;
