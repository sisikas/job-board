import { NextRequest, NextResponse } from "next/server";
import { createJob, getAllJobs, searchJobs } from "@/lib/jobs";
import { isAuthed } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const location = searchParams.get("location") || undefined;
  const admin = searchParams.get("admin");

  if (admin) {
    // admin view: return everything (open + filled), no filtering, must be authed
    if (!(await isAuthed())) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const jobs = await getAllJobs();
    return NextResponse.json({ jobs });
  }

  const jobs = await searchJobs({ q, location });
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();

  if (!body.role || !body.venue || !body.city) {
    return NextResponse.json({ error: "role, venue and city are required" }, { status: 400 });
  }

  const job = await createJob({
    role: body.role,
    venue: body.venue,
    city: body.city,
    country: body.country || "",
    description: body.description || "",
    applyMethod: ["instagram", "email", "link"].includes(body.applyMethod) ? body.applyMethod : "instagram",
    applyContact: body.applyContact || "",
    instagramUrl: body.instagramUrl || "",
    status: body.status === "filled" ? "filled" : "open",
    postedAt: typeof body.postedAt === "string" ? body.postedAt : undefined,
  });

  return NextResponse.json({ job }, { status: 201 });
}
