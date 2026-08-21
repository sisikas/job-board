import { NextRequest, NextResponse } from "next/server";
import { checkPassword, sessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  return res;
}
