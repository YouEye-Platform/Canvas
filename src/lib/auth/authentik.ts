/**
 * YouEye ID OAuth2 client — identical across Canvas native apps.
 *
 * IDENTITY_URL is the public/external URL used for browser redirects
 * (the authorize endpoint). IDENTITY_INTERNAL_URL is used for
 * server-to-server calls (token exchange, userinfo) — these go over
 * the Incus container network, NOT through Caddy, so they must use
 * the internal container address.
 *
 * Env vars required:
 *   IDENTITY_CLIENT_ID, IDENTITY_CLIENT_SECRET, IDENTITY_URL
 * Optional:
 *   IDENTITY_INTERNAL_URL (defaults to IDENTITY_URL — should always
 *   be set in production for reliable container-to-container routing)
 *
 * AUTHENTIK_* aliases are accepted only so existing forks can update without
 * breaking before their manifest/env mapping is renamed.
 */

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
}

export function getOAuthConfig(): OAuthConfig | null {
  const clientId = process.env.IDENTITY_CLIENT_ID || process.env.AUTHENTIK_CLIENT_ID;
  const clientSecret = process.env.IDENTITY_CLIENT_SECRET || process.env.AUTHENTIK_CLIENT_SECRET;
  const identityUrl = process.env.IDENTITY_URL || process.env.AUTHENTIK_URL;
  const internalUrl =
    process.env.IDENTITY_INTERNAL_URL ||
    process.env.AUTHENTIK_INTERNAL_URL ||
    identityUrl;

  if (!clientId || !clientSecret || !identityUrl) return null;

  return {
    clientId,
    clientSecret,
    authorizeUrl: `${identityUrl}/application/o/authorize/`,
    tokenUrl: `${internalUrl}/application/o/token/`,
    userinfoUrl: `${internalUrl}/application/o/userinfo/`,
  };
}

export function getIdentityUrl(): string {
  return process.env.IDENTITY_URL || process.env.AUTHENTIK_URL || "";
}

export function buildAuthorizeUrl(config: OAuthConfig, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email groups",
    state,
  });
  return `${config.authorizeUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  config: OAuthConfig,
  code: string,
  redirectUri: string
): Promise<{ access_token: string } | null> {
  try {
    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchUserInfo(
  config: OAuthConfig,
  accessToken: string
): Promise<{
  sub: string;
  preferred_username: string;
  name: string;
  email: string;
  groups: string[];
} | null> {
  try {
    const res = await fetch(config.userinfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function generateOAuthState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isSSOConfigured(): boolean {
  return !!(
    (process.env.IDENTITY_CLIENT_ID || process.env.AUTHENTIK_CLIENT_ID) &&
    (process.env.IDENTITY_CLIENT_SECRET || process.env.AUTHENTIK_CLIENT_SECRET) &&
    (process.env.IDENTITY_URL || process.env.AUTHENTIK_URL)
  );
}
