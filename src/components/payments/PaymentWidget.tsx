"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  handler: (response: RazorpayPaymentSuccess) => Promise<void> | void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    callback: (response: RazorpayPaymentFailure) => void,
  ) => void;
};

type RazorpayPaymentSuccess = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayPaymentFailure = {
  error?: {
    description?: string;
  };
};

const paymentModes = ["UPI", "CARD", "NET_BANKING"] as const;

type PaymentMode = (typeof paymentModes)[number];

type PaymentBooking = {
  id: string;
  source: string;
  destination: string;
  status: string;
  paymentStatus: string;
  moveDate: string;
  quote: {
    basePrice: number;
    finalPrice: number;
    discountPercent: number;
    discountReasons: string[];
  };
};

type PaymentIntent = {
  bookingId?: string;
  reference: string;
  amount: number;
  currency?: string;
  note?: string;
  paymentMode?: PaymentMode;
  provider?: "razorpay" | "mock";
  keyId?: string;
  orderId?: string;
  amountInPaise?: number;
  metadata?: {
    type: "booking" | "standalone";
    source?: string;
    destination?: string;
    listingId?: string;
    listingName?: string;
  };
};

type ListingContext = {
  listingId: string;
  listingName: string;
  listingAmount: string;
  listingSource: string;
  listingDestination: string;
};

type MessageState = {
  variant: "idle" | "success" | "error";
  text: string;
};

type RazorpayLoader = {
  id: string;
  promise: Promise<boolean>;
};

let razorpayLoader: RazorpayLoader | null = null;

const RAZORPAY_SDK_SRC = "https://checkout.razorpay.com/v1/checkout.js";

async function ensureRazorpayScriptLoaded(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  if (razorpayLoader?.id === RAZORPAY_SDK_SRC) {
    return razorpayLoader.promise;
  }

  const promise = new Promise<boolean>((resolve) => {
    const existing = document.getElementById("razorpay-checkout-script");
    if (existing) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const scriptTag = existing as HTMLScriptElement;
      if (scriptTag.readyState === "loaded" || scriptTag.readyState === "complete") {
        resolve(Boolean(window.Razorpay));
        return;
      }
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SDK_SRC;
    script.async = true;
    script.id = "razorpay-checkout-script";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  razorpayLoader = { id: RAZORPAY_SDK_SRC, promise };
  return promise;
}

function parseCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseAmount(value: string | null): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return String(Math.max(1500, Math.round(parsed)));
}

function describeMode(mode: PaymentMode) {
  if (mode === "UPI") return "UPI / UPI ID";
  if (mode === "CARD") return "Card / UPI QR";
  return "Net Banking";
}

function prettyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function safeErrorText(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const source = payload as { error?: unknown; message?: unknown };
  if (typeof source.error === "string") return source.error;
  if (typeof source.message === "string") return source.message;
  return fallback;
}

async function readJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<unknown>;
}

export function PaymentWidget() {
  const searchParams = useSearchParams();
  const bookingId = useMemo(() => searchParams.get("bookingId")?.trim() ?? null, [searchParams]);
  const listingContext = useMemo<ListingContext>(() => {
    return {
      listingId: searchParams.get("listingId")?.trim() ?? "",
      listingName: searchParams.get("listing")?.trim() ?? "",
      listingAmount: parseAmount(searchParams.get("amount")),
      listingSource: searchParams.get("pickup")?.trim() ?? "",
      listingDestination: searchParams.get("dropoff")?.trim() ?? "",
    };
  }, [searchParams]);

  const hasListingContext = Boolean(
    listingContext.listingId || listingContext.listingName || listingContext.listingAmount,
  );
  const defaultMode = (searchParams.get("mode")?.toUpperCase() as PaymentMode | null) ?? "UPI";
  const normalizedDefaultMode: PaymentMode = paymentModes.includes(defaultMode) ? defaultMode : "UPI";

  const [booking, setBooking] = useState<PaymentBooking | null>(null);
  const [bookingLoading, setBookingLoading] = useState(!!bookingId);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [standaloneAmount, setStandaloneAmount] = useState<string>("1500");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState<string>("");
  const [message, setMessage] = useState<MessageState | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(normalizedDefaultMode);
  const [sdkLoading, setSdkLoading] = useState(false);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);

  const boundBookingMode = Boolean(bookingId);

  useEffect(() => {
    if (!boundBookingMode && hasListingContext && listingContext.listingAmount) {
      setStandaloneAmount(listingContext.listingAmount);
    }
    if (!boundBookingMode && hasListingContext && !listingContext.listingAmount) {
      setStandaloneAmount("1500");
    }
  }, [boundBookingMode, hasListingContext, listingContext.listingAmount]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setSdkLoading(true);
      const ready = await ensureRazorpayScriptLoaded();
      if (cancelled) return;
      setSdkLoading(false);
      setGatewayError(
        ready ? null : "Unable to load Razorpay checkout. Use mock flow if payment is not enabled.",
      );
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshBooking = async () => {
    if (!bookingId) {
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (!response.ok) {
        const payload = await readJson(response);
        setBookingError(safeErrorText(payload, "Unable to load booking."));
        return;
      }
      const payload = (await readJson(response)) as { booking: PaymentBooking };
      setBooking(payload.booking ?? null);
    } catch {
      setBookingError("Unable to load booking details.");
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      void refreshBooking();
    } else {
      setBookingLoading(false);
    }
  }, [bookingId]);

  const createIntent = async () => {
    setMessage(null);
    setIntentLoading(true);
    setIntent(null);
    setGatewayError(null);

    const body: Record<string, unknown> = {};
    if (boundBookingMode && bookingId) {
      body.bookingId = bookingId;
    } else {
      body.amount = Number(standaloneAmount);
      if (hasListingContext) {
        body.listingId = listingContext.listingId;
        body.listingName = listingContext.listingName;
        body.source = listingContext.listingSource;
        body.destination = listingContext.listingDestination;
      }
    }
    body.paymentMode = paymentMode;

    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await readJson(response)) as PaymentIntent & { error?: string };
      if (!response.ok) {
        setIntent(null);
        if (response.status === 401) {
          setMessage({
            variant: "error",
            text: "Please sign in before creating a payment intent.",
          });
          return;
        }

        if (response.status === 403) {
          setMessage({
            variant: "error",
            text: "You are not authorized to pay for this booking.",
          });
          return;
        }

        setMessage({
          variant: "error",
          text: safeErrorText(payload, "Unable to create payment intent."),
        });
        return;
      }

      setIntent(payload);
      setMessage({
        variant: "success",
        text:
          payload.provider === "razorpay"
            ? `Payment intent created (${payload.reference}). Click "Pay with Razorpay" to complete.`
            : `Payment intent created (${payload.reference}). Mock flow enabled for testing.`,
      });
    } catch {
      setIntent(null);
      setMessage({ variant: "error", text: "Network error while creating payment intent." });
    } finally {
      setIntentLoading(false);
    }
  };

  const simulateWebhook = async (status: "captured" | "failed" | "refunded") => {
    if (!intent?.reference) return;

    setWebhookLoading(status);
    setMessage(null);

    try {
      const response = await fetch("/api/payments/mock-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: intent.reference,
          status,
        }),
      });

      const payload = (await readJson(response)) as { error?: string; paymentStatus?: string };
      if (!response.ok || !payload.paymentStatus) {
        setMessage({ variant: "error", text: safeErrorText(payload, "Webhook simulation failed.") });
        return;
      }

      setMessage({
        variant: "success",
        text: `Webhook marked payment as ${payload.paymentStatus}. Refresh booking to see status updates.`,
      });
    } catch {
      setMessage({ variant: "error", text: "Webhook simulation failed due to network error." });
    } finally {
      setWebhookLoading("");
      if (boundBookingMode && bookingId) {
        await refreshBooking();
      }
    }
  };

  const handleCheckout = async () => {
    if (!intent || intent.provider !== "razorpay" || !intent.orderId || !intent.keyId) {
      setGatewayError("This intent is not configured for Razorpay checkout.");
      return;
    }

    if (!window.Razorpay) {
      const ready = await ensureRazorpayScriptLoaded();
      if (!ready || !window.Razorpay) {
        setGatewayError("Razorpay checkout script failed to load.");
        setGatewayLoading(false);
        return;
      }
    }

    setGatewayError(null);
    setGatewayLoading(true);
    setMessage(null);

    let launched = false;

    try {
      const amount = intent.amountInPaise ?? Math.round(intent.amount * 100);
      const razorpay = new window.Razorpay({
        key: intent.keyId,
        amount,
        currency: intent.currency ?? "INR",
        name: "Shifty",
        description: intent.metadata?.listingName
          ? `Shifty payment for ${intent.metadata.listingName}`
          : "Shifty booking payment",
        order_id: intent.orderId,
        notes: {
          bookingId: intent.bookingId ?? "",
          reference: intent.reference,
          paymentMode: intent.paymentMode ?? "UPI",
        },
        prefill: {
          name: "Shifty Customer",
        },
        theme: { color: "#10b981" },
        handler: async (response: RazorpayPaymentSuccess) => {
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: intent.bookingId,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                reference: intent.reference,
              }),
            });

            const verifyPayload = (await readJson(verifyResponse)) as {
              ok?: boolean;
              paymentStatus?: string;
              error?: string;
            };
            if (!verifyResponse.ok || verifyPayload.error) {
              if (verifyResponse.status === 401) {
                setMessage({
                  variant: "error",
                  text: "Session expired before verification. Please sign in again.",
                });
              } else if (verifyResponse.status === 403) {
                setMessage({
                  variant: "error",
                  text: "You are not authorized to complete this payment.",
                });
              } else {
                setMessage({
                  variant: "error",
                  text: safeErrorText(
                    verifyPayload,
                    "Payment verification failed after checkout.",
                  ),
                });
              }
              return;
            }

            setMessage({
              variant: "success",
              text: `Payment verified successfully. ${verifyPayload.paymentStatus ? `Status: ${verifyPayload.paymentStatus}.` : ""} Redirect/refresh for latest status.`,
            });

            if (boundBookingMode && bookingId) {
              await refreshBooking();
            }
          } catch {
            setMessage({
              variant: "error",
              text: "Network error while verifying payment.",
            });
          } finally {
            setGatewayLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setMessage({
              variant: "error",
              text: "Payment popup closed before completion.",
            });
            setGatewayLoading(false);
          },
        },
      });

      razorpay.on("payment.failed", (response: RazorpayPaymentFailure) => {
        setGatewayLoading(false);
        setMessage({
          variant: "error",
          text: response.error?.description ?? "Razorpay reported a payment failure.",
        });
      });

      launched = true;
      razorpay.open();
    } catch {
      setGatewayError("Unable to initialize Razorpay checkout.");
      setGatewayLoading(false);
    } finally {
      if (!launched) {
        setGatewayLoading(false);
      }
    }
  };

  const validateStandaloneAmount = () => {
    const value = Number(standaloneAmount);
    return Number.isFinite(value) && value >= 1500;
  };

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-7">
      <h2 className="text-2xl font-bold text-white">Payment desk</h2>
      <p className="mt-2 text-sm text-white/50">
        Launch payment intents from a selected booking or run a standalone transaction for testing.
      </p>

      {boundBookingMode && (
        <>
          {bookingLoading ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 text-sm text-white/50">
              <Loader2 size={16} className="animate-spin" />
              Loading booking metadata...
            </div>
          ) : null}

          {bookingError && (
            <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {bookingError}
            </div>
          )}

          {booking ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
              <p className="text-sm font-semibold text-emerald-100">Booking context</p>
              <div className="mt-2 text-sm text-white/75">
                <p>
                  <span className="text-white/40">ID:</span> {booking.id}
                </p>
                <p>
                  <span className="text-white/40">Route:</span> {booking.source} → {booking.destination}
                </p>
                <p>
                  <span className="text-white/40">Move:</span> {prettyDate(booking.moveDate)}
                </p>
                <p>
                  <span className="text-white/40">Booking status:</span> {booking.status}
                </p>
                <p>
                  <span className="text-white/40">Payment state:</span> {booking.paymentStatus}
                </p>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-white/80 md:grid-cols-3">
                <span className="rounded-lg bg-white/10 px-3 py-2">Base: {parseCurrency(booking.quote.basePrice)}</span>
                <span className="rounded-lg bg-white/10 px-3 py-2">Final: {parseCurrency(booking.quote.finalPrice)}</span>
                <span className="rounded-lg bg-white/10 px-3 py-2">Discount: {booking.quote.discountPercent}%</span>
              </div>
              <p className="mt-2 text-xs text-emerald-100">{booking.quote.discountReasons.join(", ")}</p>
            </div>
          ) : null}
        </>
      )}

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.02] p-5">
          <h3 className="text-lg font-semibold text-white">Step 1: Create intent</h3>
          {!boundBookingMode ? (
            <>
              <label className="mt-3 block text-sm text-white/70">
                Amount (₹)
                <input
                  type="number"
                  min={1500}
                  step={100}
                  value={standaloneAmount}
                  onChange={(event) => setStandaloneAmount(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-3 text-white outline-none"
                />
              </label>
              <p className="mt-2 text-xs text-white/40">Minimum amount for standalone flow is ₹1,500.</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-white/50">Bound payment flow: amount is derived from booking quote.</p>
          )}

          <button
            type="button"
            onClick={() => void createIntent()}
            disabled={intentLoading || (!boundBookingMode && !validateStandaloneAmount())}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/15"
          >
            {intentLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            {intentLoading ? "Creating intent..." : "Create payment intent"}
          </button>

          <div className="mt-4">
            <p className="mb-2 text-sm text-white/70">Payment method</p>
            <div className="grid grid-cols-3 gap-2">
              {paymentModes.map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    paymentMode === mode
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                      : "border-white/15 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-white/45">{describeMode(paymentMode)}</p>
          </div>

          {intent && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3 text-sm text-emerald-200">
              <p>
                Reference: <span className="font-mono">{intent.reference}</span>
              </p>
              {intent.orderId ? (
                <p>
                  Gateway order: <span className="font-mono">{intent.orderId}</span>
                </p>
              ) : null}
              <p>
                Amount: {parseCurrency(intent.amount)} · Currency: {intent.currency ?? "INR"} · Provider:{" "}
                {intent.provider ?? "mock"}
              </p>
              {intent.note ? <p>Note: {intent.note}</p> : null}
              <p className="mt-1">Booking: {intent.bookingId ?? "Standalone"}</p>
              {intent.metadata ? (
                <p className="mt-1">
                  Context: {intent.metadata.type}
                  {intent.metadata.listingName ? ` · ${intent.metadata.listingName}` : ""}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.02] p-5">
          <h3 className="text-lg font-semibold text-white">
            {intent?.provider === "razorpay" ? "Step 2: Complete checkout" : "Step 2: Simulate gateway response"}
          </h3>
          <p className="mt-2 text-sm text-white/50">
            {intent?.provider === "razorpay"
              ? "Razorpay checkout will call your payment verification endpoint and update booking payment status."
              : "Mock webhook handler updates booking payment state. Use this for demo + UI validation."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {intent?.provider === "razorpay" ? (
          <button
              type="button"
              onClick={() => void handleCheckout()}
              disabled={
                !intent ||
                !intent.orderId ||
                !intent.keyId ||
                gatewayLoading ||
                sdkLoading
              }
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/20"
              >
                {gatewayLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                {gatewayLoading ? "Opening Razorpay..." : "Pay with Razorpay"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void simulateWebhook("captured")}
                  disabled={!intent || webhookLoading === "captured"}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/20"
                >
                  {webhookLoading === "captured" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Simulate success
                </button>

                <button
                  type="button"
                  onClick={() => void simulateWebhook("failed")}
                  disabled={!intent || webhookLoading === "failed"}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/20"
                >
                  {webhookLoading === "failed" ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                  Simulate failure
                </button>

                <button
                  type="button"
                  onClick={() => void simulateWebhook("refunded")}
                  disabled={!intent || webhookLoading === "refunded"}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/20"
                >
                  {webhookLoading === "refunded" ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Simulate refund
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => void refreshBooking()}
              disabled={!boundBookingMode || bookingLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw size={16} />
              Refresh booking
            </button>
          </div>

          {sdkLoading ? <p className="mt-2 text-xs text-white/50">Loading Razorpay script...</p> : null}
          {gatewayError ? (
            <p className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-200">
              {gatewayError}
            </p>
          ) : null}
        </div>
      </div>

      {!boundBookingMode && hasListingContext ? (
        <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-100">Listing payment context</p>
          <p className="mt-2 text-sm text-white/80">
            <span className="text-white/40">Listing:</span>{" "}
            {listingContext.listingName || listingContext.listingId || "Standalone"}
          </p>
          <p className="mt-1 text-xs text-white/60">
            {listingContext.listingSource && listingContext.listingDestination
              ? `${listingContext.listingSource} → ${listingContext.listingDestination}`
              : "Route context not specified"}
          </p>
        </section>
      ) : null}

      {message ? (
        <div
          className={`mt-6 rounded-xl border p-3 text-sm ${
            message.variant === "error"
              ? "border-rose-500/30 bg-rose-500/12 text-rose-200"
              : "border-emerald-500/30 bg-emerald-500/12 text-emerald-200"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
        <p className="text-xs text-white/50">
          Booking flow is explicit for auditability and secure status transitions.
        </p>
        <Link
          href="/dashboard"
          className="rounded-lg border border-emerald-500/40 px-3 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/10"
        >
          Open dashboard
        </Link>
      </div>
    </section>
  );
}
