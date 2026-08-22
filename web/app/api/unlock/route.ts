import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UNLOCK_KEY, GATE_COOKIE, GATE_TOKEN } from "@/lib/gate";

// Handles the key form. Correct key -> set unlock cookie -> show the site.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const key = String(form.get("key") ?? "").trim();

  if (key === UNLOCK_KEY) {
    const res = NextResponse.redirect(new URL("/", request.url), { status: 303 });
    res.cookies.set(GATE_COOKIE, GATE_TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  }

  // Wrong key -> back to the gate with an error flag.
  return NextResponse.redirect(new URL("/?e=1", request.url), { status: 303 });
}
