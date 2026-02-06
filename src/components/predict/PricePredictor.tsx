'use client';

import { useCallback, useEffect, useState } from "react";
import {
  Brain,
  ChevronRight,
  Clock,
  Flame,
  Loader2,
  Package,
  Ruler,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import type {
  MoveInputs,
  PackagePrediction,
  PriceBreakdown,
  PriceCurvePoint,
  PricePrediction,
} from "@/lib/pricePredictor";

/* ── Demand badge colors ── */
const demandColors = {
  low: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Low demand" },
  moderate: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Moderate" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", label: "High demand" },
  surge: { bg: "bg-rose-500/10", text: "text-rose-400", label: "Surge pricing" },
};

export function PricePredictor() {
  /* ── State ── */
  const [inputs, setInputs] = useState<MoveInputs>({
    distanceKm: 5,
    luggageKg: 60,
    floorLevel: 2,
    hourOfDay: 10,
    daysUntilMove: 3,
    hasFragileItems: false,
    numberOfRooms: 1,
  });

  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [distanceCurve, setDistanceCurve] = useState<PriceCurvePoint[]>([]);
  const [hourlyCurve, setHourlyCurve] = useState<PriceCurvePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>("standard");

  /* ── Input updater helper ── */
  const set = useCallback(
    <K extends keyof MoveInputs>(key: K, value: MoveInputs[K]) =>
      setInputs((prev) => ({ ...prev, [key]: value })),
    [],
  );

  /* ── Fetch prediction ── */
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchPrediction() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...inputs, includeCurves: true }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Prediction failed");
        const data = await res.json();
        if (cancelled) return;
        setPrediction(data.prediction);
        setDistanceCurve(data.curves?.distanceCurve ?? []);
        setHourlyCurve(data.curves?.hourlyCurve ?? []);
      } catch (err) {
        if (cancelled || err instanceof DOMException) return;
        setError("Unable to generate prediction. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timeout = setTimeout(fetchPrediction, 200); // debounce
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [inputs]);

  /* ── Hour label ── */
  const hourLabel = (h: number) => {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  return (
    <div className="space-y-8">
      {/* ── Controls + Live Price ── */}
      <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
        {/* Left: Input controls */}
        <div className="glass rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-emerald-400">
            <Brain size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Model inputs</span>
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <Ruler size={14} /> Distance
              </span>
              <span className="font-semibold text-white">{inputs.distanceKm} km</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={30}
              step={0.5}
              value={inputs.distanceKm}
              onChange={(e) => set("distanceKm", Number(e.target.value))}
            />
          </div>

          {/* Luggage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <Package size={14} /> Luggage weight
              </span>
              <span className="font-semibold text-white">{inputs.luggageKg} kg</span>
            </div>
            <input
              type="range"
              min={5}
              max={300}
              step={5}
              value={inputs.luggageKg}
              onChange={(e) => set("luggageKg", Number(e.target.value))}
            />
          </div>

          {/* Floor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <TrendingUp size={14} /> Floor level
              </span>
              <span className="font-semibold text-white">
                {inputs.floorLevel === 0 ? "Ground" : `Floor ${inputs.floorLevel}`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={inputs.floorLevel}
              onChange={(e) => set("floorLevel", Number(e.target.value))}
            />
          </div>

          {/* Hour of day */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <Clock size={14} /> Preferred time
              </span>
              <span className="font-semibold text-white">{hourLabel(inputs.hourOfDay)}</span>
            </div>
            <input
              type="range"
              min={6}
              max={22}
              step={1}
              value={inputs.hourOfDay}
              onChange={(e) => set("hourOfDay", Number(e.target.value))}
            />
          </div>

          {/* Days until move */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <Flame size={14} /> Days until move
              </span>
              <span className="font-semibold text-white">
                {inputs.daysUntilMove === 0
                  ? "Today!"
                  : `${inputs.daysUntilMove} day${inputs.daysUntilMove > 1 ? "s" : ""}`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={14}
              step={1}
              value={inputs.daysUntilMove}
              onChange={(e) => set("daysUntilMove", Number(e.target.value))}
            />
          </div>

          {/* Rooms */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <Truck size={14} /> Rooms
              </span>
              <span className="font-semibold text-white">{inputs.numberOfRooms}</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("numberOfRooms", n)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                    inputs.numberOfRooms === n
                      ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                      : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Fragile toggle */}
          <button
            type="button"
            onClick={() => set("hasFragileItems", !inputs.hasFragileItems)}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
              inputs.hasFragileItems
                ? "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30"
                : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
            }`}
          >
            <span className="flex items-center gap-2">
              <Shield size={16} />
              Fragile items
            </span>
            <span className={`h-5 w-9 rounded-full transition ${inputs.hasFragileItems ? "bg-violet-500" : "bg-white/10"} relative`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${inputs.hasFragileItems ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </button>
        </div>

        {/* Right: Live result */}
        <div className="space-y-6">
          {/* Error state */}
          {error && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-400">
              <Flame size={16} />
              {error}
            </div>
          )}

          {/* Price hero card */}
          {loading && !prediction ? (
            <div className="glass glow-emerald flex h-48 items-center justify-center rounded-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          ) : prediction ? (
            <div className="glass glow-emerald rounded-2xl p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-white/40">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      ML predicted price
                    </span>
                    {loading && (
                      <Loader2 size={12} className="animate-spin text-emerald-400" />
                    )}
                  </div>
                  <p className="mt-2 text-5xl font-bold text-white">
                    ₹{prediction.basePrice.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-sm text-white/30">
                    ₹{prediction.confidenceInterval.low.toLocaleString("en-IN")} –{" "}
                    ₹{prediction.confidenceInterval.high.toLocaleString("en-IN")} range
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Confidence */}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${prediction.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-white/40">
                      {Math.round(prediction.confidence * 100)}% confidence
                    </span>
                  </div>
                  {/* Demand badge */}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${demandColors[prediction.demandLevel].bg} ${demandColors[prediction.demandLevel].text}`}>
                    {prediction.demandLevel === "surge" ? (
                      <Flame size={12} />
                    ) : prediction.demandLevel === "high" ? (
                      <TrendingUp size={12} />
                    ) : prediction.demandLevel === "low" ? (
                      <TrendingDown size={12} />
                    ) : (
                      <Zap size={12} />
                    )}
                    {demandColors[prediction.demandLevel].label}
                  </span>
                </div>
              </div>

              {/* Savings tip */}
              <div className="mt-5 rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white/50">
                {prediction.savingsTip}
              </div>

              {/* Breakdown */}
              <BreakdownGrid breakdown={prediction.breakdown} />
            </div>
          ) : null}

          {/* Price curves */}
          {(distanceCurve.length > 0 || hourlyCurve.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {distanceCurve.length > 0 && (
                <MiniChart
                  title="Price vs Distance"
                  points={distanceCurve}
                  xLabel="km"
                  highlight={inputs.distanceKm}
                />
              )}
              {hourlyCurve.length > 0 && (
                <MiniChart
                  title="Price vs Time of Day"
                  points={hourlyCurve}
                  xLabel="hr"
                  highlight={inputs.hourOfDay}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Package cards ── */}
      {prediction && prediction.packages.length > 0 && (
        <div>
          <div className="mb-6 flex items-center gap-2">
            <Package size={18} className="text-violet-400" />
            <h3 className="text-lg font-bold text-white">Choose your package</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {prediction.packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedPackage === pkg.id}
                onSelect={() => setSelectedPackage(pkg.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function BreakdownGrid({ breakdown }: { breakdown: PriceBreakdown }) {
  const items = [
    { label: "Distance", value: `₹${breakdown.distanceCost.toLocaleString("en-IN")}` },
    { label: "Luggage", value: `₹${breakdown.luggageCost.toLocaleString("en-IN")}` },
    { label: "Floor", value: `${breakdown.floorSurcharge >= 0 ? "+" : ""}₹${breakdown.floorSurcharge.toLocaleString("en-IN")}` },
    { label: "Demand", value: `${breakdown.demandMultiplier}×` },
    { label: "Urgency", value: `+₹${breakdown.urgencySurcharge.toLocaleString("en-IN")}` },
    { label: "Fragile", value: breakdown.fragileCost > 0 ? `+₹${breakdown.fragileCost.toLocaleString("en-IN")}` : "—" },
  ];

  return (
    <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-white/[0.04] px-3 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/30">{item.label}</p>
          <p className="mt-0.5 text-sm font-semibold text-white/70">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function MiniChart({
  title,
  points,
  xLabel,
  highlight,
}: {
  title: string;
  points: PriceCurvePoint[];
  xLabel: string;
  highlight: number;
}) {
  if (points.length === 0) return null;
  const maxY = Math.max(...points.map((p) => p.y));
  const minY = Math.min(...points.map((p) => p.y));
  const range = maxY - minY || 1;

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{title}</p>
      <div className="mt-4 flex h-28 items-end gap-[2px]">
        {points.map((point, i) => {
          const heightPct = ((point.y - minY) / range) * 100;
          const isHighlighted = Math.abs(point.x - highlight) < (xLabel === "km" ? 1 : 0.6);
          return (
            <div
              key={i}
              className="group relative flex-1"
              title={`${point.label}: ₹${point.y.toLocaleString("en-IN")}`}
            >
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isHighlighted
                    ? "bg-emerald-400 shadow-lg shadow-emerald-500/30"
                    : "bg-white/10 hover:bg-white/20"
                }`}
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              />
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white/10 px-2 py-1 text-[10px] text-white/60 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                ₹{point.y.toLocaleString("en-IN")}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-white/20">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function PackageCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: PackagePrediction;
  selected: boolean;
  onSelect: () => void;
}) {
  const tierColors = {
    economy: { ring: "ring-emerald-500/40", glow: "shadow-emerald-500/10", icon: "text-emerald-400" },
    standard: { ring: "ring-violet-500/40", glow: "shadow-violet-500/10", icon: "text-violet-400" },
    premium: { ring: "ring-amber-500/40", glow: "shadow-amber-500/10", icon: "text-amber-400" },
  };
  const colors = tierColors[pkg.id as keyof typeof tierColors] ?? tierColors.standard;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`glass group relative rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 ${
        selected ? `ring-2 ${colors.ring} shadow-xl ${colors.glow}` : ""
      }`}
    >
      {pkg.recommended && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Best value
        </span>
      )}

      <div className="flex items-center gap-2">
        {pkg.id === "economy" ? (
          <TrendingDown size={18} className={colors.icon} />
        ) : pkg.id === "premium" ? (
          <Sparkles size={18} className={colors.icon} />
        ) : (
          <Zap size={18} className={colors.icon} />
        )}
        <h4 className="text-lg font-bold text-white">{pkg.name}</h4>
      </div>

      <p className="mt-1 text-xs text-white/40">{pkg.tagline}</p>

      <p className="mt-4 text-3xl font-bold text-white">
        ₹{pkg.predictedPrice.toLocaleString("en-IN")}
      </p>
      {pkg.savings > 0 && (
        <p className="mt-1 text-xs text-emerald-400">
          Save ₹{pkg.savings.toLocaleString("en-IN")} vs à la carte
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {pkg.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-white/50">
            <ChevronRight size={12} className="mt-0.5 shrink-0 text-white/20" />
            {feature}
          </li>
        ))}
      </ul>

      <div
        className={`mt-5 rounded-xl py-2.5 text-center text-sm font-semibold transition ${
          selected
            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
            : "bg-white/[0.06] text-white/50 group-hover:bg-white/[0.1]"
        }`}
      >
        {selected ? "Selected" : "Select package"}
      </div>
    </button>
  );
}
