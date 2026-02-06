'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  CreditCard,
  Loader2,
  MapPin,
  PartyPopper,
  Route,
  Shield,
  AlertTriangle,
  Lock,
  Webhook,
  Smartphone,
} from "lucide-react";
import dynamic from "next/dynamic";

const ServiceMap = dynamic(
  () =>
    import("@/components/map/ServiceMap").then((mod) => ({
      default: mod.ServiceMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="glass flex h-[400px] items-center justify-center rounded-2xl">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    ),
  },
);

async function createPaymentIntent(amount: number) {
  const response = await fetch("/api/payments/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) {
    throw new Error("Unable to create payment intent");
  }
  return (await response.json()) as { reference: string; amount: number };
}

export function PaymentWidget() {
  const searchParams = useSearchParams();

  const parsedAmount = Number(searchParams.get("amount"));
  const [amount, setAmount] = useState(() =>
    Number.isFinite(parsedAmount) && parsedAmount >= 1500 ? parsedAmount : 5000,
  );
  const listingName = searchParams.get("listing");
  const pickup = searchParams.get("pickup");
  const dropoff = searchParams.get("dropoff");
  const planSummary =
    pickup || dropoff
      ? `${pickup ?? "Pickup TBD"} → ${dropoff ?? "Drop-off TBD"}`
      : null;

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [moveProgress, setMoveProgress] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [upiId, setUpiId] = useState("");
  const [upiPopup, setUpiPopup] = useState(false);

  const showMap = status === "success" && !!pickup && !!dropoff;

  useEffect(() => {
    if (!showMap) return;

    const interval = setInterval(() => {
      setMoveProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [showMap]);

  const handlePay = async () => {
    if (paymentMethod === "upi" && !/^[\w.-]+@[\w]+$/.test(upiId.trim())) {
      setStatus("error");
      setMessage("Enter a valid UPI ID (e.g. name@upi or 9876543210@paytm)");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setStatus("idle");

      // Show "request sent" popup for UPI
      if (paymentMethod === "upi") {
        setUpiPopup(true);
        await new Promise((r) => setTimeout(r, 2000));
        setUpiPopup(false);
      }

      const intent = await createPaymentIntent(amount);
      setStatus("success");
      const methodLabel =
        paymentMethod === "upi" ? `UPI (${upiId.trim()})` : "Card";
      const successMsg = [
        `₹${amount.toLocaleString("en-IN")} captured via ${methodLabel}${listingName ? ` for ${listingName}` : ""} · ref ${intent.reference}`,
        planSummary ? `Route: ${planSummary}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      setMessage(successMsg);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("Payment failed — check gateway configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* UPI request sent popup */}
      {upiPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 flex flex-col items-center gap-4 rounded-3xl border border-emerald-500/20 bg-[#0a1118] p-10 shadow-2xl shadow-emerald-500/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
              <Smartphone size={28} className="text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-white">UPI Request Sent</p>
            <p className="text-sm text-white/50">
              Approve the payment on your UPI app for{" "}
              <span className="font-semibold text-emerald-400">{upiId.trim()}</span>
            </p>
            <Loader2 size={20} className="animate-spin text-emerald-400" />
          </div>
        </div>
      )}

      {/* ── Main payment card ── */}
      <section className="glass glow-emerald rounded-2xl p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/40">
              <CreditCard size={16} className="text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Payment gateway
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-white">
              Collect booking fee securely
            </h2>
            <p className="mt-2 max-w-lg text-sm text-white/40">
              The API mints payment references, stores metadata, and emits
              signed webhooks. Swap in live keys anytime.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Shield, label: "PCI-DSS" },
              { icon: Smartphone, label: "UPI ready" },
              { icon: Lock, label: "Encrypted" },
              { icon: Webhook, label: "Webhooks" },
            ].map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/40"
              >
                <badge.icon size={12} className="text-emerald-400" />
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[300px,1fr]">
          {/* Left: amount + listing info */}
          <div className="space-y-4">
            {listingName && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Selected listing
                </p>
                <p className="mt-1.5 text-lg font-bold text-white">
                  {listingName}
                </p>
                {planSummary && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-white/40">
                    <Route size={12} /> {planSummary}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-white/25">
                  Amount auto-filled from AI planner
                </p>
              </div>
            )}

            <div className="glass rounded-2xl p-5 space-y-4">
              <p className="text-sm font-semibold text-white">
                Booking fee calculator
              </p>
              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  Amount (₹)
                </span>
                <input
                  type="number"
                  min={1500}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="h-12 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 text-lg font-semibold text-white outline-none transition focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                />
              </label>
              <p className="text-[11px] text-white/25">
                Split payments between roommates. Escrow available via holding
                account API.
              </p>
            </div>
          </div>

          {/* Right: method selector + pay button + status */}
          <div className="flex flex-col gap-5">
            {/* Payment method tabs */}
            <div className="flex gap-2 rounded-2xl bg-white/[0.02] p-1.5">
              {[
                { id: "upi" as const, icon: Smartphone, label: "UPI" },
                { id: "card" as const, icon: CreditCard, label: "Card" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPaymentMethod(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    paymentMethod === tab.id
                      ? "bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/10"
                      : "text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* UPI input */}
            {paymentMethod === "upi" && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/30">
                  UPI ID
                </p>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="h-12 w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 text-base text-white placeholder-white/25 outline-none transition focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                />
                <div className="flex flex-wrap gap-2">
                  {["@ybl", "@paytm", "@okaxis", "@ibl"].map((suffix) => (
                    <button
                      key={suffix}
                      type="button"
                      onClick={() =>
                        setUpiId((prev) => {
                          const base = prev.split("@")[0] || "user";
                          return base + suffix;
                        })
                      }
                      className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/40 transition hover:bg-white/[0.06] hover:text-white/60"
                    >
                      {suffix}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-white/20">
                  Mock UPI — no real debit will occur. Any valid-format ID works.
                </p>
              </div>
            )}

            {/* Card placeholder */}
            {paymentMethod === "card" && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/30">
                  Card details
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    readOnly
                    className="h-12 w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 text-base text-white/50 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="MM / YY"
                      readOnly
                      className="h-12 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 text-base text-white/50 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="CVC"
                      readOnly
                      className="h-12 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 text-base text-white/50 outline-none"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-white/20">
                  Mock card — any values accepted. No real charge.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={loading || status === "success"}
              className="btn-shimmer group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-5 text-lg font-bold text-white shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : status === "success" ? (
                <CheckCircle size={22} />
              ) : paymentMethod === "upi" ? (
                <Smartphone size={22} />
              ) : (
                <CreditCard size={22} />
              )}
              {loading
                ? "Processing…"
                : status === "success"
                  ? "Payment Complete"
                  : `Pay via ${paymentMethod === "upi" ? "UPI" : "Card"} · ₹${amount.toLocaleString("en-IN")}`}
            </button>

            {/* Status message */}
            {message && (
              <div
                className={`flex items-start gap-3 rounded-2xl p-4 text-sm ${
                  status === "success"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                )}
                <span>{message}</span>
              </div>
            )}

            {/* Info pills */}
            <div className="space-y-3 rounded-2xl bg-white/[0.02] p-5">
              <div className="flex items-center gap-3 text-sm text-white/30">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-white/40">
                  1
                </span>
                Mock gateway — UPI &amp; Card both simulated
              </div>
              <div className="flex items-center gap-3 text-sm text-white/30">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-white/40">
                  2
                </span>
                Swap in live Razorpay/Stripe keys for production
              </div>
              <div className="flex items-center gap-3 text-sm text-white/30">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-white/40">
                  3
                </span>
                Webhook sample at{" "}
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-emerald-400">
                  /api/payments/mock-webhook
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Move progress tracker ── */}
      {showMap && pickup && dropoff && (
        <section className="glass rounded-2xl p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <MapPin size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  Live tracking
                </p>
                <h3 className="text-lg font-bold text-white">
                  {pickup} → {dropoff}
                </h3>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${
                moveProgress === 100
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-violet-500/15 text-violet-400"
              }`}
            >
              {moveProgress === 100 ? (
                <CheckCircle size={14} />
              ) : (
                <Loader2 size={14} className="animate-spin" />
              )}
              {moveProgress}%
            </span>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-violet-500 transition-all duration-300"
              style={{ width: `${moveProgress}%` }}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
            <ServiceMap />
          </div>

          {moveProgress === 100 && (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-emerald-500/10 p-6 text-center">
              <PartyPopper size={28} className="text-emerald-400" />
              <p className="text-xl font-bold text-white">Move Complete!</p>
              <p className="text-sm text-white/40">
                Your items have been safely delivered to {dropoff}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
