import type { Metadata } from "next";
import { SignupPanel } from "@/components/auth/SignupPanel";

export const metadata: Metadata = {
  title: "Sign up · Shifty",
  description: "Create a Shifty account via Clerk to access the AI planner and payment desk.",
};

export default function SignupPage() {
  return (
    <div className="bg-slate-50">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-16 sm:px-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Create account</p>
          <h1 className="text-4xl font-semibold text-slate-900">
            Launch your Shifty signup in under a minute
          </h1>
          <p className="max-w-3xl text-slate-600">
            Clerk handles OTP, passwordless and SSO for you. Once connected, students can verify their
            GEU IDs, reserve movers, and manage billing securely.
          </p>
        </header>
        <SignupPanel />
      </main>
    </div>
  );
}
