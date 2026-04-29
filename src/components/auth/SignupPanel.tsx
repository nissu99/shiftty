"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Lock, Mail, User } from "lucide-react";

type AuthResponse = {
  error?: string;
  user?: {
    id: string;
    fullName: string;
    role: string;
  };
};

export function SignupPanel() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (fullName.length < 3) {
      setError("Enter a full name.");
      return;
    }
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (!/^[6-9]\\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian phone number.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });

      const payload = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(payload.error ?? "Could not create account.");
        return;
      }

      setMessage(`Welcome ${payload.user?.fullName ?? fullName}. Redirecting to planning page...`);
      router.refresh();
      router.push("/plan");
    } catch {
      setError("Network error while creating account.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    setMessage(null);

    if (!fullName || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      setError("Use a valid email and full name for OAuth registration.");
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
          providerId: `${provider}-${email}`,
          providerUserId: email,
          email,
          phone: phone || undefined,
          fullName,
        }),
      });

      const payload = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(payload.error ?? `Unable to authenticate with ${provider}.`);
        return;
      }

      setMessage(`Signed up with ${provider}. Redirecting to planning page...`);
      router.refresh();
      router.push("/plan");
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
          Full name
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/[0.16] bg-white/[0.02] px-4">
            <User size={16} className="text-white/50" />
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-12 flex-1 bg-transparent text-base text-white focus:outline-none"
              required
            />
          </div>
        </label>

        <label className="text-sm font-medium text-white/80">
          Email
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/[0.16] bg-white/[0.02] px-4">
            <Mail size={16} className="text-white/50" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 flex-1 bg-transparent text-base text-white focus:outline-none"
              required
            />
          </div>
        </label>

        <label className="text-sm font-medium text-white/80">
          Phone
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/[0.16] bg-white/[0.02] px-4">
            <span className="text-sm text-white/50">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
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
              autoComplete="new-password"
              minLength={6}
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
          {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
          {loading ? "Creating account" : "Create account"}
        </button>

        <div className="space-y-2">
          <p className="text-xs text-white/60">Or create/sign in with OAuth</p>
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

        {error && (
          <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </p>
        )}
      </form>

      <div className="rounded-2xl bg-white/[0.03] p-6 text-white/80">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Account policy</p>
        <h3 className="mt-2 text-2xl font-semibold">Ready for secure session flow</h3>
        <p className="mt-3 text-sm text-white/60">
          Registration uses hashed local secrets for password storage in this prototype and issue-based
          JWT cookies for route-level authorization.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Profile created with role-aware defaults and saved in project storage</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Inventory and booking history sync automatically to your profile</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Secure logout, session refresh and route protection on API calls</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
