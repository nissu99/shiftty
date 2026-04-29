import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildTokenPair, decodeAuthToken } from "@/lib/shifty-auth";
import { getUserById } from "@/lib/shiftyStore";

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

export async function POST() {
  const store = await cookies();
  const existing = store.get("shifty_refresh")?.value;
  if (!existing) {
    return NextResponse.json({ error: "Refresh token missing." }, { status: 401 });
  }

  const payload = decodeAuthToken(existing);
  if (!payload || payload.type !== "refresh") {
    return NextResponse.json({ error: "Invalid refresh token." }, { status: 401 });
  }

  const user = getUserById(payload.sub);
  if (!user) {
    return NextResponse.json({ error: "User no longer exists." }, { status: 401 });
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
      role: user.role,
      accessExpiresIn: tokens.accessExpiresIn,
    },
    { status: 200 },
  );
  makeCookie(response, "shifty_access", tokens.accessToken, tokens.accessExpiresIn);
  makeCookie(response, "shifty_refresh", tokens.refreshToken, tokens.refreshExpiresIn);
  return response;
}
