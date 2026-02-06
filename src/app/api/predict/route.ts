import { NextResponse } from "next/server";
import {
  predictPrice,
  generateDistanceCurve,
  generateHourlyCurve,
  type MoveInputs,
} from "@/lib/pricePredictor";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const distanceKm = Number(body.distanceKm);
    const luggageKg = Number(body.luggageKg);
    const floorLevel = Number(body.floorLevel);
    const hourOfDay = Number(body.hourOfDay);
    const daysUntilMove = Number(body.daysUntilMove);
    const hasFragileItems = Boolean(body.hasFragileItems);
    const numberOfRooms = Number(body.numberOfRooms);

    // Validate required numeric fields
    if (
      !Number.isFinite(distanceKm) ||
      distanceKm < 0.5 ||
      distanceKm > 50
    ) {
      return NextResponse.json(
        { error: "Distance must be between 0.5 and 50 km" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(luggageKg) || luggageKg < 5 || luggageKg > 500) {
      return NextResponse.json(
        { error: "Luggage weight must be between 5 and 500 kg" },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(floorLevel) ||
      floorLevel < 0 ||
      floorLevel > 20
    ) {
      return NextResponse.json(
        { error: "Floor level must be between 0 and 20" },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(hourOfDay) ||
      hourOfDay < 0 ||
      hourOfDay > 23
    ) {
      return NextResponse.json(
        { error: "Hour must be between 0 and 23" },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(daysUntilMove) ||
      daysUntilMove < 0 ||
      daysUntilMove > 30
    ) {
      return NextResponse.json(
        { error: "Days until move must be between 0 and 30" },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(numberOfRooms) ||
      numberOfRooms < 1 ||
      numberOfRooms > 6
    ) {
      return NextResponse.json(
        { error: "Number of rooms must be between 1 and 6" },
        { status: 400 },
      );
    }

    const inputs: MoveInputs = {
      distanceKm,
      luggageKg,
      floorLevel,
      hourOfDay,
      daysUntilMove,
      hasFragileItems,
      numberOfRooms,
    };

    const prediction = predictPrice(inputs);

    // Optionally include price curves for visualization
    const includeCurves = body.includeCurves !== false;
    const curves = includeCurves
      ? {
          distanceCurve: generateDistanceCurve(inputs),
          hourlyCurve: generateHourlyCurve(inputs),
        }
      : undefined;

    return NextResponse.json({ prediction, curves });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
