import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const reference = typeof body.reference === "string" ? body.reference : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!reference || !["captured", "failed"].includes(status)) {
    return NextResponse.json(
      { error: "Reference and a valid status (captured|failed) are required" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    received: { reference, status },
    forwardedAt: new Date().toISOString(),
  });
}
