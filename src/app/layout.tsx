import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { createApiClient } from "@/lib/api";
import {
  getThemeCSSVariables,
  getThemeMode,
  generateThemeStyle,
  generateSystemThemeScript,
} from "@/lib/theme";
import { AppHeader } from "@/lib/components/layout";
import { APP_DESCRIPTION, APP_ID, APP_NAME } from "@/lib/app-config";
import { Star } from "lucide-react";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    icons: { icon: "/api/pwa/icon?size=32" },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession().catch(() => null);

  let headerConfig = null;
  if (session) {
    const api = createApiClient(APP_ID);
    headerConfig = await api.fetchHeaderConfig(session.userId);
  }

  const cssVariables = getThemeCSSVariables(headerConfig);
  const themeStyle = generateThemeStyle(cssVariables);
  const themeMode = getThemeMode(headerConfig);
  const isSystemTheme = themeMode === "system";
  const htmlClass = isSystemTheme ? "" : themeMode;

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        {isSystemTheme && (
          <script dangerouslySetInnerHTML={{ __html: generateSystemThemeScript() }} />
        )}
        {themeStyle && (
          <style
            id="ye-theme"
            dangerouslySetInnerHTML={{ __html: themeStyle }}
          />
        )}
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {session && (
          <AppHeader
            appId={APP_ID}
            appName={APP_NAME}
            appIcon={<Star className="h-5 w-5" />}
            navItems={[
              { label: "Home", href: "/" },
              { label: "Settings", href: "/settings" },
            ]}
            appMenuItems={[
              { label: "App Settings", icon: "Settings", href: "/settings" },
            ]}
          />
        )}
        <main className="container mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
