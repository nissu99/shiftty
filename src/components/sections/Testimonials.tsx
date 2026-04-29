import { Quote, Star } from "lucide-react";

const quotes = [
  {
    body:
      "Booked a mover on Sunday night for a Monday 7am shift to the new hostel. Zero calls. Everything tracked from one screen.",
    name: "Isha Bhandari",
    handle: "B.Tech CSE · Batch of 2026",
  },
  {
    body:
      "The price predictor was spookily close to the final bill. Paid through the app and got a receipt before the mover left my gate.",
    name: "Arnav Sharma",
    handle: "B.Tech ECE · Batch of 2027",
  },
  {
    body:
      "Shared the same truck with two friends in my block because of smart batching. Split the bill and saved around ₹1,800.",
    name: "Muskan Rawat",
    handle: "B.Tech CSE · Batch of 2025",
  },
];

export function Testimonials() {
  return (
    <section>
      <div className="mb-10 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400">
          Student reviews
        </p>
        <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
          Built with Clement Town&rsquo;s students
        </h2>
        <div className="mt-4 flex items-center gap-1 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={14} fill="currentColor" />
          ))}
          <span className="ml-2 text-xs text-white/50">
            4.9 / 5 &middot; 312 reviews this semester
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quotes.map((q) => (
          <figure
            key={q.name}
            className="glass gradient-border relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
          >
            <Quote
              size={28}
              className="absolute right-5 top-5 text-white/5"
              aria-hidden="true"
            />
            <blockquote className="text-sm leading-relaxed text-white/75">
              &ldquo;{q.body}&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-white/5 pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-violet-500/30 font-semibold text-white/80">
                {q.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{q.name}</p>
                <p className="text-xs text-white/40">{q.handle}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
