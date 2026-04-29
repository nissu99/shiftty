import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import {
  cancelBooking,
  getBooking,
  rescheduleBooking,
} from "@/lib/shiftyStore";

function ensureAuthBooking(session: { sub: string; role: string } | null, bookingUserId: string) {
  if (!session?.sub) return false;
  if (session.role === "admin") return true;
  return session.sub === bookingUserId;
}

function toDateString(value: unknown): string {
  if (typeof value !== "string") return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getAuthFromCookies();
  const booking = getBooking(params.id);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!ensureAuthBooking(session, booking.userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ booking }, { status: 200 });
}

export async function PATCH(
  request: Request,
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

  if (!ensureAuthBooking(session, booking.userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action.toLowerCase() : "";

  try {
    if (action === "cancel") {
      const updated = cancelBooking(params.id, booking.userId);
      if (!updated) {
        return NextResponse.json({ error: "Unable to cancel booking." }, { status: 400 });
      }

      return NextResponse.json({ booking: updated, updatedAt: new Date().toISOString() }, { status: 200 });
    }

    if (action === "reschedule") {
      const nextDate = toDateString(body.nextDate);
      if (!nextDate) {
        return NextResponse.json({ error: "Valid nextDate is required." }, { status: 400 });
      }
      const updated = rescheduleBooking(params.id, booking.userId, nextDate);
      if (!updated) {
        return NextResponse.json({ error: "Unable to reschedule booking." }, { status: 400 });
      }

      return NextResponse.json({ booking: updated }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Unsupported action. Use 'cancel' or 'reschedule'." },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update booking.";
    if (message === "LATE_CANCEL_NOT_ALLOWED" || message === "LATE_RESCHEDULE_NOT_ALLOWED") {
      return NextResponse.json({ error: "Booking changes are locked within 24 hours." }, { status: 409 });
    }
    if (message === "INVALID_MOVE_DATE") {
      return NextResponse.json({ error: "Invalid move date." }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
