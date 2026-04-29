import fs from "node:fs";
import path from "node:path";

import {
  estimatePrice,
  estimateLiveTrackingPoint,
  normalizeBuildingType,
  recommendPackage,
  type InventoryLine,
  type PackageType,
  type ShiftInputs,
} from "./shiftyEngine";
import type { Coordinate } from "./geo";
import { haversineDistanceKm } from "./geo";
import { normalizeBuildingType as normalizeBuilding } from "./shiftyEngine";

export type ListingAddress = {
  label: string;
  line1: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  savedAddresses: ListingAddress[];
  role: "customer" | "mover" | "admin";
  createdAt: string;
};

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";

export type Mover = {
  id: string;
  name: string;
  vehicleType: "mini-truck" | "van" | "truck";
  capacityKg: number;
  rating: number;
  availability: "on_call" | "assigned";
  currentLocation: Coordinate;
};

export type BookingRecord = {
  id: string;
  userId: string;
  moverId: string;
  source: string;
  destination: string;
  moveDate: string;
  sourceFloor: number;
  destinationFloor: number;
  buildingType: "apartment" | "independent" | "office";
  elevatorAvailable: boolean;
  inventory: InventoryLine[];
  packageType: PackageType;
  quote: {
    basePrice: number;
    finalPrice: number;
    discountPercent: number;
    discountReasons: string[];
    packageConfidence: number;
    packageSuggestion: Record<PackageType, number>;
    routeDistanceKm: number;
    demandMultiplier: number;
  };
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  sourceCoords: Coordinate;
  destinationCoords: Coordinate;
  etaMinutes: number;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  cancellationReason?: string;
};

export type ReviewRecord = {
  id: string;
  bookingId: string;
  userId: string;
  moverId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type DbState = {
  users: User[];
  bookings: BookingRecord[];
  movers: Mover[];
  reviews: ReviewRecord[];
};

const FILE = path.join(process.cwd(), ".next", "shifty-store.json");

const DEFAULT_STATE: DbState = {
  users: [],
  bookings: [],
  movers: [
    {
      id: "mvr-001",
      name: "Atlas Movers",
      vehicleType: "mini-truck",
      capacityKg: 650,
      rating: 4.8,
      availability: "on_call",
      currentLocation: { lat: 28.61, lng: 77.20 },
    },
    {
      id: "mvr-002",
      name: "North Peak Logistics",
      vehicleType: "van",
      capacityKg: 300,
      rating: 4.5,
      availability: "on_call",
      currentLocation: { lat: 28.62, lng: 77.2 },
    },
    {
      id: "mvr-003",
      name: "Metro Shift Assist",
      vehicleType: "truck",
      capacityKg: 1100,
      rating: 4.9,
      availability: "on_call",
      currentLocation: { lat: 28.60, lng: 77.19 },
    },
  ],
  reviews: [],
};

let inMemoryState: DbState | null = null;

function readState(): DbState {
  if (inMemoryState) {
    return inMemoryState;
  }

  try {
    const raw = fs.readFileSync(FILE, "utf8");
    inMemoryState = JSON.parse(raw) as DbState;
    return inMemoryState;
  } catch {
    inMemoryState = structuredClone(DEFAULT_STATE);
    persist();
    return inMemoryState;
  }
}

function persist() {
  if (!inMemoryState) return;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(inMemoryState, null, 2), "utf8");
  } catch {
    // intentional no-op for environments without fs write permissions
  }
}

const clone = <T,>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

function findUserById(userId: string): User | undefined {
  return readState().users.find((user) => user.id === userId);
}

function findBooking(id: string): BookingRecord | undefined {
  return readState().bookings.find((booking) => booking.id === id);
}

function findUserByIdMutable(userId: string): User | undefined {
  return readState().users.find((user) => user.id === userId);
}

export function getDbSnapshot() {
  return clone(readState());
}

export function createUser(input: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role?: "customer" | "mover" | "admin";
}) {
  const db = readState();
  const newUser: User = {
    id: input.id,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    passwordHash: input.passwordHash,
    savedAddresses: [],
    role: input.role ?? "customer",
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  persist();
  return clone(newUser);
}

export function listUsers(): User[] {
  return clone(readState().users);
}

export function getUserById(userId: string): User | undefined {
  return findUserByIdMutable(userId) ? clone(findUserByIdMutable(userId)) : undefined;
}

export function updateUserProfile(userId: string, input: { fullName?: string; phone?: string }) {
  const user = findUserByIdMutable(userId);
  if (!user) return null;

  if (typeof input.fullName === "string" && input.fullName.trim()) {
    user.fullName = input.fullName.trim();
  }

  if (typeof input.phone === "string" && input.phone.trim()) {
    user.phone = input.phone.trim();
  }

  persist();
  return clone(user);
}

export function getUserByEmailOrPhone(email: string, phone?: string): User | undefined {
  const needleEmail = email.toLowerCase();
  const needlePhone = phone?.trim();
  return readState().users.find(
    (user) =>
      user.email.toLowerCase() === needleEmail ||
      (needlePhone && user.phone === needlePhone),
  );
}

export function addOrUpdateAddress(userId: string, address: ListingAddress) {
  const db = readState();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) {
    return null;
  }

  const existing = user.savedAddresses.find((item) => item.label === address.label);
  if (!existing) {
    user.savedAddresses.push(address);
  } else {
    existing.line1 = address.line1;
    existing.city = address.city;
    existing.pincode = address.pincode;
    existing.lat = address.lat;
    existing.lng = address.lng;
  }

  persist();
  return clone(user);
}

export function createBooking(input: {
  userId: string;
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
  packageType?: PackageType;
}) {
  const state = readState();

  if (!findUserById(input.userId)) {
    throw new Error("USER_NOT_FOUND");
  }

  const normalized =
    input.inventory.length > 0
      ? input.inventory.map((item) => ({
          ...item,
          category: item.category || "other",
          estimatedVolume: item.estimatedVolume ?? 0.4,
        }))
      : [];

  const moveDate = new Date(input.moveDate);
  if (!Number.isFinite(moveDate.getTime())) {
    throw new Error("INVALID_MOVE_DATE");
  }

  const dayOfWeek = moveDate.getUTCDay();
  const moveHour = moveDate.getUTCHours();
  const now = Date.now();
  const advanceBookingDays = Math.max(0, Math.floor((moveDate.getTime() - now) / (1000 * 60 * 60 * 24)));
  const totalItems = normalized.reduce((sum, item) => sum + Math.max(item.quantity, 0), 0);
  const fragileCount = normalized.reduce(
    (sum, item) => sum + (item.isFragile ? Math.max(item.quantity, 0) : 0),
    0,
  );

  const largeFurnitureCount = normalized
    .filter((item) => item.category === "furniture")
    .reduce((sum, item) => sum + Math.max(item.quantity, 0), 0);

  const distanceKm = haversineDistanceKm(input.sourceCoords, input.destinationCoords);
  const engineInput: ShiftInputs = {
    distanceKm,
    totalItems,
    fragileCount,
    largeFurnitureCount,
    buildingType: normalizeBuilding(input.buildingType || "apartment"),
    floorNumber: input.sourceFloor,
    elevatorAvailable: input.elevatorAvailable,
    peakHour: moveHour,
    dayOfWeek,
    advanceBookingDays,
    inventory: normalized,
    sourceCoordinates: input.sourceCoords,
    destinationCoordinates: input.destinationCoords,
  };

  const recommendation = recommendPackage(engineInput);
  const selectedPackage = input.packageType ?? recommendation.packageType;
  const quote = estimatePrice(engineInput, selectedPackage);

  const mover = pickBestMover(state.movers, engineInput);
  const etaMinutes = Math.max(45, Math.round((distanceKm / 26) * 60 + totalItems * 1.6));

  const nowIso = new Date(now).toISOString();
  const booking: BookingRecord = {
    id: crypto.randomUUID(),
    userId: input.userId,
    moverId: mover.id,
    source: input.source,
    destination: input.destination,
    moveDate: moveDate.toISOString(),
    sourceFloor: input.sourceFloor,
    destinationFloor: input.destinationFloor,
    buildingType: normalizeBuildingType(buildingTypeOrDefault(input.buildingType)),
    elevatorAvailable: input.elevatorAvailable,
    inventory: normalized,
    packageType: selectedPackage,
    quote: {
      basePrice: quote.basePrice,
      finalPrice: quote.finalPrice,
      discountPercent: quote.discount.discountPercent,
      discountReasons: quote.discount.reasons,
      packageConfidence: recommendation.packageConfidence,
      packageSuggestion: quote.packageSuggestion,
      routeDistanceKm: quote.routeDistanceKm,
      demandMultiplier: quote.demandMultiplier,
    },
    status: "PENDING",
    paymentStatus: "UNPAID",
    sourceCoords: input.sourceCoords,
    destinationCoords: input.destinationCoords,
    etaMinutes,
    progressPercent: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  state.bookings.unshift(booking);
  persist();
  return clone(booking);
}

function buildingTypeOrDefault(value: string | undefined): string {
  return value ?? "apartment";
}

function pickBestMover(movers: Mover[], input: ShiftInputs): Mover {
  const candidates = movers
    .map((mover) => ({
      mover,
      score:
        mover.rating * 10 +
        (mover.availability === "on_call" ? 10 : 0) -
        input.totalItems * 0.02,
    }))
    .filter((entry) => entry.mover.availability === "on_call");

  if (candidates.length === 0) {
    return movers[0];
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].mover;
}

export function listBookingsForUser(userId: string): BookingRecord[] {
  return clone(readState().bookings.filter((booking) => booking.userId === userId));
}

export function listAllBookings(): BookingRecord[] {
  return clone(readState().bookings);
}

export function getBooking(id: string): BookingRecord | null {
  const booking = findBooking(id);
  return booking ? clone(booking) : null;
}

export function findBookingByReference(reference: string): BookingRecord | null {
  const booking = readState().bookings.find(
    (item) =>
      item.paymentReference?.toLowerCase() ===
      String(reference ?? "").toLowerCase(),
  );
  return booking ? clone(booking) : null;
}

export function setBookingStatus(id: string, status: BookingStatus): BookingRecord | null {
  const booking = findBooking(id);
  if (!booking) return null;

  booking.status = status;
  booking.updatedAt = new Date().toISOString();
  if (status === "IN_TRANSIT" && !booking.startedAt) {
    booking.startedAt = booking.updatedAt;
  }
  if (status === "COMPLETED" && !booking.completedAt) {
    booking.completedAt = booking.updatedAt;
    booking.progressPercent = 100;
  }

  persist();
  return clone(booking);
}

export function setPaymentIntentReference(bookingId: string, reference: string) {
  const booking = findBooking(bookingId);
  if (!booking) return null;

  booking.paymentReference = reference;
  booking.paymentStatus = "UNPAID";
  booking.updatedAt = new Date().toISOString();
  persist();
  return clone(booking);
}

export function cancelBooking(id: string, userId: string): BookingRecord | null {
  const booking = findBooking(id);
  if (!booking || booking.userId !== userId) return null;

  const moveTs = new Date(booking.moveDate).getTime();
  if (moveTs - Date.now() <= 24 * 60 * 60 * 1000) {
    throw new Error("LATE_CANCEL_NOT_ALLOWED");
  }

  booking.status = "CANCELLED";
  booking.cancellationReason = "User requested cancellation";
  booking.updatedAt = new Date().toISOString();
  persist();
  return clone(booking);
}

export function rescheduleBooking(
  id: string,
  userId: string,
  nextDate: string,
): BookingRecord | null {
  const booking = findBooking(id);
  if (!booking || booking.userId !== userId) return null;

  const moveTs = new Date(nextDate).getTime();
  if (!Number.isFinite(moveTs)) throw new Error("INVALID_MOVE_DATE");
  if (moveTs - Date.now() <= 24 * 60 * 60 * 1000) {
    throw new Error("LATE_RESCHEDULE_NOT_ALLOWED");
  }

  booking.moveDate = new Date(moveTs).toISOString();
  booking.updatedAt = new Date().toISOString();
  booking.status = booking.paymentStatus === "PAID" ? "CONFIRMED" : "PENDING";
  booking.progressPercent = 0;
  persist();
  return clone(booking);
}

export function getTracking(id: string, userId: string) {
  const booking = findBooking(id);
  if (!booking || booking.userId !== userId) return null;

  const fallback: Coordinate = { lat: 28.61, lng: 77.2 };
  const moveStart = new Date(booking.startedAt ?? booking.updatedAt).getTime();
  const now = Date.now();
  const durationMs = Math.max(booking.etaMinutes * 60 * 1000, 8 * 60 * 1000);

  if (booking.status === "CONFIRMED" && booking.paymentStatus === "PAID") {
    booking.status = "IN_TRANSIT";
    booking.startedAt = booking.startedAt ?? new Date().toISOString();
    booking.updatedAt = now.toISOString();
  }

  let ratio = 0;
  if (booking.status === "IN_TRANSIT") {
    ratio = Math.min(1, (now - moveStart) / durationMs);
    booking.progressPercent = Math.round(ratio * 100);
    if (ratio >= 1) {
      booking.status = "COMPLETED";
      booking.progressPercent = 100;
      booking.completedAt = new Date(now).toISOString();
    }
    booking.updatedAt = new Date(now).toISOString();
  }

  if (booking.status === "COMPLETED") {
    ratio = 1;
  }

  const location = estimateLiveTrackingPoint({
    booking: {
      sourceCoords: booking.sourceCoords,
      destinationCoords: booking.destinationCoords,
    },
    ratio,
    fallback,
  });

  const etaMinutes = Math.max(0, Math.round((1 - ratio) * booking.etaMinutes));
  const payload = {
    bookingId: booking.id,
    status: booking.status,
    progressPercent: booking.progressPercent,
    etaMinutes,
    location,
    currentLat: location.lat,
    currentLng: location.lng,
    updatedAt: booking.updatedAt,
    timeline: [
      { event: "Booked", at: booking.createdAt },
      booking.status !== "PENDING" ? { event: "Payment capture", at: booking.updatedAt } : null,
      booking.status === "IN_TRANSIT" || booking.status === "COMPLETED"
        ? { event: "Vehicle dispatched", at: booking.startedAt ?? booking.updatedAt }
        : null,
      booking.status === "COMPLETED" ? { event: "Delivered", at: booking.completedAt ?? booking.updatedAt } : null,
    ].filter(Boolean),
  };

  persist();
  return { booking: clone(booking), tracking: payload };
}

export function markPayment(bookingId: string, reference: string, status: PaymentStatus) {
  const booking = findBooking(bookingId);
  if (!booking) return null;
  booking.paymentReference = reference;
  booking.paymentStatus = status;
  booking.status =
    status === "PAID"
      ? "CONFIRMED"
      : status === "REFUNDED"
        ? booking.status === "COMPLETED"
          ? "COMPLETED"
          : "CANCELLED"
      : status === "UNPAID"
        ? booking.status
        : "FAILED";
  booking.updatedAt = new Date().toISOString();
  persist();
  return clone(booking);
}

export function createReview(input: {
  bookingId: string;
  userId: string;
  rating: number;
  comment: string;
}): ReviewRecord {
  const db = readState();
  const booking = findBooking(input.bookingId);
  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (booking.userId !== input.userId) {
    throw new Error("NOT_AUTHORIZED");
  }

  const rating = Math.min(5, Math.max(1, Math.floor(input.rating)));
  const review: ReviewRecord = {
    id: crypto.randomUUID(),
    bookingId: input.bookingId,
    userId: input.userId,
    moverId: booking.moverId,
    rating,
    comment: input.comment.trim(),
    createdAt: new Date().toISOString(),
  };

  db.reviews.unshift(review);
  booking.status = "COMPLETED";
  persist();
  return clone(review);
}

export function listReviewsByMover(moverId: string) {
  return getDbSnapshot().reviews.filter((review) => review.moverId === moverId);
}

export function canChatForBooking(bookingId: string, userId: string): boolean {
  const booking = findBooking(bookingId);
  return !!booking && booking.userId === userId;
}
