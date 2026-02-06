import { ArrowRight, CreditCard, Sparkles, Zap, Shield, Clock } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Avg. move time", value: "5 hrs", icon: Clock },
  { label: "Campus coverage", value: "18 km²", icon: Zap },
  { label: "Verified movers", value: "42", icon: Shield },
  { label: "Success score", value: "4.9★", icon: Sparkles },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a1118]">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-[128px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-[128px]" />

      {/* Dot grid overlay */}
      <div className="dot-grid absolute inset-0" />

      <div className="relative z-10 px-8 py-16 md:px-14 md:py-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
          {/* Text block */}
          <div className="max-w-2xl space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5">
              <span className="pulse-glow h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium tracking-wide text-emerald-400">
                Clement Town · Graphic Era · Live now
              </span>
            </div>

            <div>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
                <span className="text-white">Frictionless room moves</span>
                <br />
                <span className="gradient-text">for Graphic Era students</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-white/50">
                Match with verified hostels, book a vetted mover, track their
                truck on live maps and pay securely — all in one tap.
                Purpose-built for semester shifts in Clement Town.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/plan"
                className="btn-shimmer group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-7 py-3.5 font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/40"
              >
                Plan your move
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/payments"
                className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 font-semibold text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.08]"
              >
                <CreditCard size={16} />
                Manage payments
              </Link>
            </div>
          </div>

          {/* Bento stat cards */}
          <div className="grid w-full max-w-xs grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass glow-emerald group rounded-2xl p-5 transition-all hover:-translate-y-1"
              >
                <stat.icon
                  size={18}
                  className="text-emerald-400 transition-colors group-hover:text-emerald-300"
                />
                <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-white/40">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
