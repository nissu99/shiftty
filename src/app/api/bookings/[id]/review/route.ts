import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import { createReview, getBooking } from "@/lib/shiftyStore";

function canAccess(session: { sub: string; role: string } | null, bookingUserId: string) {
  if (!session?.sub) return false;
  if (session.role === "admin") return true;
  return session.sub === bookingUserId;
}

export async function POST(
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

  if (!canAccess(session, booking.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status !== "COMPLETED") {
    return NextResponse.json({ error: "Reviews are allowed only after delivery." }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const rating =
    typeof body.rating === "number" ? Math.round(body.rating) : Number.parseInt(String(body.rating), 10);
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }

  try {
    const review = createReview({
      bookingId: params.id,
      userId: session.sub,
      rating,
      comment: comment.slice(0, 900),
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit review.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
