/**
 * Configuration des commandes système autorisées (whitelist)
 */

export const ALLOWED_COMMANDS = {
  // Commandes Docker
  docker: [
    "ps",
    "ps -a",
    "logs",
    "start",
    "stop",
    "restart",
    "images",
    "inspect",
    "stats --no-stream",
  ],

  // Commandes systemd
  systemctl: [
    "status",
    "is-active",
    "is-enabled",
    "list-units",
    "list-unit-files",
    "restart", // nécessite confirmation
    "stop", // nécessite confirmation
    "start", // nécessite confirmation
  ],

  // Commandes Git
  git: [
    "init",
    "status",
    "add",
    "commit",
    "push",
    "pull",
    "branch",
    "checkout",
    "log",
    "diff",
    "remote",
    "clone",
  ],

  // Commandes Python
  python: ["--version", "-m venv", "-m pip install", "-m pip list"],

  // Commandes Node
  npm: ["install", "run", "test", "build", "init", "list"],
  yarn: ["install", "run", "test", "build", "init", "list"],
  pnpm: ["install", "run", "test", "build", "init", "list"],

  // Commandes ImageMagick
  convert: ["-resize", "-quality", "-format", "-thumbnail"],
  identify: ["-format", "-verbose"],

  // Commandes système info
  system: [
    "uname -a",
    "uptime",
    "hostname",
    "df -h",
    "free -h",
    "nproc",
    "lscpu",
    "lsb_release -a",
  ],
} as const;

export type CommandCategory = keyof typeof ALLOWED_COMMANDS;

export function isCommandAllowed(
  category: CommandCategory,
  command: string
): boolean {
  const allowedCommands = ALLOWED_COMMANDS[category];
  return allowedCommands.some((allowed) => command.startsWith(allowed));
}
