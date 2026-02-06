'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, Package, Sparkles } from "lucide-react";
import { type LuggageVolume, type MoveVibe, type Recommendation } from "@/lib/matchEngine";

const vibes: { value: MoveVibe; label: string; helper: string }[] = [
  { value: "focus", label: "Focus", helper: "Quiet, study-heavy" },
  { value: "balanced", label: "Balanced", helper: "Mix of solo & group" },
  { value: "social", label: "Social", helper: "Community-first" },
];

const luggageOptions: { value: LuggageVolume; label: string }[] = [
  { value: "light", label: "Carry-on" },
  { value: "medium", label: "Room essentials" },
  { value: "heavy", label: "Full apartment" },
];

const locationHints = [
  "Graphic Era Main Gate",
  "Clement Town Police Chowki",
  "Subhash Nagar Chowk",
  "Ballupur Chowk",
  "GMS Road",
];

export function MatchPlanner() {
  const router = useRouter();
  const [budget, setBudget] = useState(8000);
  const [moveDate, setMoveDate] = useState(() =>
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [vibe, setVibe] = useState<MoveVibe>("balanced");
  const [luggage, setLuggage] = useState<LuggageVolume>("medium");
  const [sourceArea, setSourceArea] = useState("Graphic Era Main Gate");
  const [destinationArea, setDestinationArea] = useState("Clement Town Gate 2");
  const [matches, setMatches] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReserve = (listing: Recommendation) => {
    const params = new URLSearchParams();
    params.set("listingId", listing.id);
    params.set("listing", listing.title);
    params.set("amount", String(listing.rent));
    if (sourceArea.trim()) params.set("pickup", sourceArea.trim());
    if (destinationArea.trim()) params.set("dropoff", destinationArea.trim());
    router.push(`/payments?${params.toString()}`);
  };

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchRecommendations() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budget,
            moveDate,
            vibe,
            luggage,
            sourceArea,
            destinationArea,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load move matches");
        }

        const data = (await response.json()) as { recommendations: Recommendation[] };
        if (ignore) return;
        setMatches(data.recommendations ?? []);
      } catch (err) {
        if (ignore || err instanceof DOMException) return;
        console.error("recommendations fetch failed", err);
        setError("We couldn't score hostels right now. Try again in a bit.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchRecommendations();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [budget, moveDate, vibe, luggage, sourceArea, destinationArea]);

  return (
    <section
      id="matcher"
      className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl"
    >
      {/* section header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            ML-based pairing
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Predict the best hostel + mover combo
          </h2>
          <p className="mt-2 text-white/50">
            Our lightweight gradient boosting model ranks listed hostels by rent
            fit, travel effort and your preferred vibe.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "scoring your move plan" : "refreshed every 2 hours"}
        </div>
      </div>

      {/* form + results grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[320px,1fr]">
        {/* ── inputs panel ── */}
        <form className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
          <label className="flex flex-col gap-2 text-sm font-medium text-white/60">
            Pickup location
            <input
              list="location-hints"
              value={sourceArea}
              onChange={(event) => setSourceArea(event.target.value)}
              placeholder="e.g. Boys Hostel Block A"
              className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-base text-white placeholder-white/30 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-white/60">
            Destination/Drop-off
            <input
              list="location-hints"
              value={destinationArea}
              onChange={(event) => setDestinationArea(event.target.value)}
              placeholder="e.g. Clement Town Gate 2"
              className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-base text-white placeholder-white/30 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition"
            />
          </label>

          <datalist id="location-hints">
            {locationHints.map((hint) => (
              <option key={hint} value={hint} />
            ))}
          </datalist>

          <label className="flex flex-col gap-2 text-sm font-medium text-white/60">
            Monthly budget (₹)
            <input
              type="range"
              min={5000}
              max={13000}
              step={500}
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
              className="accent-emerald-500"
            />
            <span className="text-2xl font-bold text-white">
              ₹{budget.toLocaleString("en-IN")}
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-white/60">
            Move-in date
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 transition focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/20">
              <Calendar size={18} className="text-white/40" />
              <input
                type="date"
                value={moveDate}
                onChange={(event) => setMoveDate(event.target.value)}
                className="h-12 flex-1 bg-transparent text-base text-white focus:outline-none [color-scheme:dark]"
              />
            </div>
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-white/60">
              Preferred vibe
            </legend>
            <div className="grid gap-3">
              {vibes.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVibe(option.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    vibe === option.value
                      ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <p className="text-base font-semibold text-white">
                    {option.label}
                  </p>
                  <p className="text-sm text-white/40">{option.helper}</p>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-white/60">
              Luggage volume
            </legend>
            <div className="flex gap-3">
              {luggageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLuggage(option.value)}
                  className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    luggage === option.value
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04]"
                  }`}
                >
                  <Package size={16} className="inline-block" /> {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        </form>

        {/* ── results ── */}
        <div className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}

          {loading && matches.length === 0 && (
            <article className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <div className="h-6 w-24 rounded-full bg-white/[0.08]" />
              <div className="mt-4 h-4 w-48 rounded-full bg-white/[0.06]" />
              <div className="mt-2 h-4 w-72 rounded-full bg-white/[0.06]" />
            </article>
          )}

          {matches.map((listing) => (
            <article
              key={listing.id}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/[0.1] hover:bg-white/[0.04]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                    score
                  </p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {listing.score}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-white">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-white/40">{listing.address}</p>
                  {listing.routeSummary && (
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-400">
                      {listing.routeSummary}
                    </p>
                  )}
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-xs uppercase text-white/30">Rent</dt>
                  <dd className="text-base font-bold text-white">
                    ₹{listing.rent.toLocaleString("en-IN")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-white/30">Travel</dt>
                  <dd className="text-white/60">{listing.travelTimeMinutes} min</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-white/30">Rating</dt>
                  <dd className="text-white/60">{listing.rating}★</dd>
                </div>
              </dl>

              <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                {listing.amenities.slice(0, 3).map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-400"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>

              <ul className="mt-4 space-y-1 text-sm text-white/50">
                {listing.rationale.map((item) => (
                  <li key={item}>
                    <span className="mr-1 text-emerald-500">▸</span>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleReserve(listing)}
                className="btn-shimmer mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:shadow-emerald-500/30"
              >
                Reserve slot
              </button>
            </article>
          ))}

          {!loading && !error && matches.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-center text-sm text-white/30">
              Adjust your budget or vibe to see fresh recommendations.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
