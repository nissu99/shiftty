import { describe, expect, it } from "vitest";
import {
  predictPrice,
  generateDistanceCurve,
  generateHourlyCurve,
  type MoveInputs,
} from "@/lib/pricePredictor";

const baseInputs: MoveInputs = {
  distanceKm: 5,
  luggageKg: 60,
  floorLevel: 2,
  hourOfDay: 10,
  daysUntilMove: 3,
  hasFragileItems: false,
  numberOfRooms: 1,
};

describe("predictPrice", () => {
  it("returns a positive base price", () => {
    const result = predictPrice(baseInputs);
    expect(result.basePrice).toBeGreaterThan(0);
    expect(result.basePricePaise).toBe(result.basePrice * 100);
  });

  it("price increases with distance", () => {
    const near = predictPrice({ ...baseInputs, distanceKm: 2 });
    const far = predictPrice({ ...baseInputs, distanceKm: 20 });
    expect(far.basePrice).toBeGreaterThan(near.basePrice);
  });

  it("price increases with luggage weight", () => {
    const light = predictPrice({ ...baseInputs, luggageKg: 20 });
    const heavy = predictPrice({ ...baseInputs, luggageKg: 200 });
    expect(heavy.basePrice).toBeGreaterThan(light.basePrice);
  });

  it("same-day moves cost more than scheduled moves", () => {
    const sameDay = predictPrice({ ...baseInputs, daysUntilMove: 0 });
    const planned = predictPrice({ ...baseInputs, daysUntilMove: 7 });
    expect(sameDay.basePrice).toBeGreaterThan(planned.basePrice);
    expect(sameDay.demandLevel).not.toBe("low");
  });

  it("fragile items add cost", () => {
    const normal = predictPrice({ ...baseInputs, hasFragileItems: false });
    const fragile = predictPrice({ ...baseInputs, hasFragileItems: true });
    expect(fragile.basePrice).toBeGreaterThan(normal.basePrice);
    expect(fragile.breakdown.fragileCost).toBeGreaterThan(0);
  });

  it("ground floor is cheaper than upper floors", () => {
    const ground = predictPrice({ ...baseInputs, floorLevel: 0 });
    const upper = predictPrice({ ...baseInputs, floorLevel: 5 });
    expect(upper.basePrice).toBeGreaterThan(ground.basePrice);
    expect(ground.breakdown.floorSurcharge).toBeLessThan(0);
  });

  it("more rooms increase price", () => {
    const one = predictPrice({ ...baseInputs, numberOfRooms: 1 });
    const four = predictPrice({ ...baseInputs, numberOfRooms: 4 });
    expect(four.basePrice).toBeGreaterThan(one.basePrice);
    expect(four.breakdown.roomCost).toBeGreaterThan(one.breakdown.roomCost);
  });

  it("returns exactly 3 packages", () => {
    const result = predictPrice(baseInputs);
    expect(result.packages).toHaveLength(3);
    const ids = result.packages.map((p) => p.id);
    expect(ids).toContain("economy");
    expect(ids).toContain("standard");
    expect(ids).toContain("premium");
  });

  it("economy is cheaper than standard which is cheaper than premium", () => {
    const result = predictPrice(baseInputs);
    const economy = result.packages.find((p) => p.id === "economy")!;
    const standard = result.packages.find((p) => p.id === "standard")!;
    const premium = result.packages.find((p) => p.id === "premium")!;
    expect(economy.predictedPrice).toBeLessThan(standard.predictedPrice);
    expect(standard.predictedPrice).toBeLessThan(premium.predictedPrice);
  });

  it("confidence is between 0.6 and 0.97", () => {
    const result = predictPrice(baseInputs);
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    expect(result.confidence).toBeLessThanOrEqual(0.97);
  });

  it("confidence interval brackets the base price", () => {
    const result = predictPrice(baseInputs);
    expect(result.confidenceInterval.low).toBeLessThanOrEqual(result.basePrice);
    expect(result.confidenceInterval.high).toBeGreaterThanOrEqual(result.basePrice);
  });

  it("provides a non-empty savings tip", () => {
    const result = predictPrice(baseInputs);
    expect(result.savingsTip.length).toBeGreaterThan(0);
  });
});

describe("generateDistanceCurve", () => {
  it("returns the correct number of points", () => {
    const curve = generateDistanceCurve(baseInputs, 10);
    expect(curve).toHaveLength(11); // 0 to 10 inclusive
  });

  it("prices increase monotonically with distance", () => {
    const curve = generateDistanceCurve(baseInputs, 20);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].y).toBeGreaterThanOrEqual(curve[i - 1].y);
    }
  });
});

describe("generateHourlyCurve", () => {
  it("returns points for hours 6 through 22", () => {
    const curve = generateHourlyCurve(baseInputs);
    expect(curve).toHaveLength(17); // 6 to 22 inclusive
    expect(curve[0].x).toBe(6);
    expect(curve[curve.length - 1].x).toBe(22);
  });
});
