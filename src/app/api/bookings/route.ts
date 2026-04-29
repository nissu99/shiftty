import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import { createBooking, listAllBookings, listBookingsForUser } from "@/lib/shiftyStore";
import { buildQuote, parseBookingDraft, parsePackageType } from "@/lib/bookingUtils";

function sanitizeStatus(value: unknown): string | null {
  const status = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (!status) return null;
  return status;
}

export async function GET(request: Request) {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("status");
  const requestedStatus = sanitizeStatus(query);

  const bookings = (session.role === "admin"
    ? listAllBookings()
    : listBookingsForUser(session.sub)
  ).filter((booking) =>
    !requestedStatus || booking.status.toLowerCase() === requestedStatus,
  );

  const payload =
    session.role === "admin"
      ? bookings
      : bookings.map((booking) => ({
          id: booking.id,
          source: booking.source,
          destination: booking.destination,
          moveDate: booking.moveDate,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          progressPercent: booking.progressPercent,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
          etaMinutes: booking.etaMinutes,
          quote: booking.quote,
        }));

  return NextResponse.json({ bookings: payload }, { status: 200 });
}

export async function POST(request: Request) {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const draft = parseBookingDraft(body, { requireInventory: true });
    const userRequestedPackage = parsePackageType((body as { packageType?: unknown }).packageType);
    const quote = buildQuote(draft, userRequestedPackage);
    const booking = createBooking({
      userId: session.sub,
      source: draft.source,
      destination: draft.destination,
      sourceFloor: draft.sourceFloor,
      destinationFloor: draft.destinationFloor,
      buildingType: draft.buildingType,
      elevatorAvailable: draft.elevatorAvailable,
      moveDate: draft.moveDate,
      sourceCoords: draft.sourceCoords,
      destinationCoords: draft.destinationCoords,
      inventory: draft.inventory,
      packageType: userRequestedPackage ?? quote.packageType,
    });

    return NextResponse.json(
      {
        id: booking.id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        quote: booking.quote,
        source: booking.source,
        destination: booking.destination,
        moveDate: booking.moveDate,
        progressPercent: booking.progressPercent,
        createdAt: booking.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create booking.";
    const status = message.includes("Booking window") || message.includes("USER_NOT_FOUND") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
