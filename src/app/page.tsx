import { HeroSection } from "@/components/sections/Hero";
import { HighlightsGrid } from "@/components/sections/Highlights";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Testimonials } from "@/components/sections/Testimonials";
import { Footer } from "@/components/sections/Footer";
import { ServiceMap } from "@/components/map/ServiceMap";
import { CalendarClock, ShieldCheck, Truck } from "lucide-react";

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
      <main className="mx-auto flex max-w-7xl flex-col gap-20 px-6 py-16">
        <HeroSection />
        <HighlightsGrid />
        <HowItWorks />
        <ServiceMap />
        <Testimonials />

        {/* Ops Playbook */}
        <section>
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Ops playbook
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
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

        <Footer />
      </main>
    </div>
  );
}
