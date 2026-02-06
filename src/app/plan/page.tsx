import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { Sparkles, Shield, Cpu } from "lucide-react";
import { MatchPlanner } from "@/components/matching/MatchPlanner";

export const metadata: Metadata = {
  title: "AI Move Planner · Shifty",
};

export default async function PlanPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#050a0e]">
      {/* subtle radial glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08)_0%,transparent_60%)]" />

      <main className="relative mx-auto flex max-w-5xl flex-col gap-10 px-4 py-20 sm:px-8">
        {/* page header */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-emerald-400">
            <Sparkles size={14} />
            AI pairing workbench
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Dial in the perfect hostel + mover combo
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-white/50">
            Adjust your budget, vibe, and luggage load. The planner calls our
            <code className="mx-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-emerald-400 text-xs">/api/recommendations</code>
            endpoint so the same ML engine powers web, mobile, and ops dashboards.
          </p>

          {/* feature pills */}
          <div className="flex flex-wrap gap-3 pt-2">
            {[
              { icon: Cpu, text: "Gradient-boosted ranking" },
              { icon: Shield, text: "Auth-protected" },
              { icon: Sparkles, text: "Live scoring" },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-white/40"
              >
                <Icon size={12} className="text-emerald-400" />
                {text}
              </span>
            ))}
          </div>

          {userId && (
            <p className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              Authenticated · preferences syncing
            </p>
          )}
        </header>

        <MatchPlanner />
      </main>
    </div>
  );
}
