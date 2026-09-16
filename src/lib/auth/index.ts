/**
 * Canvas auth helpers — YouEye ID OAuth2 + JWT session management
 *
 * Usage:
 *   import { getOAuthConfig, getSession, createSession } from "@/lib/auth";
 */

export { getOAuthConfig, buildAuthorizeUrl, exchangeCodeForToken, fetchUserInfo, generateOAuthState, isSSOConfigured } from "./authentik";
export { createSession, verifySession, getSession, getJWTSecretKey, getSessionCookieName, initSession } from "./session";
