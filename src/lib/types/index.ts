/**
 * Canvas shared type definitions
 */

/** JWT session payload stored in the session cookie */
export interface SessionPayload {
  userId: string;
  identitySessionId: string;
  username: string;
  name: string;
  email: string;
  isAdmin: boolean;
  groups: string[];
  iat?: number;
  exp?: number;
}

/** App manifest returned by GET /api/manifest */
export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  permissions: string[];
  surfaceSchemaVersion?: number;
  surfaces?: SurfaceManifest[];
  inter_app?: InterAppManifest;
  settings?: { schema: SettingsField[] };
}

export interface SurfaceManifest {
  id: string;
  kind: "widget" | "info-card" | "timeline-card" | "notification" | "settings-panel";
  placement: "dashboard" | "timeline" | "notification-center" | "app-settings" | "app-detail";
  name?: string;
  description?: string;
  embedPath: string;
  permissions?: string[];
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  refreshInterval?: number;
  settingsSchema?: SettingsField[];
  triggers?: string[];
}

export interface InterAppManifest {
  provides: { type: string; description: string }[];
}

export interface SettingsField {
  key: string;
  type: "text" | "select" | "toggle" | "number";
  label: string;
  default?: string | number | boolean;
  options?: { label: string; value: string }[];
}

/** Header config returned by YE-UI /api/v1/header/config */
export interface HeaderConfig {
  user?: {
    id: string;
    name: string;
    username: string;
    email: string;
    is_admin: boolean;
    /** Absolute URL to the user's avatar image, or null if none set. */
    avatar_url?: string | null;
  };
  navigation?: {
    apps?: DrawerApp[];
    /**
     * The requesting native app's OWN branding (Plan 4 Phase 0). Always present
     * for service (native-app) calls so a shared header can render the app's
     * logo/wordart WITHOUT exposing the full installed-app list. Null/absent for
     * the UI's own header, which uses the instance wordmark instead.
     */
    self?: SelfBranding | null;
  };
  notifications?: {
    unread_count: number;
  };
  theme?: {
    cssVariables?: string;
    mode?: string;
  };
  ui_base_url?: string;
  user_menu?: {
    platform_items?: PlatformMenuItem[];
    /** Deep link to the app's settings page in YE-UI (service calls only). */
    app_settings_url?: string;
  };
}

export interface DrawerApp {
  id: string;
  name: string;
  icon: string | null;
  custom_icon_url: string | null;
  url: string | null;
  status: string | null;
}

/**
 * A native app's own branding block (Plan 4 Phase 0), delivered via
 * `HeaderConfig.navigation.self`. Mirrors the per-app fields the host computes
 * in /api/v1/header/config. Used by the shared header to render the app's
 * top-left logo/wordart — the one thing that legitimately differs per app.
 */
export interface SelfBranding {
  id: string;
  name: string;
  custom_name: string | null;
  icon: string | null;
  custom_icon_url: string | null;
  header_display_mode: string | null;
  branding_css: Record<string, unknown> | null;
  branding_font_url: string | null;
  branding_css_chars: string[] | null;
}

export interface PlatformMenuItem {
  key: string;
  label: string;
  icon: string;
  url: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

/** Configuration passed to createCanvasApp() to initialize the SDK */
export interface CanvasAppConfig {
  /** App ID, e.g. "ye-cinema". Used in cookies, headers, and API calls. */
  appId: string;
  /** Human-readable app name, e.g. "Cinema" */
  appName: string;
  /** Environment variable name for the app's external URL. Canvas defaults to APP_EXTERNAL_URL. */
  externalUrlEnv: string;
  /** Additional public routes beyond the platform defaults (e.g. ["/shared/", "/embed/"]) */
  publicRoutes?: string[];
  /** Whether this app uses PostgreSQL */
  usesDatabase?: boolean;
}
