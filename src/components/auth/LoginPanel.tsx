'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

const securityHighlights = [
  "SSO-ready SAML + OAuth claims",
  "Device handoff alerts over WhatsApp",
  "Geo-fenced sessions for campus labs",
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function LoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError("Enter your campus email and password to continue.");
      return;
    }

    try {
      setLoading(true);
      await wait(900);
      setMessage(
        `Welcome back! OTP fallback and session pinning kick in once we connect the real IdP. ${
          remember ? "We'll keep this device trusted for 30 days." : ""
        }`.trim(),
      );
    } catch (err) {
      console.error("login simulation failed", err);
      setError("Login failed — check your credentials or try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl lg:grid-cols-[360px,1fr]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="text-sm font-medium text-slate-700">
          Campus email
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Mail size={16} className="text-slate-500" />
            <input
              type="email"
              autoComplete="email"
              placeholder="you@graphic-era.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 flex-1 bg-transparent text-base text-slate-900 focus:outline-none"
              required
            />
          </div>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Password
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Lock size={16} className="text-slate-500" />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="8+ characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 flex-1 bg-transparent text-base text-slate-900 focus:outline-none"
              required
            />
          </div>
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Keep me signed in on this device
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
          {loading ? "Verifying" : "Sign in"}
        </button>

        <div className="flex flex-wrap justify-between text-sm text-slate-500">
          <Link href="/plan" className="underline-offset-4 hover:text-slate-900 hover:underline">
            Forgot access? Ping ops
          </Link>
          <Link href="/signup" className="underline-offset-4 text-emerald-700 hover:text-emerald-900 hover:underline">
            Need an account? Sign up via Clerk
          </Link>
        </div>

        {error && (
          <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}
      </form>

      <div className="rounded-2xl bg-slate-50 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Security stack</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">
          SOC2 playbook ready on day zero
        </h3>
        <p className="mt-3 text-sm text-slate-600">
          Link this UI to your preferred IdP. We already scoped JWT session storage, MFA prompts and
          webhook notifications so rollouts stay painless.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-slate-700">
          {securityHighlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
