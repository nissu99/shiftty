import { NextResponse } from "next/server";
import { housingListings } from "@/data/listings";

export const revalidate = 600; // seconds

export async function GET() {
  return NextResponse.json({ listings: housingListings });
}
