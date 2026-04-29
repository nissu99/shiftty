import { NextResponse } from "next/server";
import { inventoryCatalog } from "@/data/inventoryCatalog";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.toLowerCase().trim() ?? "";
  const list = query
    ? inventoryCatalog.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      )
    : inventoryCatalog;

  return NextResponse.json({
    catalog: list,
    count: list.length,
    totalCategories: Array.from(new Set(list.map((item) => item.category))),
  });
}
