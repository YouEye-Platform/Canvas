/**
 * Home Button — Links back to the YE-UI dashboard.
 */

"use client";

import { Home } from "lucide-react";

interface HomeButtonProps {
  uiBaseUrl: string;
}

export function HomeButton({ uiBaseUrl }: HomeButtonProps) {
  let href = uiBaseUrl;
  if (!href && typeof window !== "undefined") {
    const host = window.location.hostname;
    const parts = host.split(".");
    if (parts.length > 2) {
      href = `${window.location.protocol}//${parts.slice(1).join(".")}`;
    }
  }
  if (!href) href = "/";

  return (
    <a
      href={href}
      title="Home"
      className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
    >
      <Home className="h-4 w-4" />
    </a>
  );
}
