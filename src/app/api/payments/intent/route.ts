import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import { getBooking, setPaymentIntentReference } from "@/lib/shiftyStore";

const MIN_PAYMENT_AMOUNT = 1500;
const paymentModes = ["UPI", "CARD", "NET_BANKING"] as const;

type PaymentMode = (typeof paymentModes)[number];
type PaymentProvider = "razorpay" | "mock";

type PaymentContext = {
  source?: string;
  destination?: string;
  listingId?: string;
  listingName?: string;
};
type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

type RazorpayConfig = {
  keyId: string;
  keySecret: string;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMode(value: unknown): PaymentMode {
  if (typeof value !== "string") return "UPI";
  const candidate = value.toUpperCase().trim();
  if ((paymentModes as readonly string[]).includes(candidate)) return candidate as PaymentMode;
  return "UPI";
}

function getRazorpayConfig(): RazorpayConfig | null {
  const keyId = normalizeText(process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  const keySecret = normalizeText(process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET);
  if (!keyId || !keySecret) {
    return null;
  }
  return { keyId, keySecret };
}

function newReference() {
  return `SHIFTY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function makeAmountInPaise(value: number) {
  return Math.max(1, Math.round(value * 100));
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

async function createRazorpayOrder(params: {
  config: RazorpayConfig;
  amountPaise: number;
  reference: string;
  notes: Record<string, string>;
}) {
  try {
    const receipt = `rzp-${params.reference}`;
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${params.config.keyId}:${params.config.keySecret}`,
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: "INR",
        payment_capture: 1,
        receipt,
        notes: params.notes,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const reason = await response.text().catch(() => "Unable to parse Razorpay order error");
      return {
        ok: false as const,
        error:
          reason ||
          `Razorpay order creation failed with status ${response.status}`,
      };
    }

    const payload = (await response.json().catch(() => null)) as {
      id?: string;
      amount?: number;
      currency?: string;
    } | null;

    if (!payload?.id) {
      return {
        ok: false as const,
        error: "Invalid Razorpay order response.",
      };
    }

    return {
      ok: true as const,
      order: {
        id: payload.id,
        amount: typeof payload.amount === "number" ? payload.amount : params.amountPaise,
        currency: normalizeText(payload.currency) || "INR",
      },
    };
  } catch {
    return {
      ok: false as const,
      error: "Failed to contact Razorpay checkout API.",
    };
  }
}

function buildResponse(params: {
  provider: PaymentProvider;
  amount: number;
  bookingId?: string;
  paymentMode: PaymentMode;
  reference: string;
  currency?: string;
  note?: string;
  metadata: PaymentContext & { type: "booking" | "standalone" };
  keyId?: string;
  orderId?: string;
  amountInPaise?: number;
}) {
  return {
    bookingId: params.bookingId,
    reference: params.reference,
    amount: params.amount,
    currency: params.currency ?? "INR",
    paymentMode: params.paymentMode,
    note: params.note,
    metadata: params.metadata,
    provider: params.provider,
    keyId: params.keyId,
    orderId: params.orderId,
    amountInPaise: params.amountInPaise,
  };
}

export async function POST(request: Request) {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  const paymentMode = normalizeMode(body.paymentMode);
  const config = getRazorpayConfig();
  const listingContext: PaymentContext = {
    source: normalizeText(body.source),
    destination: normalizeText(body.destination),
    listingId: normalizeText(body.listingId),
    listingName: normalizeText(body.listingName),
  };

  if (bookingId) {
    const booking = getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (!(session.role === "admin" || booking.userId === session.sub)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Booking is already fully paid." }, { status: 409 });
    }

    if (booking.paymentStatus === "REFUNDED") {
      return NextResponse.json({ error: "Booking payment has been refunded and cannot be paid again." }, { status: 409 });
    }

    const amount = booking.quote.finalPrice;
    const metadata = {
      type: "booking" as const,
      source: booking.source,
      destination: booking.destination,
      listingId: booking.id,
      listingName: `${booking.source} → ${booking.destination}`,
    };

    if (!config) {
      const reference = newReference();
      setPaymentIntentReference(booking.id, reference);
      return NextResponse.json(
        buildResponse({
          provider: "mock",
          bookingId: booking.id,
          amount,
          paymentMode,
          reference,
          currency: "INR",
          metadata,
          note: "No Razorpay credentials found. Mock flow enabled.",
        }),
        { status: 201 },
      );
    }

    const reference = newReference();
    const orderResult = await createRazorpayOrder({
      config,
      amountPaise: makeAmountInPaise(amount),
      reference,
      notes: {
        ...metadata,
        type: "booking",
        bookingId: booking.id,
        paymentMode,
      },
    });

    if (!orderResult.ok) {
      return NextResponse.json(
        { error: orderResult.error || "Failed to create Razorpay order." },
        { status: 502 },
      );
    }

    setPaymentIntentReference(booking.id, orderResult.order.id);
    return NextResponse.json(
      buildResponse({
        provider: "razorpay",
        bookingId: booking.id,
        amount,
        paymentMode,
        reference: orderResult.order.id,
        currency: orderResult.order.currency,
        metadata,
        keyId: config.keyId,
        orderId: orderResult.order.id,
        amountInPaise: orderResult.order.amount,
      }),
      { status: 201 },
    );
  }

  const amount = toNumber(body.amount);
  if (!Number.isFinite(amount) || amount < MIN_PAYMENT_AMOUNT) {
    return NextResponse.json(
      { error: `Amount must be at least ₹${MIN_PAYMENT_AMOUNT}` },
      { status: 400 },
    );
  }

  if (!config) {
    const reference = newReference();
    return NextResponse.json(
      buildResponse({
        provider: "mock",
        amount,
        paymentMode,
        reference,
        currency: "INR",
        metadata: {
          ...listingContext,
          type: "standalone",
        },
        note: listingContext.listingId || listingContext.listingName
          ? `Payment context: ${listingContext.listingName || "standalone"}`
          : "No booking binding - standalone intent",
      }),
      { status: 201 },
    );
  }

  const reference = newReference();
  const orderResult = await createRazorpayOrder({
    config,
    amountPaise: makeAmountInPaise(amount),
    reference,
    notes: {
      ...listingContext,
      type: "standalone",
      paymentMode,
    },
  });

  if (!orderResult.ok) {
    return NextResponse.json(
      { error: orderResult.error || "Failed to create Razorpay order." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    buildResponse({
      provider: "razorpay",
      amount,
      paymentMode,
      reference: orderResult.order.id,
      currency: orderResult.order.currency,
      metadata: {
        ...listingContext,
        type: "standalone",
      },
      keyId: config.keyId,
      orderId: orderResult.order.id,
      amountInPaise: orderResult.order.amount,
    }),
    { status: 201 },
  );
}
