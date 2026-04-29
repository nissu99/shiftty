import { NextResponse } from "next/server";

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set({
    name,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearCookie(response, "shifty_access");
  clearCookie(response, "shifty_refresh");
  return response;
}
