import { NextRequest, NextResponse } from "next/server";
import { deleteJob, updateJob } from "@/lib/jobs";
import { isAuthed } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const job = await updateJob(id, {
    role: body.role,
    venue: body.venue,
    city: body.city,
    country: body.country,
    description: body.description,
    applyMethod: body.applyMethod,
    applyContact: body.applyContact,
    instagramUrl: body.instagramUrl,
    status: body.status,
    postedAt: body.postedAt,
  });

  if (!job) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ job });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteJob(id);
  if (!ok) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
