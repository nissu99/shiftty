export type CampusNode = {
  name: string;
  lat: number;
  lng: number;
};

export type FleetSummary = {
  activeMovers: number;
  coldStorageTrucks: number;
  etaAccuracyMinutes: number;
};

export const campusNodes: CampusNode[] = [
  { name: "Graphic Era University", lat: 30.2666, lng: 78.0138 },
  { name: "Graphic Era Hill University", lat: 30.2828, lng: 78.0415 },
  { name: "IMS Unison", lat: 30.3561, lng: 77.9947 },
];

export const fleetSummary: FleetSummary = {
  activeMovers: 18,
  coldStorageTrucks: 5,
  etaAccuracyMinutes: 12,
};

export const serviceAreaPolyline = campusNodes.map((node) => [
  node.lat,
  node.lng,
]) as Array<[number, number]>;
