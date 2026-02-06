import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const users = await clerkClient.users.getUserList();
  return NextResponse.json(users);
}
