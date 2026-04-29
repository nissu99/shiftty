import { ShiftAssistant } from "@/components/chat/ShiftAssistant";

export default function ChatPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8 md:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Support Experience
        </p>
        <h1 className="text-3xl font-bold text-white">SHIFTY AI Assistant</h1>
        <p className="max-w-2xl text-sm text-white/60">
          Ask questions, track bookings, request support, and get quick next actions in one place.
        </p>
      </header>
      <ShiftAssistant compact={false} />
    </main>
  );
}
