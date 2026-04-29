import { BookingPlanner } from "@/components/booking/BookingPlanner";
import { Sparkles, PackagePlus, MapPinned, Shield, CalendarClock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Move Planner · Shifty",
};

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-[#050a0e]">
      {/* subtle radial glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08)_0%,transparent_60%)]" />

      <main className="relative mx-auto flex max-w-5xl flex-col gap-10 px-4 py-20 sm:px-8">
        {/* page header */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-emerald-400">
            <Sparkles size={14} />
            Booking planner workspace
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Build inventory, get AI recommendation, and create your booking
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-white/50">
            Add room items, choose pickup/drop points, and let the model suggest the
            <code className="mx-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-emerald-400 text-xs">
              recommended package + final price
            </code>
            before confirming a booking.
          </p>

          {/* feature pills */}
          <div className="flex flex-wrap gap-3 pt-2">
            {[
              { icon: MapPinned, text: "Route + distance aware quote" },
              { icon: PackagePlus, text: "Fragility-aware packaging" },
              { icon: Shield, text: "Auth-backed booking actions" },
              { icon: CalendarClock, text: "Reschedule / cancel guardrails" },
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
        </header>

        <BookingPlanner />
      </main>
    </div>
  );
}
