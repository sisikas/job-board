import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { reorderInstaPosts } from "@/lib/instagram-schedule";

export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  if (!body || !Array.isArray(body.ids) || body.ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }
  await reorderInstaPosts(body.ids);
  return NextResponse.json({ ok: true });
}
