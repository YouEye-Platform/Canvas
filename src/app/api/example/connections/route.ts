import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

import {
  connectionFetch,
  getBackend,
  getConnections,
  internetFetch,
} from "@/lib/connections";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const targetAppId = url.searchParams.get("targetAppId");
  const targetPath = url.searchParams.get("path") || "/";
  const externalUrl = url.searchParams.get("url");
  const connections = await getConnections(session.userId);

  if (targetAppId) {
    const backend = getBackend(connections, targetAppId);
    if (!backend) {
      return NextResponse.json(
        { ok: false, error: `No approved connection to ${targetAppId}`, connections },
        { status: 404 },
      );
    }

    const response = await connectionFetch(targetAppId, targetPath, {}, session.userId);
    return NextResponse.json({
      ok: response.ok,
      kind: "app-connection",
      targetAppId,
      status: response.status,
      bodyPreview: (await response.text()).slice(0, 500),
    });
  }

  if (externalUrl) {
    const response = await internetFetch(externalUrl, {}, session.userId);
    return NextResponse.json({
      ok: response.ok,
      kind: "internet",
      url: externalUrl,
      status: response.status,
      bodyPreview: (await response.text()).slice(0, 500),
    });
  }

  return NextResponse.json({
    ok: true,
    message:
      "Add ?targetAppId=<approved-app>&path=/health or ?url=https://approved.example/path to exercise the proxy helpers.",
    connections,
  });
}
