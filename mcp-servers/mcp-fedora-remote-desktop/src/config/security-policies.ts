/**
 * Politiques de sécurité pour Remote Desktop
 */

export const SECURITY_POLICIES = {
  // Ports autorisés
  ALLOWED_PORTS: {
    vnc: [5900, 5901, 5902, 5903],
    rdp: [3389, 3390],
  },

  // Zones firewall par niveau
  FIREWALL_ZONES: {
    secure: ["trusted"], // localhost + SSH tunnel
    moderate: ["home"], // LAN uniquement
    dangerous: ["public"], // Internet (nécessite confirmation)
  },

  // Politique mots de passe
  PASSWORD_POLICY: {
    minLength: 12,
    requireComplexity: true,
    autoGenerateIfWeak: true,
    autoExpireAfterHours: 24, // expiration auto des mots de passe temporaires
  },

  // Timeouts
  TIMEOUTS: {
    defaultAutoStop: 120, // minutes (2h)
    maxSessionDuration: 480, // minutes (8h)
  },

  // SSH Tunnel (recommandé)
  SSH_TUNNEL: {
    preferredMethod: true,
    listenOnLocalhostOnly: true,
  },

  // Multi-host SSH
  SSH_POLICIES: {
    requireKeyAuth: true,
    validateHostKey: true,
    maxConcurrentHosts: 10,
  },

  // Avertissements
  SECURITY_WARNINGS: {
    wanExposure: "⚠️  DANGER: Port exposé sur Internet ! Utilisez un tunnel SSH.",
    weakPassword: "⚠️  Mot de passe faible détecté. Génération automatique recommandée.",
    noEncryption: "⚠️  Encryption désactivée. Connexion non sécurisée.",
  },
} as const;
