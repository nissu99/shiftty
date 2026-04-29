"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

type AuthResponse = {
  error?: string;
  fullName?: string;
};

function isValidIdentifier(value: string): boolean {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value) || /^[6-9]\\d{9}$/.test(value);
}

export function LoginPanel() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!isValidIdentifier(emailOrPhone) || password.length < 6) {
      setError("Use a valid campus email or 10-digit phone and a password.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailOrPhone.includes("@") ? emailOrPhone : undefined,
          phone: emailOrPhone.includes("@") ? undefined : emailOrPhone,
          password,
        }),
      });

      const payload = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(payload.error ?? "Could not sign in right now.");
        return;
      }

      setMessage(`Welcome back, ${payload.fullName ?? "there"}. Redirecting...`);
      router.refresh();
      router.push("/dashboard");
    } catch {
      setError("Network error while signing in.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    setMessage(null);

    if (!emailOrPhone.trim()) {
      setError("Enter your email or phone to continue with OAuth.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          token: `demo-${provider}-${Date.now()}`,
          providerId: `${provider}-${emailOrPhone.trim()}`,
          ...(emailOrPhone.includes("@")
            ? { email: emailOrPhone.toLowerCase() }
            : { phone: emailOrPhone }),
        }),
      });

      const payload = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(payload.error ?? `Unable to authenticate with ${provider}.`);
        return;
      }

      setMessage(`Signed in using ${provider}. Redirecting...`);
      router.refresh();
      router.push("/dashboard");
    } catch {
      setError("Network error while completing OAuth flow.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 shadow-2xl md:grid-cols-[360px,1fr]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="text-sm font-medium text-white/80">
          Email or phone
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/[0.16] bg-white/[0.02] px-4">
            <Mail size={16} className="text-white/50" />
            <input
              type="text"
              autoComplete="username"
              placeholder="you@graphic-era.edu or 9876..."
              value={emailOrPhone}
              onChange={(event) => setEmailOrPhone(event.target.value)}
              className="h-12 flex-1 bg-transparent text-base text-white focus:outline-none"
              required
            />
          </div>
        </label>

        <label className="text-sm font-medium text-white/80">
          Password
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/[0.16] bg-white/[0.02] px-4">
            <Lock size={16} className="text-white/50" />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="8+ characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 flex-1 bg-transparent text-base text-white focus:outline-none"
              required
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
          {loading ? "Signing in" : "Sign in"}
        </button>

        <div className="space-y-2">
          <p className="text-xs text-white/60">Or continue with OAuth</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              type="button"
              onClick={() => void handleOAuth("google")}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl border border-white/[0.2] px-3 py-2 text-white/90 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => void handleOAuth("apple")}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl border border-white/[0.2] px-3 py-2 text-white/90 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apple
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-between text-sm text-white/60">
          <Link
            href="/plan"
            className="underline-offset-4 hover:text-white hover:underline"
          >
            Booking help and FAQs
          </Link>
          <Link
            href="/sign-up"
            className="underline-offset-4 text-emerald-300 hover:text-emerald-200 hover:underline"
          >
            Create an account
          </Link>
        </div>

        {error && (
          <p className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertCircle size={16} />
            {error}
          </p>
        )}
        {message && (
          <p className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 size={16} />
            {message}
          </p>
        )}
      </form>

      <div className="rounded-2xl bg-white/[0.03] p-6 text-white/80">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Security stack</p>
        <h3 className="mt-2 text-2xl font-semibold">Session-aware JWT</h3>
        <p className="mt-3 text-sm text-white/60">
          Shifty uses HttpOnly JWT cookies, server-side auth checks and encrypted tokens
          to protect booking operations.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Server-validated user sessions for each booking action</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Protected APIs for profiles, quotes, payments and live tracking</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Role-aware controls for admin and mover operations</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
