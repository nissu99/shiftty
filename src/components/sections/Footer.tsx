import Link from "next/link";
import { Mail, Github, MapPin } from "lucide-react";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "AI planner", href: "/plan" },
      { label: "Price predictor", href: "/predict" },
      { label: "Payments", href: "/payments" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Create account", href: "/sign-up" },
    ],
  },
  {
    heading: "Campus",
    links: [
      { label: "Clement Town", href: "#" },
      { label: "Graphic Era Hill", href: "#" },
      { label: "Kandoli area", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a1118] px-8 py-12 md:px-14">
      {/* subtle glow */}
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[128px]" />

      <div className="relative z-10 grid gap-10 md:grid-cols-[1.3fr_2fr]">
        {/* Brand block */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-violet-500 font-bold text-white">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Shifty
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/45">
            The AI-powered room-shifting companion built for Graphic Era Hill
            University students. Real movers, live tracking, honest prices.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="mailto:hello@shifty.app"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <Mail size={13} /> hello@shifty.app
            </a>
            <a
              href="https://github.com"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <Github size={13} /> github
            </a>
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">
              <MapPin size={13} className="text-emerald-400" /> Dehradun, IN
            </span>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/60 transition hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-white/35 md:flex-row md:items-center">
        <p>© 2026 Shifty · Built for Graphic Era students</p>
        <p>A B.Tech major project · CSE Department · GEHU Dehradun</p>
      </div>
    </footer>
  );
}
