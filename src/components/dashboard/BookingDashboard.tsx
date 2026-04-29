"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Loader2,
  MessageSquare,
  Navigation,
  Star,
  Sparkles,
  Truck,
} from "lucide-react";
import { ShiftAssistant } from "@/components/chat/ShiftAssistant";

type AuthProfile = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

type BookingQuote = {
  finalPrice: number;
  discountPercent: number;
  discountReasons: string[];
  basePrice: number;
};

type BookingRecord = {
  id: string;
  source: string;
  destination: string;
  moveDate: string;
  status: string;
  paymentStatus: string;
  progressPercent: number;
  etaMinutes: number;
  createdAt: string;
  updatedAt: string;
  quote: BookingQuote;
  userId?: string;
};

type BookingListResponse = {
  bookings: BookingRecord[];
};

type TrackingResponse = {
  tracking: {
    bookingId: string;
    status: string;
    progressPercent: number;
    etaMinutes: number;
    location: { lat: number; lng: number };
    updatedAt: string;
    timeline: Array<{ event: string; at: string }>;
  };
  booking: BookingRecord;
};

type ReviewResponse = {
  reviews: Array<{ id: string; bookingId: string; rating: number; comment: string; createdAt: string }>;
};

function statusColorClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "completed")
    return "bg-emerald-500/20 text-emerald-200 border-emerald-500/35";
  if (normalized === "in_transit")
    return "bg-blue-500/20 text-blue-200 border-blue-500/35";
  if (normalized === "confirmed")
    return "bg-amber-500/20 text-amber-200 border-amber-500/35";
  if (normalized === "cancelled")
    return "bg-rose-500/20 text-rose-200 border-rose-500/35";
  return "bg-white/10 text-white/70 border-white/20";
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

function safeText(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const data = payload as { error?: unknown };
  return typeof data.error === "string" ? data.error : fallback;
}

async function readJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<unknown>;
}

function toDateInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toTimeInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(11, 16);
}

export function BookingDashboard() {
  const [session, setSession] = useState<AuthProfile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [trackingById, setTrackingById] = useState<Record<string, TrackingResponse["tracking"]>>({});
  const [loadingTracking, setLoadingTracking] = useState<Record<string, boolean>>({});

  const [pendingAction, setPendingAction] = useState<Record<string, string>>({});
  const [rescheduleInputs, setRescheduleInputs] = useState<Record<string, { date: string; time: string }>>({});

  const [reviewDraft, setReviewDraft] = useState<Record<string, { rating: string; comment: string }>>({});
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  const statusOptions = ["all", "pending", "confirmed", "in_transit", "completed", "cancelled"];

  const filteredBookings = useMemo(
    () =>
      bookings
        .filter((booking) => filter === "all" || booking.status.toLowerCase() === filter)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bookings, filter],
  );

  const loadSession = async () => {
    try {
      setSessionLoading(true);
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        return;
      }
      const payload = (await readJson(response)) as { user?: AuthProfile };
      if (payload.user) {
        setSession(payload.user);
      }
    } finally {
      setSessionLoading(false);
    }
  };

  const loadBookings = async () => {
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const response = await fetch("/api/bookings");
      if (!response.ok) {
        const payload = (await readJson(response)) as { error?: string };
        setBookingsError(safeText(payload, "Unable to load bookings."));
        return;
      }
      const payload = (await readJson(response)) as BookingListResponse;
      setBookings(payload.bookings ?? []);
    } catch {
      setBookingsError("Unable to load bookings from server.");
    } finally {
      setLoadingBookings(false);
    }
  };

  const setBusy = (bookingId: string, action: string | null) => {
    setPendingAction((previous) => {
      if (!action) {
        const next = { ...previous };
        delete next[bookingId];
        return next;
      }
      return { ...previous, [bookingId]: action };
    });
  };

  const setTrackingBusy = (bookingId: string, state: boolean) => {
    setLoadingTracking((previous) => ({ ...previous, [bookingId]: state }));
  };

  const refreshTracking = async (bookingId: string) => {
    setTrackingBusy(bookingId, true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/track`);
      if (!response.ok) {
        return;
      }
      const payload = (await readJson(response)) as TrackingResponse;
      if (payload.tracking && payload.booking) {
        setTrackingById((previous) => ({ ...previous, [bookingId]: payload.tracking }));
        setBookings((previous) =>
          previous.map((entry) =>
            entry.id === bookingId
              ? {
                  ...entry,
                  status: payload.booking.status,
                  progressPercent: payload.booking.progressPercent,
                  etaMinutes: payload.booking.etaMinutes,
                  updatedAt: payload.booking.updatedAt,
                }
              : entry,
          ),
        );
      }
    } finally {
      setTrackingBusy(bookingId, false);
    }
  };

  const toggleExpanded = async (booking: BookingRecord) => {
    if (expandedId === booking.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(booking.id);
    if (!rescheduleInputs[booking.id]) {
      setRescheduleInputs((previous) => ({
        ...previous,
        [booking.id]: {
          date: toDateInput(booking.moveDate),
          time: toTimeInput(booking.moveDate),
        },
      }));
    }

    if (!reviewed[booking.id] && booking.status === "COMPLETED") {
      try {
        const response = await fetch(`/api/reviews?bookingId=${encodeURIComponent(booking.id)}`);
        const payload = (await readJson(response)) as ReviewResponse;
        if (Array.isArray(payload.reviews) && payload.reviews.length > 0) {
          setReviewed((previous) => ({ ...previous, [booking.id]: true }));
        }
      } catch {
        // ignore
      }
    }
  };

  const handleCancel = async (bookingId: string) => {
    setBusy(bookingId, "cancel");
    setReviewMessage(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!response.ok) {
        const payload = (await readJson(response)) as { error?: string };
        setReviewMessage(safeText(payload, "Unable to cancel this booking."));
        return;
      }
      const payload = (await readJson(response)) as { booking: BookingRecord };
      setBookings((previous) =>
        previous.map((entry) => (entry.id === payload.booking.id ? { ...entry, ...payload.booking } : entry)),
      );
    } finally {
      setBusy(bookingId, null);
    }
  };

  const handleReschedule = async (bookingId: string, event: FormEvent) => {
    event.preventDefault();
    const draft = rescheduleInputs[bookingId];
    if (!draft || !draft.date || !draft.time) {
      setReviewMessage("Select both date and time for reschedule.");
      return;
    }
    const nextDate = new Date(`${draft.date}T${draft.time}`).toISOString();
    setBusy(bookingId, "reschedule");
    setReviewMessage(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", nextDate }),
      });
      if (!response.ok) {
        const payload = (await readJson(response)) as { error?: string };
        setReviewMessage(safeText(payload, "Unable to reschedule."));
        return;
      }
      const payload = (await readJson(response)) as { booking: BookingRecord };
      setBookings((previous) =>
        previous.map((entry) => (entry.id === payload.booking.id ? { ...entry, ...payload.booking } : entry)),
      );
      setReviewMessage("Booking rescheduled successfully.");
    } finally {
      setBusy(bookingId, null);
    }
  };

  const handleReview = async (bookingId: string, event: FormEvent) => {
    event.preventDefault();
    const draft = reviewDraft[bookingId] ?? { rating: "", comment: "" };
    const rating = Number(draft.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setReviewMessage("Give rating from 1 to 5.");
      return;
    }

    setBusy(bookingId, "review");
    setReviewMessage(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: draft.comment.trim() }),
      });
      if (!response.ok) {
        const payload = (await readJson(response)) as { error?: string };
        setReviewMessage(safeText(payload, "Unable to submit review."));
        return;
      }
      setReviewed((previous) => ({ ...previous, [bookingId]: true }));
      setReviewDraft((previous) => ({ ...previous, [bookingId]: { rating: "", comment: "" } }));
      setReviewMessage("Review submitted successfully.");
    } finally {
      setBusy(bookingId, null);
    }
  };

  useEffect(() => {
    void loadSession();
    void loadBookings();
  }, []);

  if (sessionLoading) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8">
        <p className="text-sm text-white/60">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Operations dashboard</p>
        <h1 className="text-4xl font-bold text-white">Manage your active bookings</h1>
        <p className="max-w-3xl text-sm text-white/50">
          Track live location, pay pending bookings, reschedule or cancel within guardrails, and submit reviews after delivery.
        </p>
        {session ? <p className="text-sm text-white/60">Signed in as {session.fullName} ({session.role}).</p> : null}
      </header>

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4">
          <p className="text-xs text-white/50">Filter status</p>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/[0.2] bg-[#070d13] px-3 py-2 text-sm text-white"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4">
          <p className="text-xs text-white/50">Total bookings</p>
          <p className="mt-2 text-xl font-bold text-white">{bookings.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4">
          <p className="text-xs text-white/50">Paid</p>
          <p className="mt-2 text-xl font-bold text-white">{bookings.filter((booking) => booking.paymentStatus === "PAID").length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4">
          <p className="text-xs text-white/50">In transit</p>
          <p className="mt-2 text-xl font-bold text-white">{bookings.filter((booking) => booking.status === "IN_TRANSIT").length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4">
          <p className="text-xs text-white/50">Active</p>
          <p className="mt-2 text-xl font-bold text-white">
            {bookings.filter((booking) => ["PENDING", "CONFIRMED", "IN_TRANSIT"].includes(booking.status)).length}
          </p>
        </div>
      </div>

      {bookingsError && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{bookingsError}</p>
      )}

      <div className="rounded-3xl border border-white/[0.12] bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white">Bookings</h2>
          <button
            type="button"
            onClick={() => void loadBookings()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/75"
          >
            <Sparkles size={14} />
            Refresh
          </button>
        </div>

        {loadingBookings ? (
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.02] p-4 text-sm text-white/40">
            <Loader2 size={14} className="animate-spin" />
            Loading your bookings…
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/20 p-6 text-white/40">
            No bookings found for the selected filter.
            <div className="mt-3">
              <Link href="/plan" className="inline-flex items-center gap-2 text-sm text-emerald-300 underline-offset-4 hover:underline">
                Create first booking
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const isTracking = Boolean(loadingTracking[booking.id]);
            const action = pendingAction[booking.id];
              const tracking = trackingById[booking.id];
              const draft = rescheduleInputs[booking.id] ?? {
                date: toDateInput(booking.moveDate),
                time: toTimeInput(booking.moveDate),
              };

              return (
                <article key={booking.id} className="rounded-2xl border border-white/[0.12] bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-white/40">{booking.id}</p>
                      <h3 className="text-lg font-semibold text-white">
                        {booking.source} → {booking.destination}
                      </h3>
                      <p className="text-sm text-white/60">
                        Move: {formatDate(booking.moveDate)} · {booking.status}
                      </p>
                      <p className="text-xs text-white/50">
                        ETA: {booking.etaMinutes} min · Progress: {booking.progressPercent}%
                      </p>
                      {booking.userId ? <p className="text-xs text-white/50">Customer: {booking.userId}</p> : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${statusColorClass(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                        payment {booking.paymentStatus}
                      </span>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                        {money(booking.quote.finalPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/payments?bookingId=${booking.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200"
                    >
                      <Truck size={14} />
                      Pay / Open receipt
                    </Link>

                    <button
                      type="button"
                      onClick={() => void refreshTracking(booking.id)}
                      disabled={isTracking}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 disabled:opacity-50"
                    >
                      <Navigation size={14} />
                      {isTracking ? "Tracking..." : "Refresh tracking"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void toggleExpanded(booking);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/80"
                    >
                      <MessageSquare size={14} />
                      {expandedId === booking.id ? "Hide details" : "Open details"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleCancel(booking.id)}
                      disabled={Boolean(action) && action !== "cancel"}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 disabled:opacity-50"
                    >
                      <CalendarClock size={14} />
                      {action === "cancel" ? <Loader2 size={14} className="animate-spin" /> : "Cancel"}
                    </button>
                  </div>

                  {expandedId === booking.id ? (
                    <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
                      <section className="grid gap-4 md:grid-cols-2">
                        <form
                          onSubmit={(event) => void handleReschedule(booking.id, event)}
                          className="space-y-2 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-3"
                        >
                          <p className="text-sm font-semibold text-white">Reschedule</p>
                          <label className="text-xs text-white/60">
                            Date
                            <input
                              type="date"
                              value={draft.date}
                              onChange={(event) =>
                                setRescheduleInputs((previous) => ({
                                  ...previous,
                                  [booking.id]: {
                                    ...draft,
                                    date: event.target.value,
                                  },
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-white/20 bg-[#060b11] px-3 py-2 text-white"
                            />
                          </label>
                          <label className="text-xs text-white/60">
                            Time
                            <input
                              type="time"
                              value={draft.time}
                              onChange={(event) =>
                                setRescheduleInputs((previous) => ({
                                  ...previous,
                                  [booking.id]: {
                                    ...draft,
                                    time: event.target.value,
                                  },
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-white/20 bg-[#060b11] px-3 py-2 text-white"
                            />
                          </label>
                          <button
                            type="submit"
                            disabled={Boolean(action) && action !== "reschedule"}
                            className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {action === "reschedule" ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
                            Reschedule
                          </button>
                        </form>

                        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-3 text-sm text-white/70">
                          <p className="font-semibold text-white">Pricing summary</p>
                          <p>Base: {money(booking.quote.basePrice)}</p>
                          <p>Final: {money(booking.quote.finalPrice)}</p>
                          <p>Discount: {booking.quote.discountPercent}%</p>
                          {booking.quote.discountReasons?.length ? (
                            <p className="text-xs text-white/40">{booking.quote.discountReasons.join(", ")}</p>
                          ) : null}
                        </div>
                      </section>

                      {tracking ? (
                        <section className="rounded-2xl border border-white/[0.1] bg-emerald-500/8 p-3 text-sm text-white">
                          <p className="mb-2 font-semibold">Live tracking</p>
                          <p>
                            {tracking.status} · {tracking.progressPercent}% · ETA {tracking.etaMinutes} min
                          </p>
                          <p className="text-xs text-white/50">Last updated: {formatDate(tracking.updatedAt)}</p>
                          <p className="text-xs text-white/60">
                            Location: {tracking.location.lat.toFixed(4)}, {tracking.location.lng.toFixed(4)}
                          </p>
                          <ul className="mt-2 list-disc pl-4 text-xs text-white/80">
                            {tracking.timeline.map((entry) => (
                              <li key={`${tracking.bookingId}-${entry.event}-${entry.at}`}>
                                {entry.event}: {formatDate(entry.at)}
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : (
                        <section className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-3 text-sm text-white/70">
                          <p>No tracking snapshot yet. Click refresh tracking.</p>
                        </section>
                      )}

                      <section className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-3">
                        <p className="text-sm font-semibold text-white">Post-delivery review</p>
                        {reviewed[booking.id] ? (
                          <p className="mt-2 text-xs text-emerald-200">Review submitted.</p>
                        ) : (
                          <form onSubmit={(event) => void handleReview(booking.id, event)} className="mt-2 space-y-2">
                            <label className="text-xs text-white/70">
                              Rating (1-5)
                              <input
                                type="number"
                                min={1}
                                max={5}
                                value={reviewDraft[booking.id]?.rating ?? ""}
                                onChange={(event) =>
                                  setReviewDraft((previous) => ({
                                    ...previous,
                                    [booking.id]: {
                                      ...(previous[booking.id] ?? { rating: "", comment: "" }),
                                      rating: event.target.value,
                                    },
                                  }))
                                }
                                className="mt-1 w-full rounded-lg border border-white/20 bg-[#060b11] px-3 py-2 text-white"
                              />
                            </label>
                            <label className="text-xs text-white/70">
                              Comment
                              <textarea
                                value={reviewDraft[booking.id]?.comment ?? ""}
                                onChange={(event) =>
                                  setReviewDraft((previous) => ({
                                    ...previous,
                                    [booking.id]: {
                                      ...(previous[booking.id] ?? { rating: "", comment: "" }),
                                      comment: event.target.value,
                                    },
                                  }))
                                }
                                rows={3}
                                className="mt-1 w-full rounded-lg border border-white/20 bg-[#060b11] px-3 py-2 text-white"
                              />
                            </label>
                            <button
                              type="submit"
                              disabled={Boolean(action) && action !== "review"}
                              className="inline-flex items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-100 disabled:opacity-50"
                            >
                              {action === "review" ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                              {booking.status === "COMPLETED" ? "Submit review" : "Review after completion"}
                            </button>
                          </form>
                        )}
                      </section>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        {reviewMessage ? (
          <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-200">
            {reviewMessage}
          </p>
        ) : null}
      </div>

      <ShiftAssistant
        compact
        defaultBookingId={expandedId ?? ""}
        title="AI Support panel"
        subtitle="Ask booking status, pricing, payment, reschedule, or cancel guidance."
      />
    </section>
  );
}
