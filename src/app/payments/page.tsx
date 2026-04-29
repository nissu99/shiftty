import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentWidget } from "@/components/payments/PaymentWidget";

export const metadata: Metadata = {
  title: "Payments · Shifty",
};

export default async function PaymentsPage() {
  return (
    <div className="min-h-screen bg-[#050a0e]">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Secure booking desk
          </p>
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            Reserve your mover{" "}
            <span className="gradient-text">securely</span>
          </h1>
          <p className="max-w-3xl text-lg text-white/40">
            Complete booking fees using Razorpay checkout, test payment intents, and use mock
            webhook replay when live gateway credentials are not configured.
          </p>
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
            Secure payment session — supports booking-bound and standalone flows.
          </p>
        </header>
        <Suspense
          fallback={
            <section className="glass flex h-48 items-center justify-center rounded-2xl text-sm text-white/30">
              Loading payment workspace…
            </section>
          }
        >
          <PaymentWidget />
        </Suspense>
      </main>
    </div>
  );
}
