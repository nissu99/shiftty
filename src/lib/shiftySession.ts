import { auth, clerkClient } from "@clerk/nextjs/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { ShiftyTokenPayload } from "./shifty-auth";
import {
  decodeAuthToken,
  type UserRole,
  parseAuthHeader,
  readAuthFromCookieHeader,
} from "./shifty-auth";
import { hashSecret } from "@/lib/authHelpers";
import {
  createUser,
  getDbSnapshot,
  getUserByEmailOrPhone,
  listUsers,
} from "./shiftyStore";

export function getAuthFromRequest(request: Request): ShiftyTokenPayload | null {
  const headerToken = parseAuthHeader(request);
  if (headerToken) {
    return decodeAuthToken(headerToken);
  }

  const cookieToken = readAuthFromCookieHeader(request.headers.get("cookie"));
  if (!cookieToken) return null;

  return decodeAuthToken(cookieToken);
}

export async function getAuthFromCookies(): Promise<ShiftyTokenPayload | null> {
  const store = await cookies();
  const token = store.get("shifty_access")?.value;
  if (token) {
    const customSession = decodeAuthToken(token);
    if (customSession) {
      return customSession;
    }
  }

  const clerkUser = await getClerkLinkedShiftyUser();
  if (!clerkUser) return null;

  const now = Math.floor(Date.now() / 1000);
  return {
    iss: "SHIFTY-V1",
    sub: clerkUser.sub,
    email: clerkUser.email,
    role: clerkUser.role,
    sid: clerkAuthSessionSid(clerkUser.sub),
    type: "access",
    iat: now,
    exp: now + 60 * 60,
  };
}

async function getClerkLinkedShiftyUser(): Promise<{
  sub: string;
  email: string;
  role: UserRole;
} | null> {
  try {
    const clerkAuth = await auth();
    if (!clerkAuth.userId) return null;

    const bySessionId = getDbSnapshot().users.find((user) => user.id === clerkAuth.userId);
    if (bySessionId) {
      return {
        sub: bySessionId.id,
        email: bySessionId.email,
        role: bySessionId.role,
      };
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkAuth.userId);

    const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase();
    const emailFromClerk =
      primaryEmail && primaryEmail.includes("@") ? primaryEmail : `clerk-${clerkAuth.userId}@shifty.local`;

    const byEmail = getUserByEmailOrPhone(emailFromClerk);
    if (byEmail) {
      return {
        sub: byEmail.id,
        email: byEmail.email,
        role: byEmail.role,
      };
    }

    const cleanPhone = clerkUser.primaryPhoneNumber?.phoneNumber?.replace(/\D/g, "").trim();
    const fallbackPhone = (cleanPhone && cleanPhone.length >= 10)
      ? cleanPhone.slice(-10)
      : `9${`${crypto.randomUUID().replace(/\D/g, "")}${clerkAuth.userId.replace(/\D/g, "")}`.slice(0, 9).padStart(9, "0")}`;

    const fullName = clerkUser.fullName || "Clerk User";
    const users = getDbSnapshot().users;
    const role: UserRole =
      emailFromClerk.endsWith("@admin.shifty") || users.length === 0 ? "admin" : "customer";

    const user = createUser({
      id: clerkAuth.userId,
      fullName,
      email: emailFromClerk,
      phone: fallbackPhone,
      passwordHash: hashSecret(`clerk:${clerkAuth.userId}`),
      role,
    });

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

function clerkAuthSessionSid(userId: string) {
  return `clerk-${userId}`;
}

export type PublicUserProfile = {
  id: string;
  email: string;
  role: string;
};
