import type { Metadata } from "next";
import { MatchPlanner } from "@/components/matching/MatchPlanner";

export const metadata: Metadata = {
  title: "Move Match Planner · Shifty",
};

export default function MatchPage() {
  return (
    <div className="min-h-screen bg-[#050a0e]">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
            AI Match Planner
          </p>
          <h1 className="text-4xl font-bold text-white">
            Find listings and reserve for your move profile
          </h1>
          <p className="max-w-3xl text-sm text-white/45">
            Use budget, urgency, vibe, and luggage profile to get ranked matches, then
            reserve a result through quick payment flow.
          </p>
        </header>
        <MatchPlanner />
      </main>
    </div>
  );
}
