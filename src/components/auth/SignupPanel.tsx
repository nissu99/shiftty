'use client';

import { SignUp } from "@clerk/nextjs";
import { AlertTriangle } from "lucide-react";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function SignupPanel() {
  if (!clerkPublishableKey) {
    return (
      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle size={16} />
          Clerk env missing
        </div>
        <p className="mt-2">
          Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> to your
          <code>.env.local</code> to turn on hosted signup. See the README auth section for setup steps.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-lg">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-emerald-600 text-white hover:bg-emerald-700",
            footerActionLink: "text-emerald-700 hover:text-emerald-900",
            card: "shadow-none",
          },
        }}
        signInUrl="/sign-in"
        afterSignUpUrl="/plan"
        redirectUrl="/plan"
      />
    </div>
  );
}
