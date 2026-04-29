import { NextResponse } from "next/server";
import { buildQuote, parseBookingDraft, parsePackageType } from "@/lib/bookingUtils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const draft = parseBookingDraft(body, { requireInventory: true });
    const requestedPackage = parsePackageType((body as { packageType?: unknown }).packageType);
    const quote = buildQuote(draft, requestedPackage);
    return NextResponse.json(quote, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate prediction.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
