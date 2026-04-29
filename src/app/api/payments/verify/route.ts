import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import { findBookingByReference, getBooking, markPayment } from "@/lib/shiftyStore";

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getConfig() {
  const keySecret = normalize(process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET);
  return { keySecret };
}

export async function POST(request: Request) {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const bookingId = normalize(body.bookingId);
  const reference = normalize(body.reference);
  const paymentId = normalize(body.paymentId || body.razorpay_payment_id);
  const orderId = normalize(body.orderId || body.razorpay_order_id);
  const signature = normalize(body.signature || body.razorpay_signature);

  if (!paymentId || !orderId || !signature) {
    return NextResponse.json(
      { error: "paymentId, orderId and signature are required." },
      { status: 400 },
    );
  }

  const { keySecret } = getConfig();
  if (!keySecret) {
    return NextResponse.json({ error: "Razorpay verification secret is not configured." }, { status: 500 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 401 });
  }

  const booking = bookingId ? getBooking(bookingId) : findBookingByReference(reference || orderId);
  if (!booking) {
    return NextResponse.json(
      {
        ok: true,
        detached: true,
        message: "No local booking matched this order; signature is valid.",
      },
      { status: 200 },
    );
  }

  if (!(session.role === "admin" || booking.userId === session.sub)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updated = markPayment(booking.id, orderId || booking.paymentReference || reference, "PAID");
  if (!updated) {
    return NextResponse.json({ error: "Unable to apply payment status update." }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      bookingId: updated.id,
      paymentStatus: updated.paymentStatus,
      paymentReference: orderId,
      paymentId,
    },
    { status: 200 },
  );
}
