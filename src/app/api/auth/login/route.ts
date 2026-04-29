import { NextResponse } from "next/server";
import { verifyHash } from "@/lib/authHelpers";
import { getAuthFromRequest } from "@/lib/shiftySession";
import { getUserByEmailOrPhone } from "@/lib/shiftyStore";
import { buildTokenPair } from "@/lib/shifty-auth";

function toText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
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
  const email = toText(body.email).toLowerCase();
  const phone = toText(body.phone);
  const password = toText(body.password);
  const query = email || phone;

  if (!query || password.length < 6) {
    return NextResponse.json({ error: "Email or phone and password are required." }, { status: 400 });
  }

  const user = getUserByEmailOrPhone(email || query, phone || undefined);
  if (!user || !verifyHash(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const tokens = buildTokenPair({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json(
    {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      accessExpiresIn: tokens.accessExpiresIn,
    },
    { status: 200 },
  );

  makeCookie(response, "shifty_access", tokens.accessToken, tokens.accessExpiresIn);
  makeCookie(response, "shifty_refresh", tokens.refreshToken, tokens.refreshExpiresIn);
  return response;
}
