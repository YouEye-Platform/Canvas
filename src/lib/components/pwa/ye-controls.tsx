"use client";

/**
 * YeControls — Platform FAB (Floating Action Button)
 *
 * Provides platform-level navigation from within any native app.
 * Default position: bottom-right floating button. Expands to show:
 *   - Homepage (back to YouEye dashboard)
 *   - Notifications (with unread badge)
 *   - Platform Settings
 *   - App Settings (navigates to current app's settings page)
 *   - Quick Apps (top apps from app drawer)
 *
 * Usage:
 *   import { YeControls } from "@/lib/components/pwa/ye-controls";
 *   <YeControls position="bottom-right" uiBaseUrl="https://devvm.test" />
 *
 * For custom placement, use the headless hook:
 *   import { useYeControls } from "@/lib/components/pwa/ye-controls";
 *   const { isOpen, toggle, controls, quickApps } = useYeControls(props);
 */

import { useState, useEffect, useCallback } from "react";

export type YeControlsPosition = "bottom-right" | "bottom-left" | "top-right";

interface QuickApp {
  id: string;
  name: string;
  icon: string | null;
  url: string | null;
  custom_icon_url: string | null;
}

interface YeControlsProps {
  /** FAB position on screen */
  position?: YeControlsPosition;
  /** Base URL of the YouEye UI instance */
  uiBaseUrl?: string;
  /** Whether to show quick app shortcuts */
  showQuickApps?: boolean;
  /** Maximum number of quick apps to display */
  maxQuickApps?: number;
  /** Optional: Pre-loaded apps list (skips fetch) */
  apps?: QuickApp[];
  /** Optional: Pre-loaded notification count */
  notificationCount?: number;
  /** Callback when a navigation target is selected */
  onNavigate?: (target: string) => void;
}

export interface YeControlsState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  controls: { key: string; label: string; icon: string; action: () => void }[];
  quickApps: QuickApp[];
  notificationCount: number;
}

export function useYeControls(props: YeControlsProps = {}): YeControlsState {
  const {
    uiBaseUrl = "",
    showQuickApps = true,
    maxQuickApps = 5,
    apps: preloadedApps,
    notificationCount: preloadedCount,
    onNavigate,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [quickApps, setQuickApps] = useState<QuickApp[]>(preloadedApps || []);
  const [notificationCount, setNotificationCount] = useState(preloadedCount ?? 0);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Fetch apps + notifications from header config if not preloaded
  useEffect(() => {
    if (preloadedApps && preloadedCount !== undefined) return;

    async function fetchData() {
      try {
        const res = await fetch("/api/header-config");
        if (!res.ok) return;
        const data = await res.json();
        if (!preloadedApps && data.navigation?.apps) {
          setQuickApps(
            data.navigation.apps
              .filter((a: { visible?: boolean }) => a.visible !== false)
              .slice(0, maxQuickApps)
          );
        }
        if (preloadedCount === undefined && data.notifications) {
          setNotificationCount(data.notifications.unread_count || 0);
        }
      } catch {
        // Silently fail — controls still work without data
      }
    }

    fetchData();
  }, [preloadedApps, preloadedCount, maxQuickApps]);

  const navigate = useCallback(
    (target: string) => {
      close();
      if (onNavigate) {
        onNavigate(target);
      } else if (target === "home" && uiBaseUrl) {
        window.location.href = uiBaseUrl;
      } else if (target === "settings" && uiBaseUrl) {
        window.location.href = `${uiBaseUrl}/settings`;
      } else if (target === "notifications" && uiBaseUrl) {
        window.location.href = `${uiBaseUrl}/notifications`;
      } else if (target === "app-settings") {
        window.location.href = "/settings";
      } else if (target.startsWith("app:")) {
        const app = quickApps.find((a) => a.id === target.slice(4));
        if (app?.url) window.location.href = app.url;
      }
    },
    [close, onNavigate, uiBaseUrl, quickApps]
  );

  const controls = [
    { key: "home", label: "Homepage", icon: "home", action: () => navigate("home") },
    { key: "notifications", label: "Notifications", icon: "bell", action: () => navigate("notifications") },
    { key: "settings", label: "Platform Settings", icon: "settings", action: () => navigate("settings") },
    { key: "app-settings", label: "App Settings", icon: "sliders", action: () => navigate("app-settings") },
  ];

  return { isOpen, toggle, close, controls, quickApps: showQuickApps ? quickApps : [], notificationCount };
}

// SVG icon paths
const icons: Record<string, string> = {
  home: "M2 6L8 2l6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1V6z M6 14V9h4v5",
  bell: "M12 5a4 4 0 00-8 0c0 4-2 5-2 5h12s-2-1-2-5 M6.5 13a1.5 1.5 0 003 0",
  settings: "M8 8m-3 0a3 3 0 106 0a3 3 0 10-6 0 M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41",
  sliders: "M2 4h4M10 4h6M2 12h10M14 12h2 M6 2v4M12 10v4",
};

function ControlIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      {(icons[name] || "").split(" M").map((segment, i) => (
        <path key={i} d={i === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}

export function YeControls(props: YeControlsProps) {
  const { position = "bottom-right" } = props;
  const { isOpen, toggle, controls, quickApps, notificationCount } = useYeControls(props);

  const positionClasses: Record<YeControlsPosition, string> = {
    "bottom-right": "bottom-6 right-4",
    "bottom-left": "bottom-6 left-4",
    "top-right": "top-16 right-4",
  };

  const panelOrigin = position.includes("top") ? "top-12" : "bottom-12";
  const panelAlign = position.includes("left") ? "left-0" : "right-0";

  return (
    <div className={`fixed ${positionClasses[position]} z-[90]`}>
      {/* Expanded panel */}
      {isOpen && (
        <div
          className={`absolute ${panelOrigin} ${panelAlign} mb-2 w-[220px] rounded-2xl border border-border/40 bg-background/95 shadow-2xl backdrop-blur-xl overflow-hidden`}
        >
          <div className="p-3 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Controls
            </div>
            {controls.map((ctrl) => (
              <button
                key={ctrl.key}
                onClick={ctrl.action}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/50 w-full text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/30 flex items-center justify-center">
                  <ControlIcon name={ctrl.icon} className="text-foreground" />
                </div>
                <span className="text-xs text-foreground">{ctrl.label}</span>
                {ctrl.key === "notifications" && notificationCount > 0 && (
                  <span className="ml-auto text-[10px] bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {quickApps.length > 0 && (
            <>
              <div className="h-px bg-border/40" />
              <div className="p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Quick Apps
                </div>
                <div className="flex gap-2 flex-wrap">
                  {quickApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => {
                        if (app.url) window.location.href = app.url;
                      }}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center text-xs font-bold text-foreground group-hover:bg-accent/50 transition-colors">
                        {app.custom_icon_url ? (
                          <img
                            src={app.custom_icon_url}
                            alt={app.name}
                            className="w-6 h-6 rounded"
                          />
                        ) : (
                          app.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        {app.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={toggle}
        className="w-11 h-11 rounded-full border border-border/40 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-xl"
        style={{
          opacity: isOpen ? 1 : 0.6,
          background: isOpen
            ? "hsl(var(--background) / 0.95)"
            : "hsl(var(--background) / 0.5)",
        }}
        aria-label={isOpen ? "Close YouEye controls" : "Open YouEye controls"}
      >
        <div
          className="w-6 h-6 rounded-md bg-primary flex items-center justify-center transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0)" }}
        >
          <span className="text-[11px] font-bold text-primary-foreground">
            {isOpen ? "+" : "Y"}
          </span>
        </div>
      </button>
    </div>
  );
}
