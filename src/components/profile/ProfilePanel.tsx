"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarClock, MapPin, Save, Send, User2, XCircle } from "lucide-react";
import Link from "next/link";

type ListingAddress = {
  label: string;
  line1: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
};

type Profile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  savedAddresses: ListingAddress[];
};

type AddressForm = {
  label: string;
  line1: string;
  city: string;
  pincode: string;
  lat: string;
  lng: string;
};

type Message = {
  variant: "success" | "error";
  text: string;
};

function trimField(value: string) {
  return value.trim();
}

function isValidPincode(value: string) {
  return /^\d{6}$/.test(value);
}

function isValidPhone(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}

function parseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const source = payload as { error?: unknown };
  return typeof source.error === "string" ? source.error : "";
}

async function readJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<unknown>;
}

function toProfile(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const source = payload as {
    user?: Profile;
    userId?: string;
    fullName?: string;
    phone?: string;
  };
  return (source.user as Profile | undefined) ?? null;
}

export function ProfilePanel() {
  const [loading, setLoading] = useState(true);
  const [busyProfile, setBusyProfile] = useState(false);
  const [busyAddress, setBusyAddress] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profilePatch, setProfilePatch] = useState({ fullName: "", phone: "" });
  const [message, setMessage] = useState<Message | null>(null);
  const [addressDraft, setAddressDraft] = useState<AddressForm>({
    label: "",
    line1: "",
    city: "",
    pincode: "",
    lat: "",
    lng: "",
  });

  const [addressMessage, setAddressMessage] = useState<Message | null>(null);

  const clearMessage = useCallback(() => setMessage(null), []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        setProfile(null);
        return;
      }
      const payload = (await readJson(response)) as { user?: Profile };
      const loaded = toProfile(payload);
      if (loaded) {
        setProfile(loaded);
        setProfilePatch({
          fullName: loaded.fullName,
          phone: loaded.phone,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    clearMessage();
    const fullName = trimField(profilePatch.fullName);
    const phone = trimField(profilePatch.phone);
    const payload: Record<string, string> = {};

    if (fullName && fullName !== profile.fullName) {
      payload.fullName = fullName;
    }
    if (phone && phone !== profile.phone) {
      if (!isValidPhone(phone)) {
        setMessage({
          variant: "error",
          text: "Enter a valid 10-digit Indian phone number.",
        });
        return;
      }
      payload.phone = phone;
    }

    if (Object.keys(payload).length === 0) {
      setMessage({
        variant: "error",
        text: "No changes detected. Update profile name or phone first.",
      });
      return;
    }

    setBusyProfile(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await readJson(response)) as { user?: Profile };
      if (!response.ok) {
        const error = parseText(result);
        setMessage({ variant: "error", text: error || "Unable to update profile." });
        return;
      }
      const updated = toProfile({ user: result.user });
      if (updated) {
        setProfile(updated);
        setProfilePatch({
          fullName: updated.fullName,
          phone: updated.phone,
        });
      }
      setMessage({ variant: "success", text: "Profile saved successfully." });
    } finally {
      setBusyProfile(false);
    }
  };

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault();
    setAddressMessage(null);

    const address: ListingAddress = {
      label: trimField(addressDraft.label),
      line1: trimField(addressDraft.line1),
      city: trimField(addressDraft.city),
      pincode: trimField(addressDraft.pincode),
      lat: Number(addressDraft.lat),
      lng: Number(addressDraft.lng),
    };

    if (!address.label || !address.line1 || !address.city || !isValidPincode(address.pincode)) {
      setAddressMessage({
        variant: "error",
        text: "Address label/line/city + 6-digit pincode are required.",
      });
      return;
    }
    if (!Number.isFinite(address.lat) || !Number.isFinite(address.lng)) {
      setAddressMessage({
        variant: "error",
        text: "Provide valid latitude and longitude numbers.",
      });
      return;
    }

    setBusyAddress(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            ...address,
            pincode: address.pincode,
            line1: address.line1,
            city: address.city,
            lat: address.lat,
            lng: address.lng,
            label: address.label,
          },
        }),
      });

      const payload = (await readJson(response)) as { user?: Profile };
      if (!response.ok) {
        setAddressMessage({
          variant: "error",
          text: parseText(payload) || "Unable to save address.",
        });
        return;
      }

      const refreshed = toProfile(payload);
      if (refreshed) {
        setProfile(refreshed);
      }
      setAddressDraft({
        label: "",
        line1: "",
        city: "",
        pincode: "",
        lat: "",
        lng: "",
      });
      setAddressMessage({
        variant: "success",
        text: "Address saved to favorites.",
      });
    } finally {
      setBusyAddress(false);
    }
  };

  const useCurrentLocation = async () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setAddressDraft((previous) => ({
          ...previous,
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
        }));
      },
      () => {
        setAddressMessage({
          variant: "error",
          text: "Geolocation permission denied. Enter coordinates manually.",
        });
      },
      { enableHighAccuracy: true },
    );
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8">
        <p className="text-sm text-white/55">Loading profile…</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-sm text-white/65">
        <p>
          Sign in to manage profile and saved addresses.
          <Link href="/sign-in" className="ml-2 underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">User profile</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{profile.fullName}</h2>
          <p className="mt-1 text-sm text-white/55">
            {profile.email} · {profile.phone || "No phone saved"} · {profile.role}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] px-3 py-2 text-xs text-white/80"
        >
          <CalendarClock size={14} />
          Booking history
        </Link>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <form onSubmit={(event) => void updateProfile(event)} className="space-y-4 rounded-2xl border border-white/[0.12] bg-white/[0.02] p-5">
          <p className="text-sm font-semibold text-white">Account details</p>
          <label className="text-xs text-white/70">
            Full Name
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/[0.12] bg-[#060b11] px-3 py-2">
              <User2 size={16} className="text-white/45" />
              <input
                value={profilePatch.fullName}
                onChange={(event) => setProfilePatch((previous) => ({ ...previous, fullName: event.target.value }))}
                className="w-full bg-transparent text-sm text-white outline-none"
                placeholder="Your display name"
              />
            </div>
          </label>
          <label className="text-xs text-white/70">
            Phone
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/[0.12] bg-[#060b11] px-3 py-2">
              <span className="text-white/50">+91</span>
              <input
                value={profilePatch.phone}
                onChange={(event) =>
                  setProfilePatch((previous) => ({ ...previous, phone: event.target.value.replace(/[^0-9]/g, "").slice(0, 10) }))
                }
                className="w-full bg-transparent text-sm text-white outline-none"
                placeholder="9876543210"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={busyProfile}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/20"
          >
            <Save size={14} />
            {busyProfile ? "Saving..." : "Save profile"}
          </button>

          {message ? (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                message.variant === "error"
                  ? "border-rose-500/35 bg-rose-500/10 text-rose-200"
                  : "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {message.text}
            </p>
          ) : null}
        </form>

        <form onSubmit={(event) => void saveAddress(event)} className="space-y-4 rounded-2xl border border-white/[0.12] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Add saved address</p>
            <button
              type="button"
              onClick={() => void useCurrentLocation()}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-white/80"
            >
              <MapPin size={13} />
              Use current location
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-white/70">
              Label
              <input
                value={addressDraft.label}
                onChange={(event) => setAddressDraft((previous) => ({ ...previous, label: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-white/[0.12] bg-[#060b11] px-3 py-2 text-sm text-white"
                placeholder="e.g. Home / Office"
              />
            </label>
            <label className="text-xs text-white/70">
              Pincode
              <input
                value={addressDraft.pincode}
                onChange={(event) =>
                  setAddressDraft((previous) => ({ ...previous, pincode: event.target.value.replace(/[^0-9]/g, "").slice(0, 6) }))
                }
                className="mt-2 w-full rounded-lg border border-white/[0.12] bg-[#060b11] px-3 py-2 text-sm text-white"
                placeholder="248001"
                inputMode="numeric"
              />
            </label>
            <label className="text-xs text-white/70 sm:col-span-2">
              Address line
              <input
                value={addressDraft.line1}
                onChange={(event) =>
                  setAddressDraft((previous) => ({ ...previous, line1: event.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-white/[0.12] bg-[#060b11] px-3 py-2 text-sm text-white"
                placeholder="Building number, street, area"
              />
            </label>
            <label className="text-xs text-white/70">
              City
              <input
                value={addressDraft.city}
                onChange={(event) => setAddressDraft((previous) => ({ ...previous, city: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-white/[0.12] bg-[#060b11] px-3 py-2 text-sm text-white"
                placeholder="City"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-white/70">
                Latitude
                <input
                  type="number"
                  step="any"
                  value={addressDraft.lat}
                  onChange={(event) => setAddressDraft((previous) => ({ ...previous, lat: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-white/[0.12] bg-[#060b11] px-3 py-2 text-sm text-white"
                  placeholder="30.2930"
                />
              </label>
              <label className="text-xs text-white/70">
                Longitude
                <input
                  type="number"
                  step="any"
                  value={addressDraft.lng}
                  onChange={(event) => setAddressDraft((previous) => ({ ...previous, lng: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-white/[0.12] bg-[#060b11] px-3 py-2 text-sm text-white"
                  placeholder="78.0265"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={busyAddress}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-500/80 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/20"
          >
            <Send size={14} />
            {busyAddress ? "Saving address…" : "Save address"}
          </button>

          {addressMessage ? (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                addressMessage.variant === "error"
                  ? "border-rose-500/35 bg-rose-500/10 text-rose-200"
                  : "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {addressMessage.text}
            </p>
          ) : null}
        </form>
      </div>

      <section className="mt-6 rounded-2xl border border-white/[0.12] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white">Saved addresses</p>
          <p className="text-xs text-white/50">{profile.savedAddresses.length} saved</p>
        </div>

        {profile.savedAddresses.length === 0 ? (
          <p className="mt-3 text-sm text-white/55">No saved addresses yet.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {profile.savedAddresses.map((entry) => (
              <article
                key={`${entry.label}-${entry.pincode}`}
                className="rounded-xl border border-white/[0.12] bg-[#060b11] p-3 text-sm text-white/80"
              >
                <p className="font-semibold text-white">{entry.label}</p>
                <p className="mt-1 text-white/65">
                  {entry.line1}, {entry.city} · {entry.pincode}
                </p>
                <p className="mt-2 text-xs text-emerald-300">
                  {entry.lat.toFixed(6)}, {entry.lng.toFixed(6)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {profile.savedAddresses.length > 0 ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-white/50">
          <XCircle size={13} />
          Deleting addresses is not yet implemented in this milestone.
        </p>
      ) : null}
    </section>
  );
}
