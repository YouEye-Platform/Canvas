/**
 * PWA Manifest Factory — Canvas
 *
 * Creates a dynamic web manifest for a Canvas app.
 * Uses environment variables for app name, platform name, and external URL.
 *
 * Usage in your app's `src/app/manifest.ts`:
 *
 *   import { createAppManifest } from "@/lib/pwa/manifest-factory";
 *   export default function manifest() {
 *     return createAppManifest({
 *       appName: "Cinema",
 *       description: "Personal movie & TV discovery",
 *       themeColor: "#ef4444",
 *     });
 *   }
 */

import type { MetadataRoute } from "next";

interface ManifestOptions {
  /** Default app name (overridden by APP_NAME env var) */
  appName: string;
  /** App description for the manifest */
  description: string;
  /** Theme color (hex, e.g. "#ef4444") */
  themeColor: string;
  /** Background color (defaults to dark) */
  backgroundColor?: string;
  /** Display mode (defaults to "standalone") */
  display?: "standalone" | "fullscreen" | "minimal-ui" | "browser";
}

export function createAppManifest(options: ManifestOptions): MetadataRoute.Manifest {
  const appName = process.env.APP_NAME || options.appName;
  const platformName = process.env.PLATFORM_NAME || "YouEye";

  return {
    name: `${appName} — ${platformName}`,
    short_name: appName,
    description: options.description,
    start_url: "/",
    display: options.display || "standalone",
    background_color: options.backgroundColor || "#0a0a0f",
    theme_color: options.themeColor,
    orientation: "any",
    icons: [
      { src: "/api/pwa/icon?size=192", sizes: "192x192", type: "image/svg+xml" },
      { src: "/api/pwa/icon?size=512", sizes: "512x512", type: "image/svg+xml" },
      { src: "/api/pwa/icon?size=512&maskable=1", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
