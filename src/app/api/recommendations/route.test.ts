import { describe, expect, it } from "vitest";
import { POST } from "./route";

const endpointUrl = "http://localhost/api/recommendations";

describe("/api/recommendations endpoint", () => {
  it("returns recommendation payload for a valid profile", async () => {
    const response = await POST(
      new Request(endpointUrl, {
        method: "POST",
        body: JSON.stringify({
          budget: 8000,
          moveDate: new Date().toISOString().slice(0, 10),
          luggage: "medium",
          vibe: "balanced",
          sourceArea: "Boys Hostel Block A",
          destinationArea: "Clement Town Gate 2",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as { recommendations: unknown[] };
    expect(Array.isArray(data.recommendations)).toBe(true);
    expect(data.recommendations.length).toBeGreaterThan(0);
  });

  it("guards against invalid payloads", async () => {
    const response = await POST(
      new Request(endpointUrl, {
        method: "POST",
        body: JSON.stringify({ budget: 1000 }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
