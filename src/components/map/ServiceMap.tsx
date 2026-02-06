'use client';

import type { HousingListing } from "@/data/listings";
import type { CampusNode, FleetSummary } from "@/data/serviceArea";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Navigation, AlertTriangle } from "lucide-react";

type ReactLeafletModule = typeof import("react-leaflet");

type ServiceAreaPayload = {
  checkpoints: CampusNode[];
  activeFleet: FleetSummary;
  polyline: Array<[number, number]>;
};

export function ServiceMap() {
  const [rl, setRl] = useState<ReactLeafletModule | null>(null);
  const [serviceArea, setServiceArea] = useState<ServiceAreaPayload | null>(null);
  const [listings, setListings] = useState<HousingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const center = useMemo<[number, number]>(() => [30.293, 78.0265], []);

  /* ── Load react-leaflet (client only) ── */
  useEffect(() => {
    let cancelled = false;
    import("react-leaflet")
      .then((mod) => {
        if (!cancelled) setRl(mod);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load map library.");
      });
    return () => { cancelled = true; };
  }, []);

  /* ── Fix default marker icons ── */
  useEffect(() => {
    import("leaflet").then((L) => {
      const proto = L.default.Icon.Default.prototype as unknown as {
        _getIconUrl?: () => string;
      };
      delete proto._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  /* ── Fetch data ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetch("/api/service-area"), fetch("/api/listings")])
      .then(async ([areaRes, listRes]) => {
        if (!areaRes.ok || !listRes.ok) throw new Error("API error");
        const areaJson = (await areaRes.json()) as ServiceAreaPayload;
        const listJson = (await listRes.json()) as { listings: HousingListing[] };
        if (cancelled) return;
        setServiceArea(areaJson);
        setListings(listJson.listings ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load map data. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  /* ── Derived ── */
  const fleet = serviceArea?.activeFleet;
  const ready = rl && serviceArea && !loading && !error;

  /* ── Loading / Error states ── */
  if (!ready) {
    return (
      <section id="map" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <MapHeader fleet={fleet} />
        {error ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            <AlertTriangle size={18} />
            {error}
          </div>
        ) : (
          <div className="mt-6 flex h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-100 bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-sm text-slate-500">
              {loading ? "Fetching live service data…" : "Loading map tiles…"}
            </p>
          </div>
        )}
      </section>
    );
  }

  /* ── Render Map ── */
  const { MapContainer, TileLayer, Marker, Popup, Polyline } = rl;

  return (
    <section id="map" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
      <MapHeader fleet={fleet} />

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          Service route
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin size={12} className="text-blue-600" />
          Campus checkpoints
        </span>
        <span className="flex items-center gap-1.5">
          <Navigation size={12} className="text-rose-500" />
          Hostels / PGs
        </span>
      </div>

      {/* Map */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: 420, width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Service route polyline */}
          <Polyline
            positions={serviceArea.polyline}
            pathOptions={{ color: "#10b981", weight: 4, opacity: 0.8 }}
          />

          {/* Campus checkpoints */}
          {serviceArea.checkpoints.map((node) => (
            <Marker position={[node.lat, node.lng]} key={node.name}>
              <Popup>
                <div className="text-center">
                  <p className="font-semibold text-slate-900">{node.name}</p>
                  <p className="text-xs text-emerald-600">Campus checkpoint</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Housing listings */}
          {listings.map((listing) => (
            <Marker
              key={listing.id}
              position={[listing.coordinates.lat, listing.coordinates.lng]}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-semibold text-slate-900">{listing.title}</p>
                  <p className="text-xs text-slate-500">{listing.address}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-700">
                      ₹{listing.rent.toLocaleString("en-IN")}/mo
                    </span>
                    <span className="text-slate-500">
                      {listing.travelTimeMinutes} min to campus
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {listing.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-amber-600">
                    ★ {listing.rating} · {listing.capacity} capacity
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}

/* ── Header sub-component ── */
function MapHeader({ fleet }: { fleet?: FleetSummary }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
          Live territory map
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
          Coverage from Clement Town to Rajpur Road
        </h2>
        <p className="mt-2 text-slate-600">
          See verified pickup clusters, partner hostels and multi-drop routes in
          real time. Tap a marker to preview rent and capacity.
        </p>
      </div>
      {fleet && (
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl bg-slate-900 px-4 py-2 text-center">
            <p className="text-lg font-bold text-white">{fleet.activeMovers}</p>
            <p className="text-[10px] uppercase text-slate-400">Active movers</p>
          </div>
          <div className="rounded-xl bg-slate-900 px-4 py-2 text-center">
            <p className="text-lg font-bold text-white">{fleet.coldStorageTrucks}</p>
            <p className="text-[10px] uppercase text-slate-400">Trucks</p>
          </div>
          <div className="rounded-xl bg-slate-900 px-4 py-2 text-center">
            <p className="text-lg font-bold text-white">{fleet.etaAccuracyMinutes}m</p>
            <p className="text-[10px] uppercase text-slate-400">ETA accuracy</p>
          </div>
        </div>
      )}
    </div>
  );
}
