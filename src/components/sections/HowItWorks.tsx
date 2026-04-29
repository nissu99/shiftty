import { ClipboardList, Sparkles, Truck, CheckCircle2 } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Tell us what you're moving",
    description:
      "Pick your current hostel, destination block, and tag fragile or heavy items. Takes under a minute.",
    icon: ClipboardList,
    accent: "emerald",
  },
  {
    n: "02",
    title: "Get an AI-matched plan",
    description:
      "Our model ranks listings and mover bundles against your budget, vibe, and timing — with reasoning.",
    icon: Sparkles,
    accent: "violet",
  },
  {
    n: "03",
    title: "Book, track, and pay",
    description:
      "Confirm a slot, watch the truck on the live map, and settle the bill once the last box is in.",
    icon: Truck,
    accent: "amber",
  },
];

const accentMap: Record<string, string> = {
  emerald: "from-emerald-500/30 to-emerald-500/0 text-emerald-400 border-emerald-500/30",
  violet: "from-violet-500/30 to-violet-500/0 text-violet-400 border-violet-500/30",
  amber: "from-amber-500/30 to-amber-500/0 text-amber-400 border-amber-500/30",
};

export function HowItWorks() {
  return (
    <section>
      <div className="mb-10 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
          Three steps. Zero guesswork.
        </h2>
        <p className="mt-3 max-w-xl text-sm text-white/45">
          Shifty compresses the entire move — scouting, matching, logistics — into a
          single guided flow designed around a student&rsquo;s semester rhythm.
        </p>
      </div>

      <ol className="relative grid gap-6 md:grid-cols-3">
        {/* connecting line across desktop */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:block"
          aria-hidden="true"
        />
        {steps.map((step) => {
          const classes = accentMap[step.accent];
          return (
            <li
              key={step.n}
              className="glass relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/10"
            >
              <div className="relative z-10 flex items-center gap-3">
                <span
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl border bg-gradient-to-br ${classes}`}
                >
                  <step.icon size={22} />
                </span>
                <span className="font-mono text-xs font-semibold tracking-widest text-white/30">
                  STEP {step.n}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/45">
                {step.description}
              </p>
              <div className="mt-5 flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/30">
                <CheckCircle2 size={14} className="text-emerald-400/80" />
                Instant, no phone calls
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
