"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";

type TimelineEntry = {
  event: string;
  at: string;
};

type ChatMessage = {
  actor: "user" | "assistant";
  text: string;
  intent?: string;
  timeline?: TimelineEntry[];
  quickReplies?: string[];
};

type ChatReply = {
  bookingId?: string;
  intent?: string;
  reply: string;
  timeline?: TimelineEntry[];
  quickReplies?: string[];
};

type ShiftAssistantProps = {
  defaultBookingId?: string;
  showBookingInput?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
};

const STORAGE_PREFIX = "shifty-assistant-thread";
const MAX_MESSAGES = 120;

const DEFAULT_GREETING: ChatMessage = {
  actor: "assistant",
  text: "Hi, I am SHIFTY Assistant. Share a booking ID for account actions or ask general help.",
  intent: "greeting",
  quickReplies: ["Track my booking", "How to book", "Payment help", "Talk to human agent"],
};

function toErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as { reply?: unknown; error?: unknown; message?: unknown };
  if (typeof record.reply === "string" && record.reply.trim()) return record.reply;
  if (typeof record.error === "string" && record.error.trim()) return record.error;
  if (typeof record.message === "string" && record.message.trim()) return record.message;
  return fallback;
}

async function readJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<unknown>;
}

function toTime(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

function normalizeThreadId(value: string | null | undefined) {
  const key = (value ?? "").trim();
  return key || "general";
}

function extractBookingId(value: string): string | null {
  const match = value.match(/\b[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\b/i);
  return match ? match[0] : null;
}

function makeStorageKey(threadId: string) {
  return `${STORAGE_PREFIX}:${threadId}`;
}

function sanitizeMessages(payload: unknown): ChatMessage[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const item = entry as { actor?: unknown; text?: unknown };
      return item.actor === "user" || item.actor === "assistant";
    })
    .map((entry) => {
      const item = entry as {
        actor: "user" | "assistant";
        text?: unknown;
        intent?: unknown;
        timeline?: unknown;
        quickReplies?: unknown;
      };
      const timeline = Array.isArray(item.timeline)
        ? item.timeline.filter(
            (timelineItem) =>
              timelineItem &&
              typeof timelineItem === "object" &&
              typeof (timelineItem as { event?: unknown; at?: unknown }).event === "string" &&
              typeof (timelineItem as { event?: unknown; at?: unknown }).at === "string",
          )
        : [];
      const quickReplies = Array.isArray(item.quickReplies)
        ? item.quickReplies.filter((reply) => typeof reply === "string")
        : [];
      return {
        actor: item.actor,
        text: typeof item.text === "string" ? item.text : "",
        intent: typeof item.intent === "string" ? item.intent : undefined,
        timeline:
          timeline.length > 0
            ? (timeline as { event: string; at: string }[])
            : undefined,
        quickReplies: quickReplies.length > 0 ? (quickReplies as string[]) : undefined,
      } as ChatMessage;
    })
    .filter((entry) => entry.text.trim().length > 0);
}

function restoreThread(threadId: string): ChatMessage[] {
  if (typeof window === "undefined") return [DEFAULT_GREETING];
  try {
    const raw = window.localStorage.getItem(makeStorageKey(threadId));
    if (!raw) return [DEFAULT_GREETING];
    const payload = JSON.parse(raw) as { messages?: unknown };
    const messages = sanitizeMessages(payload.messages ?? []);
    if (messages.length === 0) return [DEFAULT_GREETING];
    if (messages[0]?.actor !== "assistant") {
      return [DEFAULT_GREETING, ...messages];
    }
    return messages;
  } catch {
    return [DEFAULT_GREETING];
  }
}

function trimMessages(messages: ChatMessage[]) {
  if (messages.length <= MAX_MESSAGES) return messages;
  return messages.slice(messages.length - MAX_MESSAGES);
}

function persistThread(threadId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      makeStorageKey(threadId),
      JSON.stringify({
        bookingId: threadId,
        updatedAt: new Date().toISOString(),
        messages,
      }),
    );
  } catch {
    // best-effort persistence
  }
}

function clearThread(threadId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(makeStorageKey(threadId));
  } catch {
    // best-effort clear
  }
}

export function ShiftAssistant({
  defaultBookingId = "",
  showBookingInput = true,
  title = "AI Support panel",
  subtitle = "Ask for status, pricing, payment, reschedule, or cancellation guidance.",
  className = "",
  compact = false,
}: ShiftAssistantProps) {
  const [bookingId, setBookingId] = useState(defaultBookingId);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_GREETING]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingQuickReply, setPendingQuickReply] = useState<string | null>(null);
  const skipThreadSwap = useRef(false);

  const currentThreadId = normalizeThreadId(bookingId);
  const maxHeightClass = useMemo(() => (compact ? "max-h-72" : "max-h-[380px]"), [compact]);

  useEffect(() => {
    if (defaultBookingId) {
      setBookingId(defaultBookingId);
    }
  }, [defaultBookingId]);

  useEffect(() => {
    if (skipThreadSwap.current) {
      skipThreadSwap.current = false;
      return;
    }
    const restored = restoreThread(currentThreadId);
    const limited = trimMessages(restored);
    setMessages(limited);
  }, [currentThreadId]);

  useEffect(() => {
    persistThread(currentThreadId, messages);
  }, [messages, currentThreadId]);

  const postMessage = async (text: string, fromQuickReply = false) => {
    const message = text.trim();
    if (!message) return;
    const nextUserMessage: ChatMessage = { actor: "user", text: message };

    setMessages((previous) => trimMessages([...previous, nextUserMessage]));
    setMessageInput("");
    setLoading(true);
    setError(null);
    setPendingQuickReply(fromQuickReply ? message : null);

      const fromTextBookingId = extractBookingId(message);
      if (fromTextBookingId) {
        setBookingId((current) => fromTextBookingId || current);
      }

      try {
      const nextBookingId = fromTextBookingId || bookingId.trim() || undefined;
      const payload = {
        message,
        ...(nextBookingId ? { bookingId: nextBookingId } : {}),
      };
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = (await readJson(response)) as ChatReply & { error?: string };
      if (!response.ok) {
        const errorMessage = toErrorMessage(raw, "Chat service unavailable.");
        setError(errorMessage);
        setMessages((previous) =>
          trimMessages([
            ...previous,
            {
              actor: "assistant",
              text: errorMessage,
              intent: "error",
            },
          ]),
        );
        return;
      }
      setMessages((previous) =>
        trimMessages([
          ...previous,
          {
            actor: "assistant",
            text: raw.reply,
            intent: raw.intent,
            timeline: raw.timeline,
              quickReplies: raw.quickReplies,
            },
        ]),
      );
      if (raw.bookingId) {
        skipThreadSwap.current = true;
        setBookingId(raw.bookingId);
      }
    } catch {
      setError("Unable to send your message right now.");
      setMessages((previous) =>
        trimMessages([
          ...previous,
          {
            actor: "assistant",
            text: "Unable to send your message right now.",
            intent: "error",
          },
        ]),
      );
    } finally {
      setLoading(false);
      setPendingQuickReply(null);
    }
  };

  const submitChat = async (event: FormEvent) => {
    event.preventDefault();
    await postMessage(messageInput);
  };

  const clearHistory = () => {
    clearThread(currentThreadId);
    setMessages([DEFAULT_GREETING]);
    setError(null);
  };

  return (
    <section className={`rounded-3xl border border-white/[0.12] bg-white/[0.03] p-6 ${className}`}>
      <div className="space-y-1">
        <p className="text-sm text-white/70">{title}</p>
        <p className="text-xs text-white/50">{subtitle}</p>
      </div>

      <div className={`mt-3 space-y-2 overflow-y-auto rounded-2xl border border-white/[0.07] bg-[#070b10] p-3 ${maxHeightClass}`}>
        {messages.map((entry, index) => (
          <article
            key={`${entry.actor}-${index}`}
            className={`rounded-xl border p-2 text-xs ${
              entry.actor === "user"
                ? "border-white/[0.2] bg-white/[0.06] text-white/80"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            }`}
          >
            <p className="mb-1 font-semibold">
              {entry.actor === "user" ? "You" : "SHIFTY Assistant"}
              {entry.intent ? ` (${entry.intent})` : null}
            </p>
            <p className="whitespace-pre-wrap">{entry.text}</p>
            {entry.timeline && entry.timeline.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-emerald-200/90">
                {entry.timeline.map((item) => (
                  <li key={`${item.event}-${item.at}`}>
                    {item.event} · {toTime(item.at)}
                  </li>
                ))}
              </ul>
            ) : null}
            {entry.quickReplies && entry.quickReplies.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.quickReplies.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => {
                      if (loading) return;
                      void postMessage(item, true);
                    }}
                    disabled={loading}
                    className="rounded-full border border-white/20 px-2 py-1 text-[11px] text-white/80 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <form onSubmit={(event) => void submitChat(event)} className="mt-3 space-y-2">
        {showBookingInput ? (
          <label className="text-xs text-white/70">
            Booking ID (optional)
            <input
              type="text"
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/20 bg-[#060b11] px-3 py-2 text-white"
              placeholder="Booking ID"
              aria-label="Booking ID"
            />
          </label>
        ) : null}
        <label className="text-xs text-white/70">
          Message
          <textarea
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/20 bg-[#060b11] px-3 py-2 text-white"
            placeholder="Track status, pricing, payment, reschedule guidance..."
            aria-label="Chat message"
          />
        </label>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-white/40">
            {pendingQuickReply ? `Sending: ${pendingQuickReply}` : "Press send or click a quick reply"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearHistory}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-xs text-white/75"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading || !messageInput.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send
            </button>
          </div>
        </div>
      </form>

      {error ? <p className="mt-3 text-xs text-rose-200"> {error}</p> : null}
      {compact ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-white/45">
          <MessageSquare size={13} />
          Tip: include booking ID for account-specific actions.
        </p>
      ) : null}
    </section>
  );
}
