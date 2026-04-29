"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, Settings, Zap } from "lucide-react";

type SessionUser = {
  id: string;
  fullName: string;
  role: string;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/plan", label: "Plan Booking" },
  { href: "/match", label: "Match Planner" },
  { href: "/predict", label: "Price Predictor" },
  { href: "/chat", label: "Chat" },
];

const secureItems = [
  { href: "/payments", label: "Payments" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

export function AppHeader() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const hasSession = Boolean(session || isSignedIn);

  const firstName = useMemo(() => {
    const name = session?.fullName?.trim() ?? "";
    return name ? name.split(" ")[0] : "Guest";
  }, [session?.fullName]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          if (!cancelled) setSession(null);
          return;
        }
        const payload = (await response.json()) as { user: SessionUser };
        if (!cancelled) setSession(payload.user);
      } catch {
        if (!cancelled) setSession(null);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (isSignedIn) {
      await clerk.signOut({ redirectUrl: "/" });
    }
    setSession(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050a0e]/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-violet-500 shadow-lg shadow-emerald-500/20 transition-shadow group-hover:shadow-emerald-500/40">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Shifty
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-wrap items-center gap-1">
          {[...navItems, ...(hasSession ? secureItems : [])].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          <div className="ml-3 h-5 w-px bg-white/10" />

          {!hasSession ? (
            <>
              <Link
                href="/sign-in"
                className="ml-3 rounded-lg px-3.5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="btn-shimmer ml-1 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
              >
                Sign up <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <div className="ml-3 flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-white/60 transition hover:text-white md:inline-flex"
              >
                <span className="flex items-center gap-2">
                  <Settings size={14} />
                  {firstName}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3.5 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
