import { NextResponse } from "next/server";
import {
  recommendListings,
  type LuggageVolume,
  type MoveVibe,
} from "@/lib/matchEngine";

const vibes: MoveVibe[] = ["focus", "balanced", "social"];
const luggageOptions: LuggageVolume[] = ["light", "medium", "heavy"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const budget = Number(body.budget);
    const moveDate = typeof body.moveDate === "string" ? body.moveDate : "";
    const vibe = body.vibe as MoveVibe;
    const luggage = body.luggage as LuggageVolume;
    const sourceArea = typeof body.sourceArea === "string" ? body.sourceArea.trim() : "";
    const destinationArea =
      typeof body.destinationArea === "string" ? body.destinationArea.trim() : "";
    const topN = typeof body.topN === "number" ? Math.min(Math.max(body.topN, 1), 5) : 3;

    if (!Number.isFinite(budget) || budget < 4000 || budget > 20000) {
      return NextResponse.json(
        { error: "Budget must be between ₹4,000 and ₹20,000" },
        { status: 400 },
      );
    }

    if (!moveDate || Number.isNaN(Date.parse(moveDate))) {
      return NextResponse.json({ error: "Invalid move date" }, { status: 400 });
    }

    if (!vibes.includes(vibe) || !luggageOptions.includes(luggage)) {
      return NextResponse.json({ error: "Invalid vibe or luggage selection" }, { status: 400 });
    }

    if (!sourceArea || !destinationArea) {
      return NextResponse.json(
        { error: "Source and destination areas are required" },
        { status: 400 },
      );
    }

    const recommendations = recommendListings(
      { budget, moveDate, vibe, luggage, sourceArea, destinationArea },
      undefined,
      topN,
    );

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("recommendations endpoint failed", error);
    return NextResponse.json({ error: "Unable to generate recommendations" }, { status: 500 });
  }
}
