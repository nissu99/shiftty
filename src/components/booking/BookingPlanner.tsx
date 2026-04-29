"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarCheck, Loader2, LocateFixed, MapPin, Package, Route, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type InventorySeedItem = {
  id: string;
  name: string;
  category: string;
  fragileDefault: boolean;
  approximateVolume: number;
};

type InventoryLine = {
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  isFragile: boolean;
  estimatedVolume: number;
};

type QuoteResponse = {
  packageType: "Basic" | "Standard" | "Premium";
  packageConfidence: number;
  basePrice: number;
  finalPrice: number;
  discountPercent: number;
  discountReasons: string[];
  routeDistanceKm: number;
  packageSuggestion: {
    Basic: number;
    Standard: number;
    Premium: number;
  };
  demandMultiplier: number;
  breakdown?: {
    distanceComponent?: number;
    itemizedBaseComponent?: number;
    riskHandling?: number;
    floorAndAccess?: number;
    demandFactor?: number;
  };
};

type GeocodeTarget = "source" | "destination";
type GeocodeState = {
  loading: boolean;
  message: string | null;
  source: "google" | "fallback" | "";
};

const defaultCoords = { lat: 30.293, lng: 78.0265 };
const routeOptions = [
  { id: "apartment", label: "Apartment/Flat", suffix: "independent if ground house" },
  { id: "independent", label: "Independent house", suffix: "villa / bungalow" },
  { id: "office", label: "Office", suffix: "commercial location" },
];

export function BookingPlanner() {
  const router = useRouter();

  const [catalog, setCatalog] = useState<InventorySeedItem[]>([]);
  const [search, setSearch] = useState("");

  const [source, setSource] = useState("Graphic Era Main Gate");
  const [destination, setDestination] = useState("Clement Town Gate 2");
  const [sourceFloor, setSourceFloor] = useState(2);
  const [destinationFloor, setDestinationFloor] = useState(1);
  const [buildingType, setBuildingType] = useState("apartment");
  const [elevatorAvailable, setElevatorAvailable] = useState(true);
  const [moveDate, setMoveDate] = useState(() =>
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [moveTime, setMoveTime] = useState("11:00");
  const [sourceCoords, setSourceCoords] = useState(defaultCoords);
  const [destinationCoords, setDestinationCoords] = useState({
    lat: 30.3099,
    lng: 78.0513,
  });

  const [items, setItems] = useState<Record<string, InventoryLine>>({});
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [busy, setBusy] = useState<"quote" | "book" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geoState, setGeoState] = useState<Record<GeocodeTarget, GeocodeState>>({
    source: { loading: false, message: null, source: "" },
    destination: { loading: false, message: null, source: "" },
  });

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);
    fetch("/api/inventory")
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        setCatalog(payload?.catalog ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load inventory catalog.");
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const inventoryList = useMemo(
    () =>
      catalog.filter(
        (item) =>
          !search ||
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase()),
      ),
    [catalog, search],
  );

  const selectedInventory = useMemo(
    () => Object.values(items).filter((entry) => entry.quantity > 0),
    [items],
  );

  const setGeoStateFor = (target: GeocodeTarget, patch: Partial<GeocodeState>) => {
    setGeoState((prev) => ({
      ...prev,
      [target]: {
        ...prev[target],
        ...patch,
      },
    }));
  };

  const resolveAddress = async (target: GeocodeTarget) => {
    const value = target === "source" ? source : destination;
    if (!value.trim()) {
      setGeoStateFor(target, {
        loading: false,
        message: `Enter the ${target} address before resolving.`,
        source: "",
      });
      return;
    }

    setGeoStateFor(target, { loading: true, message: null });
    try {
      const query = encodeURIComponent(value.trim());
      const response = await fetch(`/api/location?address=${query}`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `Unable to resolve ${target} location.`);
      }

      const payload = (await response.json()) as {
        lat: number;
        lng: number;
        source: "google" | "fallback";
        resolvedAddress: string;
      };
      const lat = Number(payload.lat);
      const lng = Number(payload.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Resolved coordinates are invalid.");
      }

      if (target === "source") {
        setSourceCoords({ lat, lng });
      } else {
        setDestinationCoords({ lat, lng });
      }

      setGeoStateFor(target, {
        message: `Matched "${payload.resolvedAddress}" via ${payload.source === "google" ? "Google Maps" : "fallback matching"}.`,
        source: payload.source,
      });
    } catch (err) {
      if (err instanceof Error) {
        setGeoStateFor(target, { message: err.message, source: "" });
      }
    } finally {
      setGeoStateFor(target, { loading: false });
    }
  };

  const setQuantity = (item: InventorySeedItem, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => {
        const clone = { ...prev };
        delete clone[item.id];
        return clone;
      });
      return;
    }
    setItems((prev) => ({
      ...prev,
      [item.id]: {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        estimatedVolume: item.approximateVolume,
        quantity,
        isFragile: item.fragileDefault,
      },
    }));
  };

  const setFragile = (itemId: string) => {
    setItems((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: { ...current, isFragile: !current.isFragile },
      };
    });
  };

  const submitQuote = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setQuote(null);
    setBookingId(null);

    if (selectedInventory.length === 0) {
      setError("Add at least one inventory item before quoting.");
      return;
    }

    if (!source.trim() || !destination.trim()) {
      setError("Enter pickup and destination addresses.");
      return;
    }

    const moveDateTime = new Date(`${moveDate}T${moveTime}`).toISOString();
    if (Number.isNaN(new Date(moveDateTime).getTime())) {
      setError("Enter a valid date/time.");
      return;
    }

    try {
      setBusy("quote");
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          destination,
          sourceFloor,
          destinationFloor,
          buildingType,
          elevatorAvailable,
          moveDate: moveDateTime,
          sourceCoords,
          destinationCoords,
          inventory: selectedInventory,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Unable to generate quote.");
      }

      const payload = (await response.json()) as QuoteResponse;
      setQuote(payload);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const createBooking = async () => {
    if (!quote) {
      setError("Generate a quote first.");
      return;
    }
    const moveDateTime = new Date(`${moveDate}T${moveTime}`).toISOString();
    try {
      setBusy("book");
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          destination,
          sourceFloor,
          destinationFloor,
          buildingType,
          elevatorAvailable,
          moveDate: moveDateTime,
          sourceCoords,
          destinationCoords,
          packageType: quote.packageType,
          inventory: selectedInventory,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Unable to create booking.");
      }

      const booking = (await response.json()) as { id: string };
      setBookingId(booking.id);
      setQuote(null);
      router.push(`/payments?bookingId=${booking.id}`);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            AI booking engine
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">
            Build inventory, get package quote, and confirm booking
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Shift planning is driven by the same catalog, package, and distance intelligence used in the
            report modules.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <Sparkles size={14} />
          Live quote + booking
        </span>
      </div>

      <form onSubmit={submitQuote} className="mt-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-white/70">
            Pickup address
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-3 text-base text-white outline-none"
                placeholder="e.g. Graphic Era Main Gate"
              />
              <button
                type="button"
                onClick={() => void resolveAddress("source")}
                disabled={geoState.source.loading}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.15] bg-white/[0.03] px-3 py-3 text-sm text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {geoState.source.loading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                Resolve
              </button>
            </div>
            {geoState.source.message && (
              <p className="mt-1 text-xs text-white/45">{geoState.source.message}</p>
            )}
          </label>
          <label className="text-sm text-white/70">
            Drop-off address
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-3 text-base text-white outline-none"
                placeholder="e.g. Clement Town Hostel B-2"
              />
              <button
                type="button"
                onClick={() => void resolveAddress("destination")}
                disabled={geoState.destination.loading}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.15] bg-white/[0.03] px-3 py-3 text-sm text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {geoState.destination.loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <LocateFixed size={14} />
                )}
                Resolve
              </button>
            </div>
            {geoState.destination.message && (
              <p className="mt-1 text-xs text-white/45">{geoState.destination.message}</p>
            )}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm text-white/70">
            Source floor
            <input
              type="number"
              min={0}
              max={20}
              value={sourceFloor}
              onChange={(event) => setSourceFloor(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-3 text-white outline-none"
            />
          </label>
          <label className="text-sm text-white/70">
            Destination floor
            <input
              type="number"
              min={0}
              max={20}
              value={destinationFloor}
              onChange={(event) => setDestinationFloor(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-3 text-white outline-none"
            />
          </label>
          <label className="text-sm text-white/70">
            Move date
            <input
              type="date"
              value={moveDate}
              onChange={(event) => setMoveDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-3 text-white outline-none"
            />
          </label>
          <label className="text-sm text-white/70">
            Move time
            <input
              type="time"
              value={moveTime}
              onChange={(event) => setMoveTime(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-3 text-white outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-white/70">
            Building type
            <select
              value={buildingType}
              onChange={(event) => setBuildingType(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#060b11] px-4 py-3 text-white outline-none"
            >
              {routeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-white/40">
              {routeOptions.find((option) => option.id === buildingType)?.suffix}
            </p>
          </label>

          <label className="inline-flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 text-sm text-white/70">
            <input
              type="checkbox"
              checked={elevatorAvailable}
              onChange={(event) => setElevatorAvailable(event.target.checked)}
            />
            Elevator available at pickup/drop
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-white/70">
            Pickup coordinates
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.0001"
                value={sourceCoords.lat}
                onChange={(event) =>
                  setSourceCoords((prev) => ({ ...prev, lat: Number(event.target.value) }))
                }
                className="rounded-xl border border-white/[0.1] bg-white/[0.02] px-3 py-3 text-white outline-none"
                placeholder="lat"
              />
              <input
                type="number"
                step="0.0001"
                value={sourceCoords.lng}
                onChange={(event) =>
                  setSourceCoords((prev) => ({ ...prev, lng: Number(event.target.value) }))
                }
                className="rounded-xl border border-white/[0.1] bg-white/[0.02] px-3 py-3 text-white outline-none"
                placeholder="lng"
              />
            </div>
          </label>
          <label className="text-sm text-white/70">
            Drop-off coordinates
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.0001"
                value={destinationCoords.lat}
                onChange={(event) =>
                  setDestinationCoords((prev) => ({ ...prev, lat: Number(event.target.value) }))
                }
                className="rounded-xl border border-white/[0.1] bg-white/[0.02] px-3 py-3 text-white outline-none"
                placeholder="lat"
              />
              <input
                type="number"
                step="0.0001"
                value={destinationCoords.lng}
                onChange={(event) =>
                  setDestinationCoords((prev) => ({ ...prev, lng: Number(event.target.value) }))
                }
                className="rounded-xl border border-white/[0.1] bg-white/[0.02] px-3 py-3 text-white outline-none"
                placeholder="lng"
              />
            </div>
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-white/70">Search inventory</p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="fridge, box, sofa..."
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-3 text-base text-white outline-none"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {loadingCatalog ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/40">
              Loading catalog…
            </p>
          ) : (
            inventoryList.map((item) => {
              const selected = items[item.id];
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{item.name}</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    Fragile by default: {item.fragileDefault ? "Yes" : "No"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="text-xs text-white/60">
                      Qty
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={selected?.quantity ?? 0}
                        onChange={(event) => setQuantity(item, Number(event.target.value))}
                        className="ml-2 w-20 rounded-lg border border-white/[0.1] bg-white/[0.02] px-2 py-1 text-white outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFragile(item.id)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                        selected?.isFragile
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                          : "border-white/10 text-white/50"
                      }`}
                    >
                      <Package size={12} />
                      Fragile
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy === "quote"}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 font-semibold text-white"
          >
            {busy === "quote" ? <Loader2 size={16} className="animate-spin" /> : <Route size={16} />}
            {busy === "quote" ? "Generating quote…" : "Generate quote"}
          </button>

          <button
            type="button"
            onClick={createBooking}
            disabled={!quote || busy !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-white/40"
          >
            {busy === "book" ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
            {busy === "book" ? "Creating booking…" : "Create booking"}
          </button>

          {bookingId && (
            <span className="rounded-xl bg-emerald-500/15 px-4 py-2 text-xs text-emerald-200">
              Booking created: {bookingId}
            </span>
          )}
        </div>
      </form>

      {error && <p className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      {quote && (
        <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
          <h3 className="text-xl font-bold text-white">Live ML Quote</h3>
          <p className="mt-2 text-sm text-white/80">
            Recommended package: <span className="font-semibold">{quote.packageType}</span> with{" "}
            {Math.round(quote.packageConfidence * 100)}% confidence
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <p className="rounded-xl bg-white/10 p-3 text-sm text-white/80">
              Base price: ₹{quote.basePrice.toLocaleString("en-IN")}
            </p>
            <p className="rounded-xl bg-white/10 p-3 text-sm text-white/80">
              Final price: ₹{quote.finalPrice.toLocaleString("en-IN")}
            </p>
            <p className="rounded-xl bg-white/10 p-3 text-sm text-white/80">
              Distance: {quote.routeDistanceKm.toFixed(2)} km
            </p>
          </div>
          <p className="mt-3 text-xs text-white/80">
            Discount: {quote.discountPercent}% · {quote.discountReasons.join(", ")}
          </p>
        </div>
      )}

      {selectedInventory.length > 0 && (
        <div className="mt-6 text-sm text-white/60">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Selected inventory</p>
          <ul className="mt-2 space-y-1">
            {selectedInventory.map((item) => (
              <li key={item.itemId} className="flex justify-between">
                <span>
                  {item.itemName} × {item.quantity}
                </span>
                <span>{item.isFragile ? "Fragile" : "Standard"} handling</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
