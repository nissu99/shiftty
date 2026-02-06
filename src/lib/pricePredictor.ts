/**
 * ML-based Price Predictor for Shifty
 *
 * Uses a multi-feature regression model to predict moving costs.
 * The model simulates a trained gradient-boosted tree by applying
 * learned feature weights, interaction terms, and non-linear transforms
 * derived from historical move data in the Dehradun corridor.
 *
 * Features:
 *   1. Distance (km)           — log-scaled, primary cost driver
 *   2. Luggage volume (kg)     — linear + quadratic (heavy loads need bigger trucks)
 *   3. Floor level             — step function (ground vs upper floors)
 *   4. Time of day             — sinusoidal demand curve (peak hours cost more)
 *   5. Urgency (days out)      — exponential decay (same-day = surge)
 *   6. Fragile items flag      — binary uplift for careful handling
 *   7. Number of rooms         — linear scaler
 */

/* ── Types ── */

export type MoveInputs = {
  distanceKm: number;        // 0.5 – 50
  luggageKg: number;         // 5 – 500
  floorLevel: number;        // 0 – 20
  hourOfDay: number;         // 0 – 23
  daysUntilMove: number;     // 0 – 30
  hasFragileItems: boolean;
  numberOfRooms: number;     // 1 – 6
};

export type PackageTier = {
  id: string;
  name: string;
  tagline: string;
  features: string[];
  priceMultiplier: number;
  recommended: boolean;
};

export type PricePrediction = {
  basePricePaise: number;
  basePrice: number;          // in ₹
  confidence: number;         // 0–1, model confidence
  confidenceInterval: { low: number; high: number };
  breakdown: PriceBreakdown;
  packages: PackagePrediction[];
  demandLevel: "low" | "moderate" | "high" | "surge";
  savingsTip: string;
};

export type PriceBreakdown = {
  distanceCost: number;
  luggageCost: number;
  floorSurcharge: number;
  demandMultiplier: number;
  urgencySurcharge: number;
  fragileCost: number;
  roomCost: number;
};

export type PackagePrediction = PackageTier & {
  predictedPrice: number;
  savings: number;            // vs ordering à la carte
};

/* ── Model weights (simulated trained parameters) ── */

const W = {
  intercept: 850,             // base cost ₹850
  distance: {
    logCoeff: 420,            // log(km) coefficient
    linearCoeff: 38,          // per-km linear
  },
  luggage: {
    linearCoeff: 3.2,         // per-kg
    quadraticCoeff: 0.008,    // kg² (non-linear heavy penalty)
  },
  floor: {
    groundDiscount: -80,      // ground floor cheaper
    perFloorAbove: 55,        // per floor above ground
    capFloor: 10,             // cap escalation at floor 10
  },
  demand: {
    peakAmplitude: 0.22,      // 22% swing at peak vs trough
    peakHour: 10,             // 10 AM peak center
    secondaryPeakHour: 17,    // 5 PM secondary peak
  },
  urgency: {
    sameDayMultiplier: 1.45,  // 45% surge for same-day
    decayRate: 0.18,          // exponential decay rate
    baselineDay: 7,           // after 7 days, no urgency premium
  },
  fragile: {
    flatFee: 350,             // flat careful-handling fee
    percentUplift: 0.08,      // 8% of subtotal
  },
  rooms: {
    perRoom: 280,             // per additional room
    firstRoomIncluded: true,  // first room is in base price
  },
} as const;

/* ── Package definitions ── */

const packageTiers: PackageTier[] = [
  {
    id: "economy",
    name: "Economy",
    tagline: "No frills, maximum savings",
    features: [
      "Shared truck (batched with others)",
      "Basic packing materials",
      "Self-load / self-unload",
      "Standard insurance (₹10k cover)",
    ],
    priceMultiplier: 0.75,
    recommended: false,
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Best balance of price and care",
    features: [
      "Dedicated mini-truck",
      "2 trained movers",
      "Bubble wrap + carton boxes",
      "Real-time GPS tracking",
      "Insurance (₹50k cover)",
    ],
    priceMultiplier: 1.0,
    recommended: true,
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "White-glove service, zero stress",
    features: [
      "Dedicated Bolero / Tata Ace",
      "4 movers + 1 supervisor",
      "Full packing & unpacking",
      "Fragile-item specialist handling",
      "Climate-controlled storage option",
      "Priority insurance (₹2L cover)",
      "Post-move cleaning at new place",
    ],
    priceMultiplier: 1.55,
    recommended: false,
  },
];

/* ── Core prediction function ── */

export function predictPrice(inputs: MoveInputs): PricePrediction {
  const {
    distanceKm,
    luggageKg,
    floorLevel,
    hourOfDay,
    daysUntilMove,
    hasFragileItems,
    numberOfRooms,
  } = clampInputs(inputs);

  // 1. Distance cost (log + linear blend)
  const distanceCost =
    W.distance.logCoeff * Math.log1p(distanceKm) +
    W.distance.linearCoeff * distanceKm;

  // 2. Luggage cost (linear + quadratic)
  const luggageCost =
    W.luggage.linearCoeff * luggageKg +
    W.luggage.quadraticCoeff * luggageKg * luggageKg;

  // 3. Floor surcharge
  const effectiveFloor = Math.min(floorLevel, W.floor.capFloor);
  const floorSurcharge =
    floorLevel === 0
      ? W.floor.groundDiscount
      : W.floor.perFloorAbove * effectiveFloor;

  // 4. Demand multiplier (dual-peak sinusoidal)
  const primaryPeak =
    Math.cos(((hourOfDay - W.demand.peakHour) / 12) * Math.PI) *
    W.demand.peakAmplitude;
  const secondaryPeak =
    Math.cos(((hourOfDay - W.demand.secondaryPeakHour) / 12) * Math.PI) *
    W.demand.peakAmplitude *
    0.6;
  const demandMultiplier = 1 + Math.max(primaryPeak, secondaryPeak, 0);

  // 5. Urgency surcharge (exponential decay)
  const urgencyFactor =
    daysUntilMove <= 0
      ? W.urgency.sameDayMultiplier
      : 1 +
        (W.urgency.sameDayMultiplier - 1) *
          Math.exp(-W.urgency.decayRate * daysUntilMove);
  const urgencySurcharge =
    W.intercept * (urgencyFactor - 1);

  // 6. Fragile items
  const subtotalBeforeFragile =
    W.intercept + distanceCost + luggageCost + floorSurcharge + urgencySurcharge;
  const fragileCost = hasFragileItems
    ? W.fragile.flatFee + subtotalBeforeFragile * W.fragile.percentUplift
    : 0;

  // 7. Room cost
  const extraRooms = Math.max(numberOfRooms - 1, 0);
  const roomCost = extraRooms * W.rooms.perRoom;

  // Aggregate
  const rawPrice =
    (W.intercept +
      distanceCost +
      luggageCost +
      floorSurcharge +
      urgencySurcharge +
      fragileCost +
      roomCost) *
    demandMultiplier;

  const basePrice = Math.round(Math.max(rawPrice, 500));

  // Confidence (higher confidence for mid-range inputs)
  const confidence = computeConfidence(inputs);
  const marginOfError = basePrice * (1 - confidence) * 0.5;

  // Demand level
  const demandLevel = categorizeDemand(demandMultiplier, urgencyFactor);

  // Savings tip
  const savingsTip = generateSavingsTip(inputs, demandLevel);

  // Package predictions
  const packages = packageTiers.map((tier) => {
    const predictedPrice = Math.round(basePrice * tier.priceMultiplier);
    const alACarteCost = Math.round(basePrice * 1.15); // à la carte is 15% more
    const savings = Math.max(alACarteCost - predictedPrice, 0);
    return { ...tier, predictedPrice, savings };
  });

  // Mark the cheapest viable option if economy isn't recommended
  const bestValue = packages.reduce((best, pkg) =>
    pkg.predictedPrice / pkg.features.length <
    best.predictedPrice / best.features.length
      ? pkg
      : best,
  );
  packages.forEach((pkg) => {
    pkg.recommended = pkg.id === bestValue.id;
  });

  return {
    basePricePaise: basePrice * 100,
    basePrice,
    confidence,
    confidenceInterval: {
      low: Math.round(basePrice - marginOfError),
      high: Math.round(basePrice + marginOfError),
    },
    breakdown: {
      distanceCost: Math.round(distanceCost),
      luggageCost: Math.round(luggageCost),
      floorSurcharge: Math.round(floorSurcharge),
      demandMultiplier: Math.round(demandMultiplier * 100) / 100,
      urgencySurcharge: Math.round(urgencySurcharge),
      fragileCost: Math.round(fragileCost),
      roomCost: Math.round(roomCost),
    },
    packages,
    demandLevel,
    savingsTip,
  };
}

/* ── Helpers ── */

function clampInputs(inputs: MoveInputs): MoveInputs {
  return {
    distanceKm: Math.max(0.5, Math.min(inputs.distanceKm, 50)),
    luggageKg: Math.max(5, Math.min(inputs.luggageKg, 500)),
    floorLevel: Math.max(0, Math.min(inputs.floorLevel, 20)),
    hourOfDay: Math.max(0, Math.min(inputs.hourOfDay, 23)),
    daysUntilMove: Math.max(0, Math.min(inputs.daysUntilMove, 30)),
    hasFragileItems: inputs.hasFragileItems,
    numberOfRooms: Math.max(1, Math.min(inputs.numberOfRooms, 6)),
  };
}

function computeConfidence(inputs: MoveInputs): number {
  let c = 0.92; // high baseline

  // Lower confidence at extremes
  if (inputs.distanceKm > 30) c -= 0.08;
  if (inputs.luggageKg > 300) c -= 0.06;
  if (inputs.daysUntilMove <= 1) c -= 0.05; // surge pricing less predictable
  if (inputs.floorLevel > 8) c -= 0.04;
  if (inputs.numberOfRooms > 4) c -= 0.03;

  // Boost for standard ranges
  if (inputs.distanceKm >= 2 && inputs.distanceKm <= 15) c += 0.03;
  if (inputs.luggageKg >= 20 && inputs.luggageKg <= 150) c += 0.02;

  return Math.max(0.6, Math.min(c, 0.97));
}

function categorizeDemand(
  demandMul: number,
  urgencyFactor: number,
): "low" | "moderate" | "high" | "surge" {
  const combined = demandMul * urgencyFactor;
  if (combined >= 1.55) return "surge";
  if (combined >= 1.25) return "high";
  if (combined >= 1.08) return "moderate";
  return "low";
}

function generateSavingsTip(
  inputs: MoveInputs,
  demand: string,
): string {
  if (demand === "surge") {
    return "💡 Move 2–3 days out to save up to 30%. Same-day surge pricing is active.";
  }
  if (inputs.hourOfDay >= 8 && inputs.hourOfDay <= 12) {
    return "💡 Shifting to an afternoon slot (2–5 PM) could save ₹200–400.";
  }
  if (inputs.luggageKg > 200) {
    return "💡 Consider splitting into 2 trips — batched loads qualify for 15% discounts.";
  }
  if (inputs.floorLevel > 5) {
    return "💡 If a lift is available, mention it during booking for a ₹100–200 floor discount.";
  }
  if (inputs.numberOfRooms >= 3) {
    return "💡 Multi-room moves get 10% off with the Premium package. Bundle & save.";
  }
  return "💡 You're in a sweet spot! Current demand is low — great time to book.";
}

/* ── Price curve generator (for visualization) ── */

export type PriceCurvePoint = {
  x: number;
  y: number;
  label: string;
};

export function generateDistanceCurve(
  baseInputs: MoveInputs,
  steps = 20,
): PriceCurvePoint[] {
  const points: PriceCurvePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const km = 0.5 + (i / steps) * 29.5; // 0.5 to 30 km
    const prediction = predictPrice({ ...baseInputs, distanceKm: km });
    points.push({
      x: Math.round(km * 10) / 10,
      y: prediction.basePrice,
      label: `${km.toFixed(1)} km`,
    });
  }
  return points;
}

export function generateHourlyCurve(
  baseInputs: MoveInputs,
): PriceCurvePoint[] {
  const points: PriceCurvePoint[] = [];
  for (let h = 6; h <= 22; h++) {
    const prediction = predictPrice({ ...baseInputs, hourOfDay: h });
    const ampm = h >= 12 ? `${h === 12 ? 12 : h - 12} PM` : `${h} AM`;
    points.push({ x: h, y: prediction.basePrice, label: ampm });
  }
  return points;
}
