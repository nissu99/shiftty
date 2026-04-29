import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import {
  addOrUpdateAddress,
  getDbSnapshot,
  getUserById,
  updateUserProfile,
} from "@/lib/shiftyStore";
import type { ListingAddress } from "@/lib/shiftyStore";

function toText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function toAddress(payload: unknown): ListingAddress | null {
  if (!payload || typeof payload !== "object") return null;
  const source = payload as Record<string, unknown>;
  const label = toText(source.label);
  const line1 = toText(source.line1);
  const city = toText(source.city);
  const pincode = toText(source.pincode);
  const lat = Number(source.lat);
  const lng = Number(source.lng);
  if (!label || !line1 || !city || !pincode || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { label, line1, city, pincode, lat, lng };
}

export async function GET() {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = getDbSnapshot().users;
  const user = users.find((entry) => entry.id === session.sub);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      savedAddresses: user.savedAddresses,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const fullName = toText(body.fullName);
  const phone = body.phone === undefined ? undefined : toText(body.phone);
  const savedAddress = toAddress(body.address);
  const shouldSaveAddress = body.address !== undefined && savedAddress !== null;

  if (!fullName && !phone && !shouldSaveAddress) {
    return NextResponse.json({ error: "No valid update payload." }, { status: 400 });
  }

  const users = getDbSnapshot().users;
  const user = users.find((entry) => entry.id === session.sub);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (fullName) {
    updateUserProfile(session.sub, { fullName });
  }
  if (phone) {
    if (!/^[6-9]\\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
    }
    updateUserProfile(session.sub, { phone });
  }
  if (shouldSaveAddress) {
    addOrUpdateAddress(user.id, savedAddress);
  }

  const refreshed = getUserById(session.sub);
  if (!refreshed) {
    return NextResponse.json({ error: "Could not persist profile." }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      id: refreshed.id,
      fullName: refreshed.fullName,
      email: refreshed.email,
      phone: refreshed.phone,
      role: refreshed.role,
      savedAddresses: refreshed.savedAddresses,
      createdAt: refreshed.createdAt,
    },
  });
}
