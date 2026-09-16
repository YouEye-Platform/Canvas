/**
 * NeedsBackend — Connection status component
 *
 * Render this when your app requires a backend that isn't connected yet.
 * It shows available backends from the discovery API. Connection grants are
 * managed by YouEye Settings; apps do not request bridges directly.
 *
 * Usage:
 *   import { NeedsBackend } from "@/lib/components/needs-backend";
 *
 *   const conns = await getConnections();
 *   const searxng = getBackend(conns, "searxng");
 *   if (!searxng) {
 *     return <NeedsBackend
 *       title="Connect a search engine"
 *       description="Search needs a backend to return results."
 *       available={conns.available}
 *     />;
 *   }
 */

"use client";

interface AvailableBackend {
  appId: string;
  name: string;
  installed: boolean;
}

interface NeedsBackendProps {
  /** Heading text */
  title: string;
  /** Explanatory text */
  description?: string;
  /** Available backends from getConnections().available */
  available: AvailableBackend[];
  /** Optional URL for a Settings deep link shown to the user. */
  settingsUrl?: string;
}

export function NeedsBackend({ title, description, available, settingsUrl = "/settings" }: NeedsBackendProps) {
  const installed = available.filter((a) => a.installed);
  const notInstalled = available.filter((a) => !a.installed);

  if (available.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6 max-w-lg mx-auto">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}

      {installed.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Available on your platform
          </p>
          {installed.map((b) => (
            <div
              key={b.appId}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div>
                <span className="font-medium">{b.name}</span>
                <span className="text-xs text-green-600 ml-2">Installed</span>
              </div>
              <a
                href={settingsUrl}
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded"
              >
                Open Settings
              </a>
            </div>
          ))}
        </div>
      )}

      {notInstalled.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Not installed
          </p>
          {notInstalled.map((b) => (
            <div
              key={b.appId}
              className="flex items-center justify-between rounded-md border border-dashed border-border p-3 opacity-60"
            >
              <span className="font-medium">{b.name}</span>
              <span className="text-xs text-muted-foreground">Not installed</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
