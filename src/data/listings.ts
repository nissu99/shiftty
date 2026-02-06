export type HousingListing = {
  id: string;
  title: string;
  address: string;
  zone: string;
  rent: number;
  coordinates: { lat: number; lng: number };
  capacity: number;
  tags: string[];
  amenities: string[];
  rating: number;
  travelTimeMinutes: number;
};

export const housingListings: HousingListing[] = [
  {
    id: "clement-courtyard",
    title: "Clement Courtyard",
    address: "Opp. Graphic Era Hill University Gate No. 2, Clement Town",
  zone: "Clement Town Gate 2",
    rent: 8500,
    coordinates: { lat: 30.282941, lng: 78.041243 },
    capacity: 3,
    tags: ["quiet", "study-friendly", "single"],
    amenities: ["24/7 water", "Wi-Fi 200 Mbps", "Laundry"],
    rating: 4.8,
    travelTimeMinutes: 6,
  },
  {
    id: "geu-green-homes",
    title: "GEU Green Homes",
    address: "Lane No. 5, Near Graphic Era University, Clement Town",
  zone: "Lane 5 Clement Town",
    rent: 7200,
    coordinates: { lat: 30.268981, lng: 78.011972 },
    capacity: 4,
    tags: ["social", "budget", "shared"],
    amenities: ["Common kitchen", "Gym", "CCTV"],
    rating: 4.5,
    travelTimeMinutes: 12,
  },
  {
    id: "rajpur-rise",
    title: "Rajpur Rise Residences",
    address: "Rajpur Road Extension, Dehradun",
  zone: "Rajpur Road",
    rent: 11000,
    coordinates: { lat: 30.308249, lng: 78.04871 },
    capacity: 2,
    tags: ["premium", "balcony", "privacy"],
    amenities: ["Housekeeping", "Inverter backup", "Café"],
    rating: 4.9,
    travelTimeMinutes: 18,
  },
  {
    id: "doon-duplex",
    title: "Doon Duplex Pods",
    address: "GMS Road, Ballupur Chowk",
  zone: "GMS Road",
    rent: 6200,
    coordinates: { lat: 30.311299, lng: 78.009622 },
    capacity: 6,
    tags: ["ultra-budget", "pods", "community"],
    amenities: ["AR lockers", "Study pods", "Rooftop cinema"],
    rating: 4.2,
    travelTimeMinutes: 22,
  },
];
