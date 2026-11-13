import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { deleteEmailBusiness, parseEmailBusiness, updateEmailBusiness } from "@/lib/email-businesses";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const input = parseEmailBusiness(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "Business name and a valid email are required." }, { status: 400 });
  }
  const business = await updateEmailBusiness(id, input);
  if (!business) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ business });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteEmailBusiness(id);
  if (!ok) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
