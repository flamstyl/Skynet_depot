/**
 * Tool MCP : Détecter l'environnement de bureau
 */

import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { BACKEND_DEFINITIONS } from "../../config/backends.js";

const execAsync = promisify(exec);

const DetectEnvironmentInputSchema = z.object({});

const DetectEnvironmentOutputSchema = z.object({
  displayServer: z.enum(["wayland", "x11", "unknown"]),
  desktopEnvironment: z.string(),
  sessionType: z.string(),
  installedBackends: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      protocol: z.enum(["vnc", "rdp"]),
      installed: z.boolean(),
      compatible: z.boolean(),
      recommended: z.boolean(),
    })
  ),
  recommendation: z.object({
    backendId: z.string(),
    reason: z.string(),
  }),
});

export async function detectEnvironment(input: unknown) {
  DetectEnvironmentInputSchema.parse(input);

  // Détecter le serveur d'affichage
  let displayServer: "wayland" | "x11" | "unknown" = "unknown";
  const sessionType = process.env.XDG_SESSION_TYPE || "unknown";

  if (sessionType === "wayland") {
    displayServer = "wayland";
  } else if (sessionType === "x11") {
    displayServer = "x11";
  } else {
    // Fallback : vérifier WAYLAND_DISPLAY
    if (process.env.WAYLAND_DISPLAY) {
      displayServer = "wayland";
    } else if (process.env.DISPLAY) {
      displayServer = "x11";
    }
  }

  // Détecter le desktop environment
  const desktopEnvironment =
    process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION || "unknown";

  // Vérifier quels backends sont installés
  const installedBackends = [];
  for (const [id, backend] of Object.entries(BACKEND_DEFINITIONS)) {
    const isInstalled = await checkBackendInstalled(backend.packageName);
    const isCompatible =
      (displayServer === "wayland" && backend.compatibility.wayland) ||
      (displayServer === "x11" && backend.compatibility.x11);

    installedBackends.push({
      id,
      name: backend.name,
      protocol: backend.protocol,
      installed: isInstalled,
      compatible: isCompatible,
      recommended: backend.recommended && isCompatible,
    });
  }

  // Déterminer la recommandation
  let recommendation = {
    backendId: "",
    reason: "",
  };

  if (displayServer === "wayland") {
    recommendation = {
      backendId: "gnome-remote-desktop",
      reason: "Meilleur support Wayland natif avec RDP",
    };
  } else if (displayServer === "x11") {
    recommendation = {
      backendId: "tigervnc",
      reason: "VNC classique bien supporté sur X11",
    };
  } else {
    recommendation = {
      backendId: "gnome-remote-desktop",
      reason: "Backend universel (fallback)",
    };
  }

  return DetectEnvironmentOutputSchema.parse({
    displayServer,
    desktopEnvironment,
    sessionType,
    installedBackends,
    recommendation,
  });
}

async function checkBackendInstalled(packageName: string): Promise<boolean> {
  try {
    await execAsync(`rpm -q ${packageName}`);
    return true;
  } catch {
    return false;
  }
}

export const detectEnvironmentTool = {
  name: "detect_environment",
  description:
    "Détecte l'environnement de bureau (Wayland/X11) et les backends remote desktop disponibles",
  inputSchema: DetectEnvironmentInputSchema,
  outputSchema: DetectEnvironmentOutputSchema,
  handler: detectEnvironment,
};
