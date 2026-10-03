/**
 * Canvas auth route handlers
 *
 * Usage in this fork:
 *   // src/app/api/auth/sso/route.ts
 *   import { createSSOHandler } from "@/lib/routes/auth";
 *
 * The route files in src/app/api/auth/* already wire these factories to
 * APP_ID and APP_EXTERNAL_URL_ENV from "@/lib/app-config".
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getOAuthConfig,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchUserInfo,
  generateOAuthState,
  getIdentityUrl,
} from "../../auth/authentik";
import { createSession } from "../../auth/session";

interface AuthRouteConfig {
  /** App ID, e.g. "ye-cinema" */
  appId: string;
  /** Env var name for the external URL. Canvas defaults to APP_EXTERNAL_URL. */
  externalUrlEnv: string;
}

/**
 * Derive the session cookie name from the app ID.
 * This MUST NOT rely on initSession() global state — route handlers run in
 * the Node.js runtime, while initSession() is typically called in middleware
 * (Edge runtime). The two runtimes do not share module-level variables.
 */
function sessionCookieName(appId: string): string {
  return appId.startsWith("ye-") ? `${appId}-session` : `ye-${appId}-session`;
}

/** Creates GET /api/auth/sso handler */
export function createSSOHandler(config: AuthRouteConfig) {
  return async function GET() {
    const oauthConfig = getOAuthConfig();
    if (!oauthConfig) return NextResponse.json({ error: "SSO not configured" }, { status: 503 });

    const state = generateOAuthState();
    const externalUrl = process.env[config.externalUrlEnv] || "";
    const redirectUri = `${externalUrl}/api/auth/callback`;
    const authorizeUrl = buildAuthorizeUrl(oauthConfig, redirectUri, state);

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set(`${config.appId}-oauth-state`, state, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES !== "false",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  };
}

/** Creates GET /api/auth/callback handler */
export function createCallbackHandler(config: AuthRouteConfig) {
  return async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = request.cookies.get(`${config.appId}-oauth-state`)?.value;

    // Use the configured external URL for all redirects — request.url resolves
    // to the container's internal address (e.g. http://0.0.0.0:3000) behind a
    // reverse proxy, which would redirect the user to an unreachable address.
    const baseUrl = process.env[config.externalUrlEnv] || process.env.NEXT_PUBLIC_APP_URL || "";
    const ssoRedirect = baseUrl ? `${baseUrl}/api/auth/sso` : new URL("/api/auth/sso", request.url).toString();

    if (!code || !state || state !== storedState) {
      return NextResponse.redirect(ssoRedirect);
    }

    const oauthConfig = getOAuthConfig();
    if (!oauthConfig) return NextResponse.json({ error: "SSO not configured" }, { status: 503 });

    const externalUrl = baseUrl || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const redirectUri = `${externalUrl}/api/auth/callback`;

    const tokenData = await exchangeCodeForToken(oauthConfig, code, redirectUri);
    if (!tokenData) return NextResponse.redirect(ssoRedirect);

    const userInfo = await fetchUserInfo(oauthConfig, tokenData.access_token);
    if (!userInfo) return NextResponse.redirect(ssoRedirect);
    if (!userInfo.sid) return NextResponse.redirect(ssoRedirect);

    const isAdmin = (userInfo.groups || []).some((g: string) => g.toLowerCase().includes("admin"));
    const sessionToken = await createSession({
      userId: userInfo.sub,
      identitySessionId: userInfo.sid,
      username: userInfo.preferred_username || userInfo.name || "user",
      name: userInfo.name || userInfo.preferred_username || "User",
      email: userInfo.email || "",
      isAdmin,
      groups: userInfo.groups || [],
    });

    const externalRoot = process.env[config.externalUrlEnv] ?? new URL("/", request.url).origin;
    const response = NextResponse.redirect(`${externalRoot}/`);
    response.cookies.set(sessionCookieName(config.appId), sessionToken, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES !== "false",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    response.cookies.delete(`${config.appId}-oauth-state`);
    return response;
  };
}

/** Creates POST /api/auth/logout handler */
export function createLogoutHandler(config: AuthRouteConfig) {
  return async function POST() {
    const ssoSlug = config.appId;
    const identityUrl = getIdentityUrl();
    const uiUrl =
      process.env.YOUEYE_UI_URL ||
      `https://${(process.env[config.externalUrlEnv] || "").split(".").slice(1).join(".")}`;
    const endSessionUrl = identityUrl
      ? `${identityUrl}/application/o/${ssoSlug}/end-session/?post_logout_redirect_uri=${encodeURIComponent(uiUrl)}`
      : uiUrl;

    const response = NextResponse.json({ ok: true, redirect: endSessionUrl });
    response.cookies.delete(sessionCookieName(config.appId));

    const domain = extractParentDomain(process.env[config.externalUrlEnv] || process.env.NEXT_PUBLIC_APP_URL || "");
    if (domain) {
      response.cookies.set("ye-logout-ts", String(Date.now()), {
        domain: `.${domain}`,
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.SECURE_COOKIES !== "false",
        maxAge: 300,
      });
    }

    return response;
  };
}

function extractParentDomain(url: string): string | null {
  try {
    const hostname = url.includes("://") ? new URL(url).hostname : url;
    const parts = hostname.split(".");
    return parts.length >= 2 ? parts.slice(-parts.length + 1).join(".") : null;
  } catch {
    return null;
  }
}
