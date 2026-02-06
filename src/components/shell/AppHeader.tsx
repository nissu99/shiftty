import Link from "next/link";
import { Zap } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/plan", label: "AI Planner" },
  { href: "/predict", label: "Price Predictor" },
  { href: "/payments", label: "Payments" },
];

export function AppHeader() {
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
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          <div className="ml-3 h-5 w-px bg-white/10" />

          <SignedOut>
            <Link
              href="/sign-in"
              className="ml-3 rounded-lg px-3.5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="btn-shimmer ml-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
            >
              Sign up
            </Link>
          </SignedOut>
          <SignedIn>
            <div className="ml-3">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 ring-2 ring-emerald-500/30",
                  },
                }}
              />
            </div>
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
