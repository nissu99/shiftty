import type { Metadata } from "next";
import { PricePredictor } from "@/components/predict/PricePredictor";

export const metadata: Metadata = {
  title: "ML Price Predictor · Shifty",
  description: "Predict moving costs and find the best package with our ML engine.",
};

export default async function PredictPage() {
  return (
    <div className="min-h-screen bg-[#050a0e]">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
            ML-powered pricing engine
          </p>
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            Predict your move cost{" "}
            <span className="gradient-text">instantly</span>
          </h1>
          <p className="max-w-3xl text-lg text-white/40">
            Our gradient-boosted regression model analyzes 7 input features —
            distance, luggage weight, floor level, time of day, urgency, fragile
            items, and rooms — to generate a real-time price prediction with
            confidence intervals and optimal package recommendations.
          </p>
        </header>
        <PricePredictor />
      </main>
    </div>
  );
}
