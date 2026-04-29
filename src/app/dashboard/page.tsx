import type { Metadata } from "next";
import { BookingDashboard } from "@/components/dashboard/BookingDashboard";

export const metadata: Metadata = {
  title: "Dashboard · Shifty",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#050a0e]">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <BookingDashboard />
      </main>
    </div>
  );
}

