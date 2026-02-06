import { Layers, Route, ScanBarcode } from "lucide-react";

const highlights = [
  {
    title: "Smart batching",
    description:
      "We cluster students by hostel block and time window so you share movers safely and save up to 22% on every shift.",
    metric: "22% avg. savings",
    icon: Layers,
  },
  {
    title: "Condition-aware routing",
    description:
      "Live Doon traffic fused with campus gate timings ensures your truck never gets stuck at lunch-hour check-posts.",
    metric: "12 min ETA accuracy",
    icon: Route,
  },
  {
    title: "Asset tracking",
    description:
      "Each carton gets an NFC badge. Track sentimental luggage on the Shifty map and get notified when it reaches destination.",
    metric: "0 lost items",
    icon: ScanBarcode,
  },
];

export function HighlightsGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {highlights.map((item, index) => (
        <article
          key={item.title}
          className="glass gradient-border group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <item.icon size={20} className="text-emerald-400" />
            </div>
            <span className="text-sm font-mono font-bold text-white/15">
              0{index + 1}
            </span>
          </div>
          <div className="mt-5">
            <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              {item.metric}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-white">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/40">
            {item.description}
          </p>
        </article>
      ))}
    </section>
  );
}
