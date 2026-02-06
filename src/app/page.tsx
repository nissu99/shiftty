import Link from "next/link";
import { HeroSection } from "@/components/sections/Hero";
import { HighlightsGrid } from "@/components/sections/Highlights";
import { ServiceMap } from "@/components/map/ServiceMap";
import { CalendarClock, ShieldCheck, Truck, ArrowRight, Sparkles, CreditCard, Brain } from "lucide-react";

const opsPlaybook = [
  {
    title: "Slot intelligence",
    description:
      "Batch movers by hostel block, avoid clashing Graphic Era gate timings and reduce idle hours.",
    icon: CalendarClock,
  },
  {
    title: "Mover scorecards",
    description:
      "Each partner is KYCed, background checked and rated on 14-point hygiene audits every Sunday.",
    icon: ShieldCheck,
  },
  {
    title: "Fleet orchestration",
    description:
      "Smartly assign e-rick, Bolero or mini truck depending on luggage load and weather alerts.",
    icon: Truck,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050a0e]">
      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-16">
        <HeroSection />
        <HighlightsGrid />

        {/* CTA Cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <article className="glass gradient-border group rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Sparkles size={20} className="text-emerald-400" />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-white">
              AI hostel matcher
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/40">
              Tune budgets, vibes, and luggage loads. Our ML engine scores every
              listing in real time.
            </p>
            <Link
              href="/plan"
              className="btn-shimmer mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/40"
            >
              AI planner <ArrowRight size={14} />
            </Link>
          </article>

          <article className="glass gradient-border group rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Brain size={20} className="text-violet-400" />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-white">
              ML price predictor
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/40">
              Predict moving costs with 7-feature regression. Compare Economy,
              Standard, and Premium packages instantly.
            </p>
            <Link
              href="/predict"
              className="btn-shimmer mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/40"
            >
              Predict price <ArrowRight size={14} />
            </Link>
          </article>

          <article className="glass gradient-border group rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <CreditCard size={20} className="text-amber-400" />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-white">
              Secure payments
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/40">
              Complete booking fees, review webhooks, and plug in live gateway
              keys whenever you are ready.
            </p>
            <Link
              href="/payments"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.08]"
            >
              Payment desk <ArrowRight size={14} />
            </Link>
          </article>
        </section>

        {/* Map */}
        <ServiceMap />

        {/* Ops Playbook */}
        <section>
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Ops playbook
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              How we run the fleet
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {opsPlaybook.map((item, index) => (
              <article
                key={item.title}
                className="glass group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <item.icon size={20} className="text-emerald-400" />
                  </div>
                  <span className="font-mono text-sm font-bold text-white/10">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/40">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] pt-10 text-center">
          <p className="text-sm text-white/25">
            2026 Shifty - Built for Graphic Era students - Dehradun, India
          </p>
        </footer>
      </main>
    </div>
  );
}
