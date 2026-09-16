/**
 * Canvas embed helpers — unified layout for app surfaces
 *
 * Usage in your app's src/app/embed/layout.tsx:
 *   import { EmbedLayout } from "@/lib/embed";
 *   export default EmbedLayout;
 *
 * This layout:
 * - Hides the app header/nav
 * - Makes background transparent (for dashboard widget containers)
 * - Removes padding/margin/overflow
 * - Emits the modern youeye:ready / youeye:resize protocol
 * - Suitable for /embed/widget/*, /embed/card/*, /embed/timeline/*,
 *   /embed/settings, and /embed/notification/* routes
 */

import React from "react";

const EMBED_CSS = `
  header, nav { display: none !important; }
  .ye-mobile-shell-only, .ye-mobile-shell-spacer { display: none !important; }
  html, body { background: transparent !important; margin: 0; padding: 0; overflow: hidden; }
  main { margin: 0 !important; padding: 0 !important; }
`;

/**
 * The unified embed protocol (child side).
 *
 * Emits the protocol the UI's <UnifiedEmbed> wrapper listens for:
 *   { type: "youeye:ready" }                       // once, when the embed paints
 *   { type: "youeye:resize", height }              // debounced ~100ms via ResizeObserver
 *   { type: "youeye:action", action, data? }       // app-initiated (see youeyeEmitAction)
 *
 * App surfaces (widgets, info-cards, timeline-cards, notifications, settings
 * panels) use this protocol. The launcher is UI-internal and is not part of the
 * app-facing surface schema.
 */
const UNIFIED_EMBED_SCRIPT = `
(function () {
  if (window.parent === window) return;
  function post(m) { try { window.parent.postMessage(m, '*'); } catch (e) {} }
  function h() { return Math.ceil(document.documentElement.scrollHeight || document.body.scrollHeight || 0); }
  var last = 0, t = null;
  function resize() { var v = h(); if (v && v !== last) { last = v; post({ type: 'youeye:resize', height: v }); } }
  function ready() { post({ type: 'youeye:ready' }); resize(); }
  if (document.readyState === 'complete' || document.readyState === 'interactive') ready();
  else window.addEventListener('DOMContentLoaded', ready);
  window.addEventListener('load', resize);
  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(function () { if (t) clearTimeout(t); t = setTimeout(resize, 100); });
    try { ro.observe(document.body); } catch (e) {}
  }
})();
`;

/** Inline script: emits youeye:ready + debounced youeye:resize. Drop into any embed page. */
export function EmbedReadyScript() {
  return <script dangerouslySetInnerHTML={{ __html: UNIFIED_EMBED_SCRIPT }} />;
}

/** Embed layout on the unified protocol — transparent, chrome-less, auto ready/resize. */
export function UnifiedEmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EMBED_CSS }} />
      <EmbedReadyScript />
      {children}
    </>
  );
}

/** Default Canvas embed layout. */
export const EmbedLayout = UnifiedEmbedLayout;

/** Info cards use the same unified layout as every other app-rendered surface. */
export const InfoCardLayout = UnifiedEmbedLayout;

/** Client helper: send a youeye:action message to the host UI (e.g. on a settings save). */
export function youeyeEmitAction(action: string, data?: unknown): void {
  if (typeof window === "undefined" || window.parent === window) return;
  try {
    window.parent.postMessage({ type: "youeye:action", action, data }, "*");
  } catch {
    /* parent unreachable — no-op */
  }
}

export * from "./settings-panel";
