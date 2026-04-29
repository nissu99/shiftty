import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/shiftySession";
import { getBooking, getTracking, listBookingsForUser } from "@/lib/shiftyStore";

type TimelineEntry = {
  event: string;
  at: string;
};

type ChatReply = {
  bookingId?: string;
  intent?: string;
  reply: string;
  timeline?: TimelineEntry[];
  quickReplies?: string[];
};

type ChatErrorReply = {
  error: string;
  code?: string;
};

type ChatIntent =
  | "tracking"
  | "reschedule"
  | "cancel"
  | "payment"
  | "quote"
  | "assignment"
  | "support"
  | "faq"
  | "bookingFlow"
  | "greeting"
  | "general"
  | "mixed"
  | "pricing"
  | "escalation"
  | "unknown";

type MemoryRecord = {
  bookingId?: string;
  lastIntent?: ChatIntent;
  updatedAt: number;
};

const CHAT_MEMORY_TTL_MS = 1000 * 60 * 60 * 24;
const chatMemory = new Map<string, MemoryRecord>();

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMessage(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasIntent(content: string, tokens: string[]) {
  return tokens.some((token) => content.includes(token));
}

function extractBookingEntities(content: string): string[] {
  const ids = new Set<string>();

  const uuid = content.match(/\b[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\b/gi);
  if (uuid?.[0]) ids.add(uuid[0]);

  const labeled = content.match(
    /(?:booking|order|reference|ref|payment)\s*(?:id|number|no\.?|code)?\s*[:#]?\s*([a-z0-9][a-z0-9-]{5,})/gi,
  );
  if (labeled) {
    for (const value of labeled) {
      const extracted = value.match(/([a-z0-9][a-z0-9-]{5,})/i)?.[0];
      if (extracted) ids.add(extracted.trim());
    }
  }

  const prefixedCodes = content.match(/\b(?:ord(?:er)?|bk|shifty)-?[a-z]?\d{2,}(?:-[a-z]?\d{2,})*\b/gi);
  if (prefixedCodes) {
    for (const value of prefixedCodes) {
      if (value.length >= 6) ids.add(value.toLowerCase());
    }
  }

  const plainCode = content.match(/\b[a-z]{0,3}-?\d{6,}\b/gi);
  if (plainCode) {
    for (const value of plainCode) ids.add(value);
  }

  return Array.from(ids);
}

function extractBookingId(content: string): string | null {
  const ids = extractBookingEntities(content);
  return ids[0] ?? null;
}

function hasEnoughNotice(moveDateIso: string, minimumHours: number): { allowed: boolean; hoursLeft: number } {
  const moveTs = new Date(moveDateIso).getTime();
  if (!Number.isFinite(moveTs)) {
    return { allowed: false, hoursLeft: Number.POSITIVE_INFINITY };
  }
  const hoursLeft = Math.max(0, Math.ceil((moveTs - Date.now()) / (1000 * 60 * 60)));
  return {
    allowed: hoursLeft >= minimumHours,
    hoursLeft,
  };
}

function bookingQuickReplies(bookingId: string): string[] {
  return [
    "Track this booking",
    "Show payment status",
    "Can I reschedule?",
    "Can I cancel?",
    "Talk to human agent",
    `Open payment for ${bookingId}`,
  ];
}

function reply(payload: ChatReply, status = 200) {
  return NextResponse.json(payload, { status });
}

function errorReply(message: string, status: number, code?: string) {
  const payload: ChatReply & ChatErrorReply = {
    reply: message,
    error: message,
    ...(code ? { code } : {}),
  };
  return NextResponse.json(payload, { status });
}

function clearExpiredMemory() {
  const now = Date.now();
  for (const [userId, record] of chatMemory.entries()) {
    if (now - record.updatedAt > CHAT_MEMORY_TTL_MS) {
      chatMemory.delete(userId);
    }
  }
}

function trackMemory(userId: string): MemoryRecord | null {
  clearExpiredMemory();
  const state = chatMemory.get(userId) ?? null;
  return state && Date.now() - state.updatedAt <= CHAT_MEMORY_TTL_MS ? state : null;
}

function remember(userId: string, bookingId?: string, lastIntent?: ChatIntent) {
  const next: MemoryRecord = {
    bookingId,
    lastIntent,
    updatedAt: Date.now(),
  };
  chatMemory.set(userId, next);
}

function detectIntent(content: string): ChatIntent {
  const greeting = hasIntent(content, [
    "hi",
    "hello",
    "hey",
    "hii",
    "good morning",
    "good evening",
    "good afternoon",
  ]);

  if (greeting) return "greeting";

  const track = hasIntent(content, [
    "track",
    "tracking",
    "status",
    "where is",
    "where is my",
    "where is my booking",
    "where is my stuff",
    "delivery",
    "eta",
    "live",
    "location",
    "progress",
  ]);

  const quote = hasIntent(content, [
    "quote",
    "pricing",
    "price",
    "cost",
    "estimate",
    "how much",
    "discount",
    "offer",
    "bill",
    "fare",
  ]);

  const reschedule = hasIntent(content, [
    "reschedule",
    "change date",
    "move date",
    "postpone",
    "another date",
    "change to",
    "change time",
  ]);

  const cancel = hasIntent(content, [
    "cancel",
    "cancelled",
    "cancellation",
    "canceling",
    "terminate",
  ]);

  const payment = hasIntent(content, [
    "payment",
    "pay",
    "paid",
    "invoice",
    "receipt",
    "refund",
    "wallet",
  ]);

  const assignment = hasIntent(content, [
    "mover",
    "driver",
    "team",
    "vehicle",
    "truck",
    "vehicle id",
    "assigned",
  ]);

  const support = hasIntent(content, [
    "agent",
    "human",
    "support",
    "escalate",
    "complaint",
    "damage",
    "dispute",
    "issue",
    "not working",
  ]);

  const bookingFlow = hasIntent(content, [
    "booking",
    "book now",
    "plan booking",
    "new move",
    "reserve",
    "how to book",
    "reserve a booking",
  ]);

  const faq = hasIntent(content, [
    "policy",
    "rule",
    "app",
    "how does",
    "what is",
    "can i do",
    "how to",
    "help with",
  ]);

  if (quote && track) return "mixed";
  if (reschedule && (quote || payment || assignment)) return "mixed";
  if (support) return "support";
  if (cancel) return "cancel";
  if (reschedule) return "reschedule";
  if (payment) return "payment";
  if (quote) return "quote";
  if (assignment) return "assignment";
  if (bookingFlow) return "bookingFlow";
  if (track) return "tracking";
  if (faq) return "faq";

  return "general";
}

function buildBookingReply(booking: NonNullable<ReturnType<typeof getBooking>>, intent: ChatIntent): ChatReply {
  const finalPrice = booking.quote.finalPrice.toLocaleString("en-IN");
  const basePrice = booking.quote.basePrice.toLocaleString("en-IN");

  if (intent === "tracking") {
    const tracking = getTracking(booking.id, booking.userId);
    if (!tracking) {
      return {
        bookingId: booking.id,
        intent: "tracking",
        quickReplies: ["Need payment help?", "When can tracking start?"],
        reply:
          "Live tracking is not active yet. It becomes available once the booking is paid and moved to confirmation.",
      };
    }
    return {
      bookingId: booking.id,
      intent: "tracking",
      quickReplies: ["Show payment status", "Can I reschedule?", "Talk to human agent"],
      timeline: tracking.tracking.timeline,
      reply: `Booking ${booking.id} is ${tracking.tracking.status}. Progress ${tracking.tracking.progressPercent}% and ETA ${tracking.tracking.etaMinutes} minutes.`,
    };
  }

  if (intent === "reschedule") {
    const { allowed, hoursLeft } = hasEnoughNotice(booking.moveDate, 24);
    return {
      bookingId: booking.id,
      intent: "reschedule",
      quickReplies: ["Check payment status", "Can I cancel?", "Talk to human agent"],
      reply: allowed
        ? "Rescheduling is allowed from Dashboard → Booking details. Pick a slot at least 24 hours before move time."
        : `Reschedule not allowed yet. You need 24+ hours notice. Remaining approx ${hoursLeft} hour(s).`,
    };
  }

  if (intent === "cancel") {
    const { allowed, hoursLeft } = hasEnoughNotice(booking.moveDate, 24);
    return {
      bookingId: booking.id,
      intent: "cancel",
      quickReplies: ["Reschedule instead", "Need refund", "Talk to human agent"],
      reply: allowed
        ? "Cancellation is allowed. Open Dashboard → booking details → Cancel and confirm."
        : `Cancellation not allowed now. You need at least 24 hours notice. Remaining approx ${hoursLeft} hour(s).`,
    };
  }

  if (intent === "payment") {
    const canPayNow = booking.paymentStatus === "UNPAID";
    return {
      bookingId: booking.id,
      intent: "payment",
      quickReplies: ["Open payment", "Track this booking", "Need support"],
      reply: `Payment status is ${booking.paymentStatus}. Amount: ₹${finalPrice} (base ₹${basePrice}, discount ${booking.quote.discountPercent}%). ${
        canPayNow ? "You can pay now from the Payments page." : "No action needed."
      }`,
    };
  }

  if (intent === "quote") {
    return {
      bookingId: booking.id,
      intent: "quote",
      quickReplies: ["Show payment status", "Need invoice", "Reschedule"],
      reply: `This booking quote is ₹${finalPrice}, base ₹${basePrice}, discount ${booking.quote.discountPercent}%. Reason: ${
        booking.quote.discountReasons.join(", ") || "system offer"
      }.`,
    };
  }

  if (intent === "assignment") {
    return {
      bookingId: booking.id,
      intent: "assignment",
      quickReplies: ["Track this booking", "When can they reach?", "Talk to agent"],
      reply: `Assigned mover id is ${booking.moverId}. You can monitor their arrival progress in dashboard tracking.`,
    };
  }

  if (intent === "support") {
    const ticket = escalateToken();
    return {
      bookingId: booking.id,
      intent: "escalation",
      quickReplies: ["Track this booking", "Share feedback", "Check payment status"],
      reply: `Escalated to support. Ticket ${ticket} created. A human will respond within 30 minutes.`,
    };
  }

  return {
    bookingId: booking.id,
    intent: "general",
    quickReplies: bookingQuickReplies(booking.id),
    reply:
      "I can guide with tracking, payment status, pricing, reschedule/cancel guidance, and move assignment details. Use Dashboard actions for execution.",
  };
}

function escalateToken() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SHIFTY-HS-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

function userCanAccessBooking(
  userId: string,
  role: string,
  booking: NonNullable<ReturnType<typeof getBooking>> | null,
) {
  return !!booking && (role === "admin" || booking.userId === userId);
}

export async function POST(request: Request) {
  const session = await getAuthFromCookies();
  if (!session?.sub) {
    return errorReply("Unauthorized. Sign in to use chat support.", 401, "UNAUTHORIZED");
  }

  const body = await request.json().catch(() => ({}));
  const message = normalizeMessage(toText(body.message));
  const bookingIdFromBody = toText(body.bookingId);
  const bookingIdFromText = extractBookingId(message);
  const providedBookingId = bookingIdFromBody || bookingIdFromText || "";

  if (!message) {
    return errorReply("Message is required.", 400, "VALIDATION_ERROR");
  }

  const userBookings = listBookingsForUser(session.sub);
  const memoryState = trackMemory(session.sub);
  const intent = detectIntent(message);
  const canUseContextBooking =
    intent !== "bookingFlow" &&
    intent !== "general" &&
    intent !== "greeting" &&
    intent !== "faq" &&
    intent !== "unknown";

  const explicitBooking = providedBookingId ? getBooking(providedBookingId) : null;
  if (providedBookingId && !explicitBooking) {
    return errorReply("Booking not found.", 404, "BOOKING_NOT_FOUND");
  }

  if (explicitBooking && !userCanAccessBooking(session.sub, session.role ?? "", explicitBooking)) {
    return errorReply("You don't have access to this booking.", 403, "FORBIDDEN");
  }

  const currentBookingId =
    providedBookingId || (canUseContextBooking ? memoryState?.bookingId : "") || "";
  const currentBooking = currentBookingId ? getBooking(currentBookingId) : null;

  if (currentBooking && !userCanAccessBooking(session.sub, session.role ?? "", currentBooking)) {
    return errorReply("You don't have access to this booking.", 403, "FORBIDDEN");
  }

  if (explicitBooking) {
    remember(session.sub, explicitBooking.id, intent);
    return reply(buildBookingReply(explicitBooking, intent));
  }

  if (intent === "mixed") {
    if (currentBooking) {
      return reply({
        bookingId: currentBooking.id,
        intent: "general",
        quickReplies: ["Track this booking", "Pricing help", "Need support"],
        reply:
          "I can see two possible actions in one message. Are you asking for status/tracking or pricing details for this booking?",
      });
    }

    if (userBookings.length === 1) {
      remember(session.sub, userBookings[0].id, "mixed");
      return reply({
        intent: "general",
        quickReplies: ["Track this booking", "Show payment status", "Need support"],
        reply:
          "Please choose one: tracking/ETA/status or pricing details for your latest booking.",
      });
    }

    const rows = userBookings
      .slice(0, 3)
      .map((item) => `• ${item.id} (${item.status}, ${item.paymentStatus})`)
      .join("\n");
    return reply({
      intent: "general",
      quickReplies: userBookings.slice(0, 3).map((bookingItem) => `Booking ${bookingItem.id}`),
      reply: `I found multiple bookings. Pick one booking ID first, then tell me if you want Tracking or Quote.\n${rows}`,
    });
  }

  const bookingNeeded = currentBooking ? false : !providedBookingId && canUseContextBooking;

  if (bookingNeeded) {
    if (userBookings.length === 0) {
      return reply({
        intent: "general",
        quickReplies: ["Plan a booking", "Open plan page", "Open dashboard", "Price predictor"],
        reply:
          "I couldn't find any booking in your account yet. Start from Plan Booking, then return here for status, payment, tracking, or support actions.",
      });
    }

    if (userBookings.length === 1) {
      const autoBooking = userBookings[0];
      remember(session.sub, autoBooking.id, intent);
      return reply(buildBookingReply(autoBooking, intent));
    }

    const rows = userBookings
      .slice(0, 3)
      .map((item) => `• ${item.id} (${item.status}, ${item.paymentStatus})`)
      .join("\n");
    return reply({
      intent: "general",
      quickReplies: userBookings.slice(0, 3).map((bookingItem) => `Booking ${bookingItem.id}`),
      reply: `I found multiple bookings. Pick one booking ID first.\n${rows}`,
    });
  }

  if (currentBooking) {
    remember(session.sub, currentBooking.id, intent);
    return reply(buildBookingReply(currentBooking, intent));
  }

  if (intent === "support") {
    const ticket = escalateToken();
    return reply({
      intent: "escalation",
      quickReplies: ["Track booking", "Payment help", "Need pricing", "Plan new booking"],
      reply: `Support request queued. Ticket ${ticket} created. Add a booking ID to map this case to a booking thread.`,
    });
  }

  if (intent === "bookingFlow") {
    return reply({
      intent: "general",
      quickReplies: ["Open plan page", "Open dashboard", "Price predictor"],
      reply:
        "To create a booking: open Plan Booking, add source/destination, choose inventory/time, and confirm. Use Price Predictor for a rough estimate first.",
    });
  }

  if (intent === "faq") {
    return reply({
      intent: "general",
      quickReplies: ["How much discount can I get?", "How do I cancel?", "How to track?", "Talk to human agent"],
      reply:
        "Common questions: weekday and early-bird discounts, price components, reschedule/cancel rules, and live mover tracking. Ask one of these directly and I’ll guide you.",
    });
  }

  if (intent === "greeting") {
    return reply({
      intent: "greeting",
      quickReplies: ["Track a booking", "Check payment", "Pricing help", "Talk to human agent"],
      reply:
        "Hi, I'm SHIFTY Assistant. I can help with booking support, pricing, and moving flow. Share a booking ID for account-specific actions.",
    });
  }

  return reply({
    intent: "general",
    quickReplies: ["Track a booking", "Check payment", "Pricing help", "Talk to human agent"],
    reply:
      "Hi, I'm SHIFTY Assistant. I can help with booking support, pricing, and moving flow. Share a booking ID for account-specific actions.",
  });
}
