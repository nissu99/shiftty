export type InventoryCategory =
  | "furniture"
  | "electronics"
  | "kitchenware"
  | "boxes"
  | "other";

export type InventorySeedItem = {
  id: string;
  name: string;
  category: InventoryCategory;
  fragileDefault: boolean;
  approximateVolume: number;
};

export const inventoryCatalog: InventorySeedItem[] = [
  {
    id: "king_bed",
    name: "King-size bed",
    category: "furniture",
    fragileDefault: false,
    approximateVolume: 4.5,
  },
  {
    id: "double_bed",
    name: "Double bed",
    category: "furniture",
    fragileDefault: false,
    approximateVolume: 3.5,
  },
  {
    id: "sofa",
    name: "3-seater sofa",
    category: "furniture",
    fragileDefault: false,
    approximateVolume: 2.8,
  },
  {
    id: "bookshelf",
    name: "Wooden bookshelf",
    category: "furniture",
    fragileDefault: false,
    approximateVolume: 2.2,
  },
  {
    id: "dining_set",
    name: "Dining table + chairs",
    category: "furniture",
    fragileDefault: false,
    approximateVolume: 3.1,
  },
  {
    id: "refrigerator",
    name: "Refrigerator",
    category: "electronics",
    fragileDefault: true,
    approximateVolume: 2.8,
  },
  {
    id: "washing_machine",
    name: "Washing machine",
    category: "electronics",
    fragileDefault: true,
    approximateVolume: 1.7,
  },
  {
    id: "microwave",
    name: "Microwave oven",
    category: "electronics",
    fragileDefault: true,
    approximateVolume: 0.4,
  },
  {
    id: "laptop",
    name: "Laptop / desktop",
    category: "electronics",
    fragileDefault: true,
    approximateVolume: 0.2,
  },
  {
    id: "led_tv",
    name: "LED TV",
    category: "electronics",
    fragileDefault: true,
    approximateVolume: 0.6,
  },
  {
    id: "dinner_set",
    name: "Dinner set",
    category: "kitchenware",
    fragileDefault: true,
    approximateVolume: 0.3,
  },
  {
    id: "pressure_cooker",
    name: "Pressure cooker",
    category: "kitchenware",
    fragileDefault: true,
    approximateVolume: 0.15,
  },
  {
    id: "nonfragile_boxes",
    name: "Non-fragile boxes",
    category: "boxes",
    fragileDefault: false,
    approximateVolume: 0.2,
  },
  {
    id: "glassware",
    name: "Glassware cartons",
    category: "boxes",
    fragileDefault: true,
    approximateVolume: 0.25,
  },
  {
    id: "books",
    name: "Books and stationery",
    category: "other",
    fragileDefault: false,
    approximateVolume: 0.9,
  },
  {
    id: "fitness",
    name: "Treadmill / dumbbells",
    category: "other",
    fragileDefault: false,
    approximateVolume: 1.8,
  },
];

export function toInventoryRowLabel(item: InventorySeedItem) {
  return `${item.name} (${item.category})`;
}
