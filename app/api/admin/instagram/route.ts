import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import {
  createInstaPost,
  listInstaPosts,
  parseCaption,
  parseInstaDate,
  parseInstaStatus,
} from "@/lib/instagram-schedule";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const posts = await listInstaPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    postDate?: unknown;
    caption?: unknown;
    status?: unknown;
  } | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Pick a posting date." }, { status: 400 });
  }

  const postDate = parseInstaDate(body.postDate);
  if (!postDate) {
    return NextResponse.json({ error: "Pick a posting date." }, { status: 400 });
  }
  const caption = body.caption == null ? "" : parseCaption(body.caption);
  if (caption == null) {
    return NextResponse.json({ error: "That caption is too long." }, { status: 400 });
  }
  const status = body.status == null ? "pending" : parseInstaStatus(body.status);
  if (!status) {
    return NextResponse.json({ error: "Choose Not yet or Uploaded." }, { status: 400 });
  }

  const post = await createInstaPost({ postDate, caption, status });
  return NextResponse.json({ post }, { status: 201 });
}
