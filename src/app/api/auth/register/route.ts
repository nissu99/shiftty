import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { hashSecret } from "@/lib/authHelpers";
import { getAuthFromRequest } from "@/lib/shiftySession";
import {
  createUser,
  getUserByEmailOrPhone,
  listUsers,
} from "@/lib/shiftyStore";
import { buildTokenPair } from "@/lib/shifty-auth";

function toText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function sanitize(payload: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "customer" | "mover" | "admin";
  savedAddresses: Array<{
    label: string;
    line1: string;
    city: string;
    pincode: string;
    lat: number;
    lng: number;
  }>;
  createdAt: string;
}) {
  return {
    id: payload.id,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    savedAddresses: payload.savedAddresses,
    createdAt: payload.createdAt,
  };
}

function makeCookie(response: NextResponse, name: string, value: string, maxAgeSec: number) {
  response.cookies.set({
    name,
    value,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAgeSec,
  });
}

export async function POST(request: Request) {
  const session = getAuthFromRequest(request);
  if (session?.type === "access") {
    return NextResponse.json({ message: "Already signed in" }, { status: 200 });
  }

  const body = await request.json().catch(() => ({}));
  const fullName = toText(body.fullName);
  const email = toText(body.email).toLowerCase();
  const phone = toText(body.phone);
  const password = toText(body.password);

  if (!fullName || !email || !phone || password.length < 6) {
    return NextResponse.json({ error: "Name, email, phone and password are required." }, { status: 400 });
  }

  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  if (!/^[6-9]\\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
  }

  if (getUserByEmailOrPhone(email, phone)) {
    return NextResponse.json({ error: "Account already exists." }, { status: 409 });
  }

  const passwordHash = hashSecret(password);
  const seed = crypto.randomUUID();
  const role =
    email.endsWith("@admin.shifty") || listUsers().length === 0 ? "admin" : "customer";
  const user = createUser({
    id: seed,
    fullName,
    email,
    phone,
    passwordHash,
    role,
  });

  const tokens = buildTokenPair({
    id: user.id,
    email: user.email,
    role,
  });

  const response = NextResponse.json(
    { user: sanitize(user), role, tokenType: "access", accessExpiresIn: tokens.accessExpiresIn },
    { status: 201 },
  );
  makeCookie(response, "shifty_access", tokens.accessToken, tokens.accessExpiresIn);
  makeCookie(response, "shifty_refresh", tokens.refreshToken, tokens.refreshExpiresIn);
  return response;
}
