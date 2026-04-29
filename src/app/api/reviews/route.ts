import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import {
  createReview,
  getBooking,
  getDbSnapshot,
  listReviewsByMover,
} from "@/lib/shiftyStore";

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown) {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const moverId = toText(params.get("moverId"));
  const bookingId = toText(params.get("bookingId"));

  if (!moverId && !bookingId) {
    return NextResponse.json(
      { error: "Provide moverId or bookingId query parameter." },
      { status: 400 },
    );
  }

  if (bookingId) {
    const booking = getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (!(session.role === "admin" || booking.userId === session.sub)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const reviews = getDbSnapshot().reviews.filter((review) => review.bookingId === bookingId);
    return NextResponse.json(
      { bookingId, reviews, averageRating: getAverageRating(reviews) },
      { status: 200 },
    );
  }

  const reviews = listReviewsByMover(moverId);
  return NextResponse.json(
    { moverId, reviews, averageRating: getAverageRating(reviews) },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const bookingId = toText(body.bookingId);
  const rating = num(body.rating);
  const comment = toText(body.comment);

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1 to 5." }, { status: 400 });
  }

  const booking = getBooking(bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!(session.role === "admin" || booking.userId === session.sub)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (booking.status !== "COMPLETED") {
    return NextResponse.json({ error: "Reviews are allowed only after delivery." }, { status: 409 });
  }

  try {
    const review = createReview({
      bookingId,
      userId: session.sub,
      rating,
      comment: comment.slice(0, 900),
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit review.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function getAverageRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) return 0;
  return Number(
    (
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    ).toFixed(2),
  );
}
