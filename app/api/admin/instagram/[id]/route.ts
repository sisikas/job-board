import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import {
  deleteInstaPost,
  parseCaption,
  parseInstaDate,
  parseInstaStatus,
  updateInstaPost,
} from "@/lib/instagram-schedule";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    postDate?: unknown;
    caption?: unknown;
    status?: unknown;
  } | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }

  const patch: { postDate?: string; caption?: string; status?: "pending" | "uploaded" } = {};
  if ("postDate" in body) {
    const postDate = parseInstaDate(body.postDate);
    if (!postDate) {
      return NextResponse.json({ error: "Pick a posting date." }, { status: 400 });
    }
    patch.postDate = postDate;
  }
  if ("caption" in body) {
    const caption = parseCaption(body.caption);
    if (caption == null) {
      return NextResponse.json({ error: "That caption is too long." }, { status: 400 });
    }
    patch.caption = caption;
  }
  if ("status" in body) {
    const status = parseInstaStatus(body.status);
    if (!status) {
      return NextResponse.json({ error: "Choose Not yet or Uploaded." }, { status: 400 });
    }
    patch.status = status;
  }
  if (!("postDate" in patch) && !("caption" in patch) && !("status" in patch)) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }

  const post = await updateInstaPost(id, patch);
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ post });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteInstaPost(id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
