import type { Metadata } from "next";
import { ProfilePanel } from "@/components/profile/ProfilePanel";

export const metadata: Metadata = {
  title: "Profile · Shifty",
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#050a0e]">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Account center
          </p>
          <h1 className="text-4xl font-bold text-white">
            Manage profile and saved addresses
          </h1>
          <p className="max-w-3xl text-sm text-white/45">
            Update name and phone details, store frequently used pickup/drop addresses,
            and jump to booking history for completed and active moves.
          </p>
        </header>
        <ProfilePanel />
      </main>
    </div>
  );
}
