import { NextResponse } from "next/server";
import {
  campusNodes,
  fleetSummary,
  serviceAreaPolyline,
} from "@/data/serviceArea";

export const revalidate = 300;

export async function GET() {
  return NextResponse.json({
    checkpoints: campusNodes,
    activeFleet: fleetSummary,
    polyline: serviceAreaPolyline,
  });
}
