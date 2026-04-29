import { type Coordinate, haversineDistanceKm, interpolateCoordinate } from "./geo";

export type BuildingType = "apartment" | "independent" | "office";

export type InventoryLine = {
  itemId: string;
  itemName: string;
  quantity: number;
  isFragile: boolean;
  category: string;
  estimatedVolume?: number;
};

export type ShiftInputs = {
  distanceKm: number;
  totalItems: number;
  fragileCount: number;
  largeFurnitureCount: number;
  buildingType: BuildingType;
  floorNumber: number;
  elevatorAvailable: boolean;
  peakHour: number;
  dayOfWeek: number;
  advanceBookingDays: number;
  inventory: InventoryLine[];
  sourceCoordinates?: Coordinate;
  destinationCoordinates?: Coordinate;
};

export type PackageType = "Basic" | "Standard" | "Premium";

export type OfferSnapshot = {
  discountPercent: number;
  reasons: string[];
};

export type ShiftRecommendation = {
  packageType: PackageType;
  packageConfidence: number; // 0..1
  featureImportances: {
    large_furniture: number;
    total_items: number;
    distance_km: number;
    fragile_count: number;
    peak_hour: number;
    advance_booking_days: number;
    building_type: number;
  };
};

export type PricingResult = {
  basePrice: number;
  discount: OfferSnapshot;
  finalPrice: number;
  demandMultiplier: number;
  floorSurcharge: number;
  fragileSurcharge: number;
  urgencySurcharge: number;
  packageMultiplier: number;
  routeDistanceKm: number;
  breakdown: {
    distanceComponent: number;
    itemizedBaseComponent: number;
    riskHandling: number;
    floorAndAccess: number;
    demandFactor: number;
  };
  packageSuggestion: {
    basic: number;
    standard: number;
    premium: number;
  };
  confidence: number;
};

const PACKAGE_COST_BASE = {
  Basic: 1,
  Standard: 1.18,
  Premium: 1.55,
} as const;

function normalizeDay(day: number) {
  const normalized = ((day % 7) + 7) % 7;
  return normalized;
}

export function recommendPackage(input: ShiftInputs): ShiftRecommendation {
  const { totalItems, fragileCount, largeFurnitureCount, distanceKm, floorNumber, dayOfWeek, peakHour, advanceBookingDays } = input;

  const featureVector = {
    total_items: Math.max(1, totalItems),
    fragile_count: Math.max(0, fragileCount),
    large_furniture: Math.max(0, largeFurnitureCount),
    distance_km: Math.max(0.5, distanceKm),
    floor_number: Math.max(0, floorNumber),
    building_type: input.buildingType === "apartment" ? 0 : input.buildingType === "independent" ? 0.8 : 1.1,
    peak_hour: peakHour >= 9 && peakHour <= 18 ? 1 : 0,
    advance_booking_days: Math.max(0, advanceBookingDays),
  };

  // Simulate RandomForest-style voting with score surfaces.
  const basicScore =
    90
    - featureVector.total_items * 2.1
    - featureVector.fragile_count * 1.2
    - featureVector.large_furniture * 5
    - featureVector.distance_km * 1.2
    - featureVector.floor_number * 0.9
    - featureVector.peak_hour * 1.5
    + (!input.elevatorAvailable ? 3 : 0)
    + (featureVector.building_type * 2.5);

  const standardScore =
    62
    + featureVector.total_items * 1.8
    + featureVector.fragile_count * 4.3
    + featureVector.large_furniture * 6
    + Math.min(featureVector.distance_km, 45) * 2.1
    + (featureVector.peak_hour * 2)
    + (advanceBookingDays <= 2 ? 2.5 : 0)
    + (input.buildingType === "apartment" ? 3 : 0);

  const premiumScore =
    20
    + featureVector.total_items * 2.1
    + featureVector.fragile_count * 5.8
    + featureVector.large_furniture * 9
    + featureVector.distance_km * 3.2
    + featureVector.peak_hour * 4
    + Math.max(0, 4 - normalizeDay(dayOfWeek)) * 0.5
    + featureVector.building_type * 5;

  const scores = {
    Basic: basicScore,
    Standard: standardScore,
    Premium: premiumScore,
  };

  const best = Object.entries(scores).reduce((acc, [name, score]) =>
    score > acc.score ? { name: name as PackageType, score } : acc,
  { name: "Basic" as PackageType, score: scores.Basic });

  const softmax = softMax(Object.values(scores));
  const confidence = Math.max(
    0.62,
    Math.min(0.97, Math.max(...softmax)),
  );

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);

  return {
    packageType: best.name,
    packageConfidence: Number(confidence.toFixed(2)),
    featureImportances: {
      large_furniture: Number((scoreFraction(scores.Premium, total)).toFixed(2)),
      total_items: Number((scoreFraction(scores.Standard, total)).toFixed(2)),
      distance_km: Number((scoreFraction(scores.Standard, total)).toFixed(2)),
      fragile_count: Number((scoreFraction(scores.Premium, total)).toFixed(2)),
      peak_hour: Number((scoreFraction(scores.Premium, total)).toFixed(2)),
      advance_booking_days: Number((scoreFraction(scores.Standard, total)).toFixed(2)),
      building_type: Number((scoreFraction(scores.Premium, total)).toFixed(2)),
    },
  };
}

function scoreFraction(score: number, total: number) {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(1, score / total));
}

function softMax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((exp) => exp / sum);
}

export function estimatePrice(input: ShiftInputs, packageType: PackageType): PricingResult {
  const {
    distanceKm,
    totalItems,
    fragileCount,
    floorNumber,
    peakHour,
    dayOfWeek,
    advanceBookingDays,
    inventory,
  } = input;

  const routeDistance = Math.max(0.5, distanceKm);
  const fragileRatio = Math.min(1, totalItems > 0 ? fragileCount / Math.max(totalItems, 1) : 0);

  const distanceComponent = Math.round(700 + routeDistance * 120 + Math.log1p(routeDistance) * 130);
  const itemizedBaseComponent = Math.round(
    totalItems * 130 + inventory.reduce((sum, item) => sum + item.estimatedVolume * 220 * Math.min(item.quantity, 6), 0),
  );

  const riskHandling = fragileRatio > 0
    ? Math.round(420 + fragileCount * 180)
    : 0;

  const floorAndAccess = floorNumber * (input.elevatorAvailable ? 45 : 130);

  const demandMultiplier = peakHour >= 10 && peakHour <= 12
    ? 1.24
    : peakHour >= 17 && peakHour <= 20
      ? 1.16
      : 0.98;

  const weekday = normalizeDay(dayOfWeek);
  const weekendPenalty = weekday >= 5 ? 1.08 : 1;
  const urgency = advanceBookingDays >= 14
    ? 0.9
    : advanceBookingDays >= 7
      ? 0.96
      : Math.max(1, 1.20 - advanceBookingDays * 0.02);

  const packageMultiplier = PACKAGE_COST_BASE[packageType];

  const preDiscount = Math.max(
    650,
    (distanceComponent + itemizedBaseComponent + riskHandling + floorAndAccess) *
      demandMultiplier *
      weekendPenalty *
      urgency *
      packageMultiplier,
  );

  const discount = applyOfferEngine({ dayOfWeek: weekday, hour: peakHour, advanceBookingDays });
  const finalPrice = Math.round(preDiscount * (1 - discount.discountPercent / 100));

  const packageSuggestion = {
    basic: Math.max(500, Math.round(preDiscount * PACKAGE_COST_BASE.Basic * (1 - discount.discountPercent / 100))),
    standard: Math.max(650, Math.round(preDiscount * PACKAGE_COST_BASE.Standard * (1 - discount.discountPercent / 100))),
    premium: Math.max(950, Math.round(preDiscount * PACKAGE_COST_BASE.Premium * (1 - discount.discountPercent / 100))),
  };

  const confidence = computePriceConfidence(input);

  return {
    basePrice: Math.round(preDiscount),
    discount,
    finalPrice: Math.max(600, finalPrice),
    demandMultiplier: Number(demandMultiplier.toFixed(2)),
    floorSurcharge: floorAndAccess,
    fragileSurcharge: riskHandling,
    urgencySurcharge: Math.round((urgency - 1) * preDiscount),
    packageMultiplier,
    routeDistanceKm: Number(routeDistance.toFixed(2)),
    breakdown: {
      distanceComponent,
      itemizedBaseComponent,
      riskHandling,
      floorAndAccess,
      demandFactor: Number((distanceComponent + itemizedBaseComponent) * demandMultiplier / Math.max(routeDistance, 1)),
    },
    packageSuggestion,
    confidence,
  };
}

function applyOfferEngine({
  dayOfWeek,
  hour,
  advanceBookingDays,
}: {
  dayOfWeek: number;
  hour: number;
  advanceBookingDays: number;
}): OfferSnapshot {
  const reasons: string[] = [];
  let discount = 0;

  if (dayOfWeek <= 2) {
    discount += 10;
    reasons.push("Weekday incentive discount (Mon-Wed): 10%");
  }

  if (hour >= 11 && hour <= 16) {
    discount += 5;
    reasons.push("Off-peak hour discount (11 AM - 4 PM): 5%");
  }

  if (advanceBookingDays >= 14) {
    discount += 7;
    reasons.push("Advance booking discount (14+ days): 7%");
  }

  return {
    discountPercent: Math.min(discount, 22),
    reasons,
  };
}

function computePriceConfidence(input: ShiftInputs): number {
  let confidence = 0.91;
  if (input.peakHour >= 2 && input.peakHour <= 6) confidence -= 0.08;
  if (input.distanceKm > 30) confidence -= 0.05;
  if (input.totalItems > 80) confidence -= 0.06;
  if (input.fragileCount / Math.max(input.totalItems, 1) > 0.5) confidence -= 0.04;
  if (input.advanceBookingDays >= 14) confidence += 0.02;
  return Number(Math.max(0.6, Math.min(confidence, 0.98)).toFixed(2));
}

export function buildInventoryPayloadFromClient(items: InventoryLine[]) {
  return {
    total_items: items.reduce((sum, item) => sum + Math.max(item.quantity, 0), 0),
    fragile_count: items.reduce(
      (sum, item) => sum + (item.isFragile ? Math.max(item.quantity, 0) : 0),
      0,
    ),
    large_furniture: items.filter((item) => ["furniture"].includes(item.category))
      .reduce((sum, item) => sum + Math.max(item.quantity, 0), 0),
  };
}

export function estimateLiveTrackingPoint({
  booking,
  ratio,
  fallback,
}: {
  booking: { sourceCoords: Coordinate; destinationCoords: Coordinate };
  ratio: number;
  fallback: Coordinate;
}): Coordinate {
  return booking.sourceCoords && booking.destinationCoords
    ? interpolateCoordinate(booking.sourceCoords, booking.destinationCoords, ratio)
    : fallback;
}

export function normalizeBuildingType(value: string): BuildingType {
  const normalized = value.toLowerCase();
  if (normalized.includes("office")) return "office";
  if (normalized.includes("independent") || normalized.includes("house")) return "independent";
  return "apartment";
}
