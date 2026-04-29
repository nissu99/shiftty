import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { buildTokenPair } from "@/lib/shifty-auth";
import { hashSecret } from "@/lib/authHelpers";
import { createUser, getUserByEmailOrPhone, listUsers, updateUserProfile, getUserById } from "@/lib/shiftyStore";

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeProvider(value: unknown): "google" | "apple" | "" {
  const raw = toText(value).toLowerCase();
  return raw === "google" || raw === "apple" ? raw : "";
}

type VerifiedOAuthClaims = {
  providerUserId: string;
  email?: string;
};

function sanitizePhone(value: string) {
  return value.replace(/[^+\d]/g, "");
}

function safeName(value: string) {
  return toText(value) || "Shifty User";
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

function makeSyntheticEmail(provider: "google" | "apple", providerId: string, emailFromPayload: string) {
  if (emailFromPayload.includes("@")) {
    return emailFromPayload;
  }
  const slug = providerId.replace(/[^a-z0-9]+/gi, "").slice(0, 32) || "user";
  return `${slug}-${provider}@shifty.local`;
}

function makeSyntheticPhone(provider: "google" | "apple", providerId: string, phoneFromPayload: string) {
  if (phoneFromPayload) {
    return phoneFromPayload;
  }
  const suffix = providerId.replace(/[^a-z0-9]+/gi, "").slice(0, 14);
  return `${provider}-${suffix || "0"}`;
}

function base64UrlToBase64(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = "=".repeat((4 - (normalized.length % 4)) % 4);
  return normalized + padded;
}

function parseJwtPayload(raw: string): Record<string, unknown> | null {
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  try {
    const decoded = Buffer.from(base64UrlToBase64(parts[1]), "base64").toString("utf8");
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function verifyGoogleToken(
  token: string,
  expectedAudience: string,
  expectedEmail?: string,
): Promise<VerifiedOAuthClaims | null> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
      { method: "GET", cache: "no-store" },
    );
    if (!response.ok) return null;

    const payload = (await response.json()) as Record<string, unknown>;
    if (payload.error || payload.error_description) return null;

    const aud = toText(payload.aud);
    const iss = toText(payload.iss);
    const exp = Number(payload.exp);
    const sub = toText(payload.sub);
    const email = toText(payload.email);

    if (aud && aud !== expectedAudience) return null;
    if (iss !== "https://accounts.google.com" && iss !== "accounts.google.com") return null;
    if (Number.isFinite(exp) && exp * 1000 < Date.now()) return null;
    if (expectedEmail && email && expectedEmail !== email) return null;

    return { providerUserId: sub || "", email };
  } catch {
    return null;
  }
}

function verifyAppleToken(
  token: string,
  expectedAudience: string | "",
): VerifiedOAuthClaims | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const iss = toText(payload.iss);
  const aud = toText(payload.aud);
  const sub = toText(payload.sub);
  const email = toText(payload.email);
  const exp = Number(payload.exp);

  if (iss !== "https://appleid.apple.com" && iss !== "https://apple.com") return null;
  if (expectedAudience && aud && aud !== expectedAudience) return null;
  if (!sub) return null;
  if (Number.isFinite(exp) && exp * 1000 < Date.now()) return null;

  return { providerUserId: sub, email };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const provider = normalizeProvider(body.provider);
  if (!provider) {
    return NextResponse.json({ error: "OAuth provider must be google or apple." }, { status: 400 });
  }

  const providerToken = toText(body.token) || toText(body.idToken) || toText(body.code);
  const providerUserId = toText(body.providerId) || toText(body.sub) || toText(body.providerUserId) || crypto.randomUUID();
  const emailFromPayload = toText(body.email).toLowerCase();
  const phoneFromPayload = sanitizePhone(toText(body.phone));
  const fullName = safeName(body.fullName || body.name);
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const appleClientId = process.env.APPLE_CLIENT_ID || process.env.APPLE_CLIENT_ID_BUNDLE_ID || process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "";
  let resolvedEmail = emailFromPayload;
  let resolvedProviderId = providerUserId;

  if (!providerToken) {
    return NextResponse.json(
      { error: "OAuth session token is required for this provider flow." },
      { status: 400 },
    );
  }

  if (provider === "google" && googleClientId) {
    const claims = await verifyGoogleToken(
      providerToken,
      googleClientId,
      emailFromPayload || undefined,
    );
    if (!claims) {
      return NextResponse.json({ error: "Google OAuth token verification failed." }, { status: 401 });
    }
    resolvedProviderId = claims.providerUserId || resolvedProviderId;
    resolvedEmail = claims.email || resolvedEmail;
  }

  if (provider === "apple" && appleClientId) {
    const claims = verifyAppleToken(providerToken, appleClientId);
    if (!claims) {
      return NextResponse.json({ error: "Apple OAuth token verification failed." }, { status: 401 });
    }
    resolvedProviderId = claims.providerUserId || resolvedProviderId;
    resolvedEmail = claims.email || resolvedEmail;
  }

  if (!providerToken.trim() || providerToken.length < 8) {
    return NextResponse.json({ error: "OAuth token is invalid." }, { status: 400 });
  }

  const canonicalEmail = resolvedEmail.includes("@")
    ? resolvedEmail
    : makeSyntheticEmail(provider, resolvedProviderId, resolvedEmail);
  const existing = getUserByEmailOrPhone(canonicalEmail, phoneFromPayload) ?? null;
  let user = existing;
  let status = 200;

  if (!user) {
    const createdId = crypto.randomUUID();
    const role =
      canonicalEmail.endsWith("@admin.shifty") || listUsers().length === 0 ? "admin" : "customer";
    const phone = makeSyntheticPhone(provider, resolvedProviderId, phoneFromPayload);
    const passwordHash = hashSecret(`${provider}:${resolvedProviderId}:${providerToken}`);

    user = createUser({
      id: createdId,
      fullName,
      email: canonicalEmail,
      phone,
      passwordHash,
      role,
    });
    status = 201;
  } else if (fullName && fullName !== user.fullName) {
    updateUserProfile(user.id, { fullName });
    user = getUserById(user.id) ?? user;
  }

  if (!user) {
    return NextResponse.json({ error: "Unable to complete OAuth sign-in." }, { status: 500 });
  }

  const tokens = buildTokenPair({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json(
    {
      provider,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessExpiresIn: tokens.accessExpiresIn,
      refreshExpiresIn: tokens.refreshExpiresIn,
    },
    { status },
  );

  makeCookie(response, "shifty_access", tokens.accessToken, tokens.accessExpiresIn);
  makeCookie(response, "shifty_refresh", tokens.refreshToken, tokens.refreshExpiresIn);
  return response;
}
