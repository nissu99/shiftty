import {
  buildInventoryPayloadFromClient,
  estimatePrice,
  normalizeBuildingType,
  recommendPackage,
  type InventoryLine,
  type PackageType,
  type ShiftInputs,
} from "./shiftyEngine";
import { haversineDistanceKm } from "./geo";
import type { Coordinate } from "./geo";

const DEFAULT_SOURCE_COORDS: Coordinate = { lat: 30.293, lng: 78.0265 };
const DEFAULT_DESTINATION_COORDS: Coordinate = { lat: 30.3099, lng: 78.0513 };

export type BookingDraft = {
  source: string;
  destination: string;
  sourceFloor: number;
  destinationFloor: number;
  buildingType: string;
  elevatorAvailable: boolean;
  moveDate: string;
  sourceCoords: Coordinate;
  destinationCoords: Coordinate;
  inventory: InventoryLine[];
};

export type QuoteResponse = {
  packageType: PackageType;
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
  breakdown: {
    distanceComponent: number;
    itemizedBaseComponent: number;
    riskHandling: number;
    floorAndAccess: number;
    demandFactor: number;
  };
};

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function toInteger(value: unknown): number | null {
  const raw = toNumber(value);
  if (raw === null) return null;
  return Number.isNaN(raw) ? null : Math.trunc(raw);
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.toLowerCase().trim());
  }
  return false;
}

function toCoordinate(raw: unknown): Coordinate | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;
  const lat = toNumber(payload.lat);
  const lng = toNumber(payload.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function parsePackageType(raw: unknown): PackageType | undefined {
  const value = toText(raw);
  if (value === "Basic" || value === "Standard" || value === "Premium") {
    return value;
  }
  return undefined;
}

function parseInventoryItems(raw: unknown): InventoryLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const itemId = toText(item.itemId || item.id);
      if (!itemId) return null;
      const itemName = toText(item.itemName || item.name);
      const category = toText(item.category) || "other";
      const quantity = Math.max(0, toInteger(item.quantity) ?? 0);
      const isFragile = toBoolean(item.isFragile);
      const estimatedVolume = Math.max(0.1, toNumber(item.estimatedVolume) ?? 0.4);

      if (quantity <= 0) return null;

      return {
        itemId,
        itemName: itemName || itemId,
        category,
        quantity,
        isFragile,
        estimatedVolume,
      };
    })
    .filter((item): item is InventoryLine => Boolean(item));
}

export function parseBookingDraft(raw: unknown, options?: { requireInventory: boolean }): BookingDraft {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid booking payload.");
  }

  const body = raw as Record<string, unknown>;
  const source = toText(body.source);
  const destination = toText(body.destination);
  const sourceFloor = toInteger(body.sourceFloor) ?? 0;
  const destinationFloor = toInteger(body.destinationFloor) ?? 0;
  const buildingType = toText(body.buildingType || "apartment") || "apartment";
  const elevatorAvailable = toBoolean(body.elevatorAvailable);
  const inventory = parseInventoryItems(body.inventory);
  const sourceCoords = toCoordinate(body.sourceCoords) ?? DEFAULT_SOURCE_COORDS;
  const destinationCoords = toCoordinate(body.destinationCoords) ?? DEFAULT_DESTINATION_COORDS;
  const moveDateText = toText(body.moveDate);

  if (!source) throw new Error("Pickup location is required.");
  if (!destination) throw new Error("Drop-off location is required.");
  if (!Number.isFinite(sourceFloor) || sourceFloor < 0 || sourceFloor > 30) {
    throw new Error("Source floor must be between 0 and 30.");
  }
  if (!Number.isFinite(destinationFloor) || destinationFloor < 0 || destinationFloor > 30) {
    throw new Error("Destination floor must be between 0 and 30.");
  }
  if (!moveDateText) throw new Error("Move date is required.");
  if (!Array.isArray(inventory) || (options?.requireInventory && inventory.length === 0)) {
    throw new Error("Inventory with at least one item is required.");
  }
  if (Number.isNaN(Date.parse(moveDateText))) {
    throw new Error("Invalid move date.");
  }

  return {
    source,
    destination,
    sourceFloor,
    destinationFloor,
    buildingType,
    elevatorAvailable,
    moveDate: new Date(moveDateText).toISOString(),
    sourceCoords,
    destinationCoords,
    inventory,
  };
}

export function buildQuote(draft: BookingDraft, packageTypeOverride?: PackageType): QuoteResponse {
  const totalItems = draft.inventory.reduce((sum, item) => sum + item.quantity, 0);
  const fragileCount = draft.inventory.reduce(
    (sum, item) => sum + (item.isFragile ? item.quantity : 0),
    0,
  );
  const largeFurnitureCount = draft.inventory.reduce(
    (sum, item) =>
      item.category === "furniture" ? sum + item.quantity : sum,
    0,
  );

  buildInventoryPayloadFromClient(draft.inventory);
  const moveDate = new Date(draft.moveDate);
  const shiftInput: ShiftInputs = {
    distanceKm: haversineDistanceKm(draft.sourceCoords, draft.destinationCoords),
    totalItems,
    fragileCount,
    largeFurnitureCount,
    buildingType: normalizeBuildingType(draft.buildingType),
    floorNumber: draft.sourceFloor,
    elevatorAvailable: draft.elevatorAvailable,
    peakHour: moveDate.getUTCHours(),
    dayOfWeek: moveDate.getUTCDay(),
    advanceBookingDays: Math.max(0, Math.floor((moveDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    inventory: draft.inventory,
    sourceCoordinates: draft.sourceCoords,
    destinationCoordinates: draft.destinationCoords,
  };

  const recommendation = recommendPackage(shiftInput);
  const appliedPackage = packageTypeOverride ?? recommendation.packageType;
  const pricing = estimatePrice(shiftInput, appliedPackage);

  return {
    packageType: recommendation.packageType,
    packageConfidence: recommendation.packageConfidence,
    basePrice: pricing.basePrice,
    finalPrice: pricing.finalPrice,
    discountPercent: pricing.discount.discountPercent,
    discountReasons: pricing.discount.reasons,
    routeDistanceKm: pricing.routeDistanceKm,
    packageSuggestion: {
      Basic: pricing.packageSuggestion.basic,
      Standard: pricing.packageSuggestion.standard,
      Premium: pricing.packageSuggestion.premium,
    },
    demandMultiplier: pricing.demandMultiplier,
    breakdown: {
      distanceComponent: pricing.breakdown.distanceComponent,
      itemizedBaseComponent: pricing.breakdown.itemizedBaseComponent,
      riskHandling: pricing.breakdown.riskHandling,
      floorAndAccess: pricing.breakdown.floorAndAccess,
      demandFactor: pricing.breakdown.demandFactor,
    },
  };
}
