import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import { getBooking, getTracking } from "@/lib/shiftyStore";

function canAccess(session: { sub: string; role: string } | null, bookingUserId: string) {
  if (!session?.sub) return false;
  if (session.role === "admin") return true;
  return bookingUserId === session.sub;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = getBooking(params.id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!canAccess(session, booking.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tracking = getTracking(params.id, session.role === "admin" ? booking.userId : session.sub);
  if (!tracking) {
    return NextResponse.json({ error: "Tracking unavailable." }, { status: 404 });
  }

  return NextResponse.json(tracking, { status: 200 });
}
