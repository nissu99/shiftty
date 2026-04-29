import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import { getBooking, getTracking } from "@/lib/shiftyStore";

export async function GET(
  _request: Request,
  { params }: { params: { bookingId: string } },
) {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = getBooking(params.bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!(session.role === "admin" || booking.userId === session.sub)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tracking = getTracking(
    params.bookingId,
    session.role === "admin" ? booking.userId : session.sub,
  );
  if (!tracking) {
    return NextResponse.json({ error: "Tracking unavailable." }, { status: 404 });
  }

  return NextResponse.json(tracking, { status: 200 });
}
