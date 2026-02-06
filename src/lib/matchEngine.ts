import { differenceInCalendarDays } from "date-fns";
import { housingListings, type HousingListing } from "@/data/listings";

export type MoveVibe = "focus" | "balanced" | "social";
export type LuggageVolume = "light" | "medium" | "heavy";

export type StudentProfile = {
  budget: number;
  moveDate: string;
  luggage: LuggageVolume;
  vibe: MoveVibe;
  sourceArea: string;
  destinationArea: string;
};

export type Recommendation = HousingListing & {
  score: number;
  rationale: string[];
  routeSummary?: string;
};

const vibeBoost: Record<MoveVibe, string[]> = {
  focus: ["quiet", "study-friendly", "privacy"],
  balanced: ["balcony", "shared", "community"],
  social: ["social", "community", "pods"],
};

const luggageCapacityWeight: Record<LuggageVolume, number> = {
  light: 1,
  medium: 2,
  heavy: 3,
};

const rentPenaltyPerThousand = 6;
const travelBonusPerMinute = 1.5;

function normalizeLocation(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function zoneMatchScore(listingZone: string, targetArea: string) {
  const normalizedZone = normalizeLocation(listingZone);
  const normalizedTarget = normalizeLocation(targetArea);
  if (!normalizedTarget) return 0;
  if (
    normalizedZone.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedZone)
  ) {
    return 12;
  }
  const zoneTokens = new Set(normalizedZone.split(" "));
  const overlap = normalizedTarget
    .split(" ")
    .filter((token) => zoneTokens.has(token));
  return overlap.length * 4;
}

export function recommendListings(
  profile: StudentProfile,
  listings: HousingListing[] = housingListings,
  topN = 3,
): Recommendation[] {
  const moveInDays = Math.max(
    differenceInCalendarDays(new Date(profile.moveDate), new Date()),
    0,
  );
  const normalizedSource = normalizeLocation(profile.sourceArea);
  const normalizedDestination = normalizeLocation(profile.destinationArea);

  return listings
    .map((listing) => {
      let score = 50;
      const rationale: string[] = [];

      // Budget influence
      const deviation = listing.rent - profile.budget;
      score -= (deviation / 1000) * rentPenaltyPerThousand;
      if (deviation <= 0) {
        rationale.push("Within your budget comfort zone");
      } else if (deviation < 1500) {
        rationale.push("Slightly above budget but higher comfort");
      }

      // Travel time weight (prefer closer)
      score += (25 - listing.travelTimeMinutes) * travelBonusPerMinute;
      if (listing.travelTimeMinutes <= 10) {
        rationale.push("Quick bike ride to campus");
      }

      // Vibe matching
      const vibeTags = vibeBoost[profile.vibe];
      const matchedTags = listing.tags.filter((tag) => vibeTags.includes(tag));
      score += matchedTags.length * 8;
      if (matchedTags.length) {
        rationale.push(`Matches your ${profile.vibe} vibe`);
      }

      // Luggage support via capacity proxy
      if (listing.capacity * 1.2 >= luggageCapacityWeight[profile.luggage]) {
        score += 5;
        rationale.push("Enough storage for your luggage load");
      }

      // Move-in urgency (prefer ready-to-move for short lead time)
      if (moveInDays <= 7 && listing.capacity <= 3) {
        score += 4;
        rationale.push("Fast handover possible for urgent move");
      }

      // Destination alignment (strong signal)
      const destinationBoost = zoneMatchScore(listing.zone, profile.destinationArea);
      if (destinationBoost > 0) {
        score += destinationBoost;
        rationale.push("Aligned with your desired destination zone");
      } else if (normalizedDestination) {
        score -= 6;
        rationale.push("Outside your declared destination, but still viable");
      }

      // Source convenience (light boost when staying nearby)
      const sourceOverlap = zoneMatchScore(listing.zone, profile.sourceArea);
      if (sourceOverlap >= 8) {
        score += 4;
        rationale.push("Minimal logistics from your current location");
      }

      const routeSummary =
        normalizedSource || normalizedDestination
          ? `${profile.sourceArea || "Pickup TBD"} → ${listing.zone}`
          : undefined;

      return {
        ...listing,
        score: Math.round(score),
        rationale,
        routeSummary,
      } satisfies Recommendation;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
