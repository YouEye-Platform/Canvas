import { appServiceHeaders } from "./service-headers";
/**
 * Canvas API client for YouEye platform endpoints
 *
 * Service-to-service client for YE-UI's internal API.
 *
 * --- Network architecture ---
 * Apps run inside Incus containers that are isolated by ACLs. They do NOT
 * route through Caddy (the reverse proxy). Instead, they reach youeye-ui
 * directly on the container network at http://youeye-ui.youeye:3000.
 *
 * The Control Panel sets YOUEYE_GATEWAY at install time to:
 *   http://youeye-ui.youeye:3000/api/apps/v1
 * This is the canonical way for apps to locate the platform API. The gateway
 * URL is a direct container-to-container path, ACL-allowed by default for
 * all native apps. No internet access or Caddy routing is needed.
 *
 * Resolution order:
 *   1. YOUEYE_API_URL  (explicit override, rare)
 *   2. YOUEYE_GATEWAY  (standard, set by CP at install time)
 *   3. Fail with an error — never fall back to a hardcoded URL
 *
 * Usage:
 *   import { createApiClient } from "@/lib/api";
 *   const api = createApiClient("ye-cinema");
 *   const config = await api.fetchHeaderConfig(userId);
 */

import type { HeaderConfig } from "../types";

function getYouEyeApiUrl(): string {
  if (process.env.YOUEYE_API_URL) return process.env.YOUEYE_API_URL;
  // Derive from YOUEYE_GATEWAY (always set by CP at install time):
  //   http://youeye-ui.youeye:3000/api/apps/v1 → http://youeye-ui.youeye:3000/api/v1
  if (process.env.YOUEYE_GATEWAY) {
    const gw = process.env.YOUEYE_GATEWAY;
    const base = gw.replace(/\/api\/apps\/v\d+$/, "");
    return `${base}/api/v1`;
  }
  throw new Error(
    "Neither YOUEYE_API_URL nor YOUEYE_GATEWAY is set. " +
    "The Control Panel must inject YOUEYE_GATEWAY at install time."
  );
}

export interface YouEyeApiClient {
  /** Fetch header config (branding, apps, notifications, theme) */
  fetchHeaderConfig(userId?: string): Promise<HeaderConfig | null>;
  /** Fetch user notifications */
  fetchNotifications(userId: string, limit?: number): Promise<{ notifications: unknown[]; unread_count: number } | null>;
  /** Get user settings for this app */
  getUserSettings(userId: string): Promise<Record<string, unknown>>;
  /** Save user settings for this app */
  saveUserSettings(userId: string, settings: Record<string, unknown>): Promise<boolean>;
  /** Sync theme mode to YE-UI */
  syncThemeMode(userId: string, mode: string): Promise<boolean>;
  /** Post a timeline entry */
  postTimelineEntry(userId: string, collection: string, data: Record<string, unknown>): Promise<void>;
  /** Raw fetch against the YE-UI API */
  fetch(path: string, options?: RequestInit, userId?: string): Promise<Response>;
}

export function createApiClient(appId: string): YouEyeApiClient {
  const platformAppId = process.env.YOUEYE_APP_ID || appId;
  async function youeyeFetch(path: string, options: RequestInit = {}, userId?: string): Promise<Response> {
    const headers = appServiceHeaders(options.headers, userId);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetch(`${getYouEyeApiUrl()}${path}`, { ...options, headers, redirect: "error" });
  }

  return {
    async fetchHeaderConfig(userId?: string): Promise<HeaderConfig | null> {
      try {
        const res = await youeyeFetch("/header/config", { next: { revalidate: 0 } } as RequestInit, userId);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },

    async fetchNotifications(userId: string, limit = 20) {
      try {
        const res = await youeyeFetch(`/notifications?limit=${limit}`, {}, userId);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },

    async getUserSettings(userId: string): Promise<Record<string, unknown>> {
      try {
        const res = await youeyeFetch(`/apps/${encodeURIComponent(platformAppId)}/user-settings`, {}, userId);
        if (!res.ok) return {};
        const data = await res.json();
        return data.settings ?? {};
      } catch {
        return {};
      }
    },

    async saveUserSettings(userId: string, settings: Record<string, unknown>): Promise<boolean> {
      try {
        const res = await youeyeFetch(`/apps/${encodeURIComponent(platformAppId)}/user-settings`, { method: "PUT", body: JSON.stringify({ settings }) }, userId);
        return res.ok;
      } catch {
        return false;
      }
    },

    async syncThemeMode(userId: string, mode: string): Promise<boolean> {
      try {
        const res = await youeyeFetch("/themes/active", { method: "PUT", body: JSON.stringify({ mode }) }, userId);
        return res.ok;
      } catch {
        return false;
      }
    },

    async postTimelineEntry(userId: string, collection: string, data: Record<string, unknown>) {
      try {
        await youeyeFetch("/timeline", { method: "POST", body: JSON.stringify({ ...data, collection }) }, userId);
      } catch {
        // Non-critical — timeline is best-effort
      }
    },

    fetch: youeyeFetch,
  };
}
