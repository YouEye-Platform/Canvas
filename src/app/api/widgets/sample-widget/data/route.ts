import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    title: "Sample status",
    updatedAt: new Date().toISOString(),
    metrics: [
      { label: "Items", value: 12 },
      { label: "Open", value: 3 },
    ],
  });
}
