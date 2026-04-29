import crypto from "crypto";
import { NextRequest } from "next/server";

export type UserRole = "customer" | "mover" | "admin";

export type ShiftyTokenPayload = {
  iss: string;
  sub: string;
  email: string;
  role: UserRole;
  sid: string;
  type: "access" | "refresh";
  iat: number;
  exp: number;
};

const JWT_SECRET = process.env.SHIFTY_AUTH_SECRET ?? "shifty-dev-secret-key";
const ISSUER = "SHIFTY-V1";
const ACCESS_TTL_SEC = 60 * 15; // 15 minutes
const REFRESH_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

function toBase64Url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signToken(payload: ShiftyTokenPayload): string {
  const header = { alg: "HS256", typ: "JWT", kid: "shifty-app" };
  const unsigned = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(
    JSON.stringify(payload),
  )}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(unsigned)
    .digest("base64url");
  return `${unsigned}.${signature}`;
}

function verifyToken(token: string): ShiftyTokenPayload | null {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;

    const unsigned = `${h}.${p}`;
    const expected = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(unsigned)
      .digest("base64url");

    const matched =
      crypto.timingSafeEqual(
        Buffer.from(s, "utf8"),
        Buffer.from(expected, "utf8"),
      );
    if (!matched) return null;

    const payload = JSON.parse(fromBase64Url(p)) as ShiftyTokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.iss !== ISSUER) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildTokenPair(user: {
  id: string;
  email: string;
  role: UserRole;
}) {
  const now = Math.floor(Date.now() / 1000);
  const sessionId = crypto.randomUUID();
  const refresh: ShiftyTokenPayload = {
    iss: ISSUER,
    sub: user.id,
    email: user.email,
    role: user.role,
    sid: sessionId,
    type: "refresh",
    iat: now,
    exp: now + REFRESH_TTL_SEC,
  };
  const access: ShiftyTokenPayload = {
    iss: ISSUER,
    sub: user.id,
    email: user.email,
    role: user.role,
    sid: sessionId,
    type: "access",
    iat: now,
    exp: now + ACCESS_TTL_SEC,
  };

  return {
    accessToken: signToken(access),
    refreshToken: signToken(refresh),
    accessExpiresIn: ACCESS_TTL_SEC,
    refreshExpiresIn: REFRESH_TTL_SEC,
  };
}

export function decodeAuthToken(token: string): ShiftyTokenPayload | null {
  return verifyToken(token);
}

export function parseAuthHeader(request: Request | NextRequest): string | null {
  const maybeReq = request as Request;
  const raw =
    maybeReq.headers.get("authorization") ||
    maybeReq.headers.get("Authorization");
  if (!raw) return null;
  if (raw.toLowerCase().startsWith("bearer ")) {
    return raw.slice(7).trim();
  }
  return null;
}

export function requireAuthToken(
  request: Request | NextRequest,
): ShiftyTokenPayload | null {
  const token = parseAuthHeader(request);
  if (!token) return null;
  return decodeAuthToken(token);
}

export function readAuthFromCookieHeader(
  cookieHeader?: string | null,
): string | null {
  if (!cookieHeader) return null;
  const marker = "shifty_access=";
  const idx = cookieHeader.indexOf(marker);
  if (idx === -1) return null;
  const tail = cookieHeader.slice(idx + marker.length);
  const end = tail.indexOf(";");
  return end === -1 ? tail : tail.slice(0, end);
}
