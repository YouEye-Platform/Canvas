/**
 * Canvas connections — discovery, app proxy, and internet proxy helpers
 *
 * Apps call getConnections() to learn what app connections and internet access
 * they have. Results are cached for 30s.
 *
 * Discovery and backend traffic go through the app gateway with the installed
 * app token. Apps never hardcode target app addresses.
 *
 * Usage:
 *   import { getConnections, getBackend, connectionFetch } from "@/lib/connections";
 *   const conns = await getConnections();
 *   const searxng = getBackend(conns, "searxng");
 *   if (searxng) {
 *     const res = await connectionFetch(searxng.appId, "/search?q=test");
 *   }
 *   const external = await internetFetch("https://example.com/api/status");
 */

export interface Connection {
  appId: string;
  name: string;
  host: string;
  port: number;
  url?: string;
  accessMode?: "network" | "proxy" | "caddy";
  allowedPaths?: string[];
  allowedMethods?: string[];
  direction: "one-way" | "both-ways";
}

export interface AvailableBackend {
  appId: string;
  name: string;
  installed: boolean;
}

export interface InternetStatus {
  granted: boolean;
  hosts: string[];
  blanket: boolean;
}

export interface ConnectionStatus {
  bridges: Connection[];
  internet: InternetStatus;
  available: AvailableBackend[];
}

let _cache: { data: ConnectionStatus; ts: number } | null = null;
const CACHE_TTL = 30_000;

const YOUEYE_APP_ID = process.env.YOUEYE_APP_ID;
const YOUEYE_APP_TOKEN = process.env.YOUEYE_APP_TOKEN;

/** Resolve the YE-UI API URL from env vars. Prefers YOUEYE_API_URL, falls back to YOUEYE_GATEWAY. */
function resolveApiUrl(): string {
  if (process.env.YOUEYE_API_URL) return process.env.YOUEYE_API_URL;
  if (process.env.YOUEYE_GATEWAY) {
    const gw = process.env.YOUEYE_GATEWAY;
    return gw.replace(/\/api\/apps\/v\d+$/, "") + "/api/v1";
  }
  throw new Error(
    "Neither YOUEYE_API_URL nor YOUEYE_GATEWAY is set. " +
    "The Control Panel must inject YOUEYE_GATEWAY at install time."
  );
}

function resolveGatewayUrl(): string {
  if (process.env.YOUEYE_GATEWAY) return process.env.YOUEYE_GATEWAY.replace(/\/$/, "");
  if (process.env.YOUEYE_API_URL) {
    return `${process.env.YOUEYE_API_URL.replace(/\/api\/v\d+$/, "")}/api/apps/v1`;
  }
  throw new Error("YOUEYE_GATEWAY is required for app connection proxying.");
}

/**
 * Fetch the app's current connections from the YE-UI discovery API.
 * Cached for 30 seconds.
 */
export async function getConnections(): Promise<ConnectionStatus> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;

  const empty: ConnectionStatus = {
    bridges: [], internet: { granted: false, hosts: [], blanket: false }, available: [],
  };

  const apiUrl = resolveApiUrl();

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${apiUrl}/my-connections`, {
        headers: {
          "X-YouEye-App": YOUEYE_APP_ID || "",
          ...(YOUEYE_APP_TOKEN ? { Authorization: `Bearer ${YOUEYE_APP_TOKEN}` } : {}),
        },
        cache: "no-store",
      });

      if (!res.ok) return empty;

      const data: ConnectionStatus = await res.json();

      // Retry once if empty — handles cold start where UI hasn't received push yet
      if (attempt === 0 && data.bridges.length === 0 && data.available.length === 0) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      _cache = { data, ts: Date.now() };
      return data;
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      return empty;
    }
  }

  return empty;
}

/** Find a specific backend by appId in the bridges list. */
export function getBackend(conns: ConnectionStatus, appId: string): Connection | null {
  return conns.bridges.find((b) => b.appId === appId) ?? null;
}

/** Build the YouEye proxy URL for a connected backend. */
export function connectionProxyUrl(targetAppId: string, path: string = ""): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveGatewayUrl()}/proxy/${encodeURIComponent(targetAppId)}${normalizedPath}`;
}

/** Build the YouEye internet proxy URL for an approved external HTTPS target. */
export function internetProxyUrl(targetUrl: string): string {
  return `${resolveGatewayUrl()}/internet?url=${encodeURIComponent(targetUrl)}`;
}

export function connectionHeaders(extra?: HeadersInit): HeadersInit {
  const headers = new Headers(extra);
  if (YOUEYE_APP_ID) headers.set("X-YouEye-App", YOUEYE_APP_ID);
  if (YOUEYE_APP_TOKEN) headers.set("Authorization", `Bearer ${YOUEYE_APP_TOKEN}`);
  return headers;
}

export async function connectionFetch(
  targetAppId: string,
  path: string = "",
  init: RequestInit = {},
): Promise<Response> {
  return fetch(connectionProxyUrl(targetAppId, path), {
    ...init,
    headers: connectionHeaders(init.headers),
  });
}

export async function internetFetch(targetUrl: string, init: RequestInit = {}): Promise<Response> {
  return fetch(internetProxyUrl(targetUrl), {
    ...init,
    headers: connectionHeaders(init.headers),
  });
}

/** Invalidate the connection cache (e.g. after requesting a bridge). */
export function invalidateCache(): void {
  _cache = null;
}
