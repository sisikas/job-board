import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { listSignups } from "@/lib/users";

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signups = await listSignups();
  const lines = [
    "email,signed_up_utc",
    ...signups.map((s) => `${csvCell(s.email)},${s.createdAt.toISOString()}`),
  ];

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="signups-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
