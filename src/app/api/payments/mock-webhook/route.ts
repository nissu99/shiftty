import { NextResponse } from "next/server";
import { findBookingByReference, markPayment } from "@/lib/shiftyStore";

const allowedStatuses = new Set([
  "captured",
  "failed",
  "authorized",
  "created",
  "pending",
  "refunded",
  "refunded_partial",
  "partial_refund",
]);

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function mapStatus(value: string): "PAID" | "FAILED" | "UNPAID" | "REFUNDED" {
  if (value === "captured") return "PAID";
  if (value === "refunded" || value === "refunded_partial" || value === "partial_refund") {
    return "REFUNDED";
  }
  if (value === "failed") return "FAILED";
  return "UNPAID";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const reference = normalize(body.reference);
  const status = normalize(body.status);

  if (!reference || !allowedStatuses.has(status)) {
    return NextResponse.json(
      { error: "Reference and status (captured|failed|authorized|created|pending|refunded) are required" },
      { status: 400 },
    );
  }

  const booking = findBookingByReference(reference);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found for reference." }, { status: 404 });
  }

  const updated = markPayment(
    booking.id,
    booking.paymentReference ?? reference,
    mapStatus(status),
  );

  if (!updated) {
    return NextResponse.json({ error: "Unable to apply mock webhook." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    bookingId: updated.id,
    paymentReference: reference,
    paymentStatus: updated.paymentStatus,
    forwardedAt: new Date().toISOString(),
  });
}
