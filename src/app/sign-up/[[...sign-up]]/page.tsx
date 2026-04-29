import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign up · Shifty",
  description: "Create a Shifty account to access move planning, pricing and tracking.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#050a0e]">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-16 sm:px-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Create account
          </p>
          <h1 className="text-4xl font-semibold text-white">
            Launch your Shifty signup in under a minute
          </h1>
          <p className="max-w-3xl text-white/50">
            Create your secure identity to save addresses, manage inventory, and run end-to-end
            bookings from one dashboard.
          </p>
        </header>
        <SignUp routing="path" path="/sign-up" />
      </main>
    </div>
  );
}
