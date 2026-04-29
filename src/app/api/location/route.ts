import { NextResponse } from "next/server";

import { campusNodes } from "@/data/serviceArea";

type GeocodeSource = "google" | "fallback";

type GeocodeResponse = {
  requestedAddress: string;
  resolvedAddress: string;
  lat: number;
  lng: number;
  source: GeocodeSource;
};

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deterministicOffset(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }
  const bounded = (hash % 1000) - 500;
  return bounded / 1_000_000;
}

function fallbackFromAddress(address: string) {
  const normalized = normalizeText(address);
  const tokens = normalized.split(" ").filter(Boolean);
  let best = campusNodes[0];
  let score = 0;

  for (const node of campusNodes) {
    const nodeTokens = normalizeText(node.name).split(" ");
    const match = nodeTokens.filter((token) =>
      normalized.includes(token) || tokens.some((entry) => entry.includes(token)),
    ).length;
    if (match > score) {
      best = node;
      score = match;
    }
  }

  const lat = best.lat + deterministicOffset(address);
  const lng = best.lng + deterministicOffset(`${address}-lng`);
  return {
    address: best.name,
    lat,
    lng,
    source: "fallback" as GeocodeSource,
  };
}

async function geocodeWithGoogle(address: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(apiKey)}`,
      { method: "GET", next: { revalidate: 0 } },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      status?: string;
      error_message?: string;
      results?: Array<{ formatted_address?: string; geometry?: { location?: { lat?: number; lng?: number } } }>;
    };

    if (payload.status !== "OK" || !payload.results?.length) {
      return null;
    }

    const first = payload.results[0];
    const lat = Number(first?.geometry?.location?.lat);
    const lng = Number(first?.geometry?.location?.lng);
    const resolvedAddress = toText(first?.formatted_address);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return {
      address: resolvedAddress || address,
      lat,
      lng,
      source: "google" as GeocodeSource,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = toText(url.searchParams.get("address"));

  if (!address) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    const google = await geocodeWithGoogle(address, apiKey);
    if (google) {
      const payload: GeocodeResponse = {
        requestedAddress: address,
        resolvedAddress: google.address,
        lat: google.lat,
        lng: google.lng,
        source: google.source,
      };
      return NextResponse.json(payload, { status: 200 });
    }
  }

  const fallback = fallbackFromAddress(address);
  const payload: GeocodeResponse = {
    requestedAddress: address,
    resolvedAddress: fallback.address,
    lat: fallback.lat,
    lng: fallback.lng,
    source: fallback.source,
  };

  return NextResponse.json(payload, { status: 200 });
}
