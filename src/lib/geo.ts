export type Coordinate = {
  lat: number;
  lng: number;
};

const EARTH_KM = 6371;

export function haversineDistanceKm(from: Coordinate, to: Coordinate): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lng - from.lng);

  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_KM * c;
}

export function interpolateCoordinate(
  start: Coordinate,
  end: Coordinate,
  ratio: number,
): Coordinate {
  return {
    lat: start.lat + (end.lat - start.lat) * ratio,
    lng: start.lng + (end.lng - start.lng) * ratio,
  };
}

export function formatCoordinates(value: number | undefined | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0.00";
  return value.toFixed(5);
}
