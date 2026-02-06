import { describe, expect, it } from "vitest";
import { housingListings } from "@/data/listings";
import { recommendListings } from "@/lib/matchEngine";

describe("recommendListings", () => {
  it("returns top matches sorted by score", () => {
    const results = recommendListings({
      budget: 8000,
      moveDate: new Date().toISOString().slice(0, 10),
      luggage: "medium",
      vibe: "balanced",
      sourceArea: "Rajpur Road",
      destinationArea: "Clement Town",
    });

    expect(results).toHaveLength(3);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
  });

  it("penalizes listings far above budget", () => {
    const highBudgetResults = recommendListings({
      budget: 6000,
      moveDate: new Date().toISOString().slice(0, 10),
      luggage: "light",
      vibe: "focus",
      sourceArea: "GMS Road",
      destinationArea: "Rajpur Road",
    });

    const mostExpensive = housingListings.find((listing) => listing.rent === Math.max(...housingListings.map((item) => item.rent)));
    expect(highBudgetResults.some((listing) => listing.id === mostExpensive?.id)).toBeFalsy();
  });

  it("boosts listings aligned with destination zone", () => {
    const clementPrefResults = recommendListings({
      budget: 9000,
      moveDate: new Date().toISOString().slice(0, 10),
      luggage: "medium",
      vibe: "focus",
      sourceArea: "Graphic Era Main Gate",
      destinationArea: "Clement Town Gate 2",
    });

    expect(clementPrefResults[0].zone).toContain("Clement Town");
    expect(clementPrefResults[0].rationale).toEqual(
      expect.arrayContaining(["Aligned with your desired destination zone"]),
    );
  });
});
