import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import { getDbSnapshot } from "@/lib/shiftyStore";

export async function GET() {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: admin role required" },
      { status: 403 },
    );
  }

  const users = getDbSnapshot().users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    addressCount: user.savedAddresses.length,
  }));

  return NextResponse.json({ users });
}

