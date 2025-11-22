/**
 * Configuration des backends Remote Desktop disponibles
 */

export const BACKEND_DEFINITIONS = {
  "gnome-remote-desktop": {
    name: "GNOME Remote Desktop",
    protocol: "rdp" as const,
    defaultPort: 3389,
    compatibility: {
      wayland: true,
      x11: true,
    },
    packageName: "gnome-remote-desktop",
    serviceUnit: "gnome-remote-desktop.service",
    recommended: true,
    description: "Backend RDP natif pour GNOME (meilleur support Wayland)",
  },
  tigervnc: {
    name: "TigerVNC Server",
    protocol: "vnc" as const,
    defaultPort: 5901,
    compatibility: {
      wayland: false,
      x11: true,
    },
    packageName: "tigervnc-server",
    serviceUnit: "vncserver@:1.service",
    recommended: false,
    description: "Serveur VNC traditionnel (X11 uniquement)",
  },
  wayvnc: {
    name: "WayVNC",
    protocol: "vnc" as const,
    defaultPort: 5900,
    compatibility: {
      wayland: true,
      x11: false,
    },
    packageName: "wayvnc",
    serviceUnit: "wayvnc.service",
    recommended: true,
    description: "Serveur VNC pour Wayland",
  },
  xrdp: {
    name: "xrdp",
    protocol: "rdp" as const,
    defaultPort: 3389,
    compatibility: {
      wayland: false,
      x11: true,
    },
    packageName: "xrdp",
    serviceUnit: "xrdp.service",
    recommended: false,
    description: "Serveur RDP open-source (X11)",
  },
} as const;

export type BackendId = keyof typeof BACKEND_DEFINITIONS;
