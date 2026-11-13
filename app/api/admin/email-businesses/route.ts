import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { createEmailBusiness, listEmailBusinesses, parseEmailBusiness } from "@/lib/email-businesses";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const businesses = await listEmailBusinesses();
  return NextResponse.json({ businesses });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const input = parseEmailBusiness(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "Business name and a valid email are required." }, { status: 400 });
  }
  const business = await createEmailBusiness(input);
  return NextResponse.json({ business }, { status: 201 });
}
