import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign in · Shifty",
  description: "Use email/phone and password to sign in to Shifty.",
};

export default function Page() {
  return (
    <div className="min-h-screen bg-[#050a0e]">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-16 sm:px-8">
        <SignIn routing="path" path="/sign-in" />
      </main>
    </div>
  );
}
