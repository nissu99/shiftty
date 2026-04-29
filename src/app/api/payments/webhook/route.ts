import crypto from "node:crypto";
import { NextResponse } from "next/server";
import {
  findBookingByReference,
  markPayment,
} from "@/lib/shiftyStore";

type PaymentWebhookStatus =
  | "captured"
  | "failed"
  | "authorized"
  | "created"
  | "pending"
  | "refunded"
  | "partial_refund"
  | "refunded_partial";

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mapStatus(value: string): "PAID" | "FAILED" | "UNPAID" | "REFUNDED" {
  const status = value.toLowerCase();
  if (status === "captured") return "PAID";
  if (status === "refunded" || status === "partial_refund" || status === "refunded_partial") {
    return "REFUNDED";
  }
  if (status === "failed" || status === "error" || status === "canceled") return "FAILED";
  return "UNPAID";
}

function extractPayload(raw: string) {
  const payload = JSON.parse(raw) as {
    reference?: string;
    status?: PaymentWebhookStatus | string;
    paymentId?: string;
    id?: string;
    order_id?: string;
    payload?: { payment?: { entity?: { id?: string; status?: string; order_id?: string } } };
  };

  return {
    reference:
      toText(payload.reference) ||
      toText(payload.paymentId) ||
      toText(payload.id) ||
      toText(payload.payload?.payment?.entity?.id) ||
      toText(payload.payload?.payment?.entity?.order_id) ||
      toText((payload as { order_id?: string }).order_id),
    status: toText(payload.status || payload.payload?.payment?.entity?.status),
  };
}

function verifySignature(signature: string | null, body: string, secret: string): boolean {
  if (!signature) return true;
  const trimmed = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return (
    trimmed.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(trimmed), Buffer.from(expected))
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-razorpay-signature") || request.headers.get("x-signature");
  const secret = process.env.SHIFTY_WEBHOOK_SECRET;

  if (secret && signature && !verifySignature(signature, rawBody, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const payload = extractPayload(rawBody);
  if (!payload.reference || !payload.status) {
    return NextResponse.json(
      { error: "Reference and status are required." },
      { status: 400 },
    );
  }

  const booking = findBookingByReference(payload.reference);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found for reference." }, { status: 404 });
  }

  const updated = markPayment(
    booking.id,
    booking.paymentReference ?? payload.reference,
    mapStatus(payload.status),
  );
  if (!updated) {
    return NextResponse.json({ error: "Unable to apply payment status." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    bookingId: updated.id,
    status: updated.paymentStatus,
    paymentReference: payload.reference,
    forwardedAt: new Date().toISOString(),
  });
}
