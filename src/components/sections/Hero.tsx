import { ArrowRight, CreditCard, Sparkles, Zap, Shield, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

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
                href="/match"
                className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-7 py-3.5 font-semibold text-emerald-200 transition-all hover:bg-emerald-500/20"
              >
                Match hostel + mover
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

          {/* Bento stat cards — asymmetric layout */}
          <div className="grid w-full max-w-sm grid-cols-6 gap-3">
            {/* Hero stat — spans 2 rows */}
            <div className="glass glow-emerald group col-span-4 row-span-2 flex flex-col justify-between rounded-2xl p-5 transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <TrendingUp size={18} className="text-emerald-400" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/80">
                  live
                </span>
              </div>
              <div>
                <p className="text-5xl font-bold text-white">4.9<span className="text-2xl text-amber-400">★</span></p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-white/40">
                  Semester rating · 312 reviews
                </p>
              </div>
            </div>

            {/* Coverage */}
            <div className="glass group col-span-2 flex items-center gap-2 rounded-2xl p-4 transition-all hover:-translate-y-1">
              <Zap size={16} className="text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold text-white">18<span className="text-xs text-white/50">km²</span></p>
                <p className="text-[10px] uppercase tracking-wider text-white/40">coverage</p>
              </div>
            </div>

            {/* Movers */}
            <div className="glass group col-span-2 flex items-center gap-2 rounded-2xl p-4 transition-all hover:-translate-y-1">
              <Shield size={16} className="text-violet-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold text-white">42</p>
                <p className="text-[10px] uppercase tracking-wider text-white/40">movers</p>
              </div>
            </div>

            {/* Avg time — full width strip */}
            <div className="glass col-span-6 flex items-center justify-between rounded-2xl p-4 transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock size={14} className="text-amber-400" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">5 hrs avg. move</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">pickup to drop</p>
                </div>
              </div>
              <span className="pulse-glow h-2 w-2 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
