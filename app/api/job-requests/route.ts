import { NextResponse } from "next/server";
import { createJobRequest, parseJobRequest } from "@/lib/job-requests";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const input = parseJobRequest(body);
  if (!input) {
    return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
  }

  try {
    await createJobRequest(input);
  } catch {
    return NextResponse.json({ error: "That didn't send. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
