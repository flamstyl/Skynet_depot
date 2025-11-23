export const config = {
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || '/tmp/mcp-devops-workspace.log',

  // Paths
  workspaceRoot: process.env.WORKSPACE_ROOT || process.env.HOME + '/projects',

  // Docker
  dockerSocketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  dockerComposeVersion: process.env.DOCKER_COMPOSE_VERSION || 'v2',

  // System
  systemdUserMode: process.env.SYSTEMD_USER_MODE === 'true',

  // Graphics
  imagemagickPath: process.env.IMAGEMAGICK_PATH || '/usr/bin/convert',
  ffmpegPath: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',

  // Security
  allowDangerousOperations: process.env.ALLOW_DANGEROUS_OPS === 'true',
  requireConfirmation: process.env.REQUIRE_CONFIRMATION !== 'false',

  // Rate limiting
  rateLimitPerMinute: parseInt(process.env.RATE_LIMIT || '60', 10),
};

export type Config = typeof config;
