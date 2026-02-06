import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const amount = Number(body.amount ?? 0);

  if (!amount || amount < 1500) {
    return NextResponse.json(
      { error: "Amount must be at least ₹1,500" },
      { status: 400 },
    );
  }

  const reference = `SHIFTY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  return NextResponse.json({ reference, amount }, { status: 201 });
}
