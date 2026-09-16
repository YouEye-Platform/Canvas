import { APP_VERSION } from "@/lib/app-config";
/**
 * Canvas manifest endpoint factory
 *
 * Usage:
 *   import { createManifestHandler } from "@/lib/routes/manifest";
 *   export const GET = createManifestHandler({
 *     id: "ye-cinema",
 *     name: "Cinema",
 *     description: "Movie & TV discovery",
 *     icon: "Film",
 *     permissions: ["timeline:write", "widgets:register"],
 *     surfaceSchemaVersion: 1,
 *     surfaces: [...],
 *   });
 */

import { NextResponse } from "next/server";
import type { AppManifest } from "../../types";

export function createManifestHandler(manifest: AppManifest) {
  return async function GET() {
    return NextResponse.json({
      surfaceSchemaVersion: 1,
      ...manifest,
      version: APP_VERSION,
    });
  };
}
