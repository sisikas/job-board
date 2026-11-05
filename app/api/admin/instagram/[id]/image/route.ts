import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { allowedImageType, getInstaImage, setInstaImage } from "@/lib/instagram-schedule";

const MAX_BYTES = 3_000_000;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const image = await getInstaImage(id);
  if (!image) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return new NextResponse(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.type,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const form = await req.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Choose an image." }, { status: 400 });
  }
  if (image.size <= 0 || image.size > MAX_BYTES) {
    return NextResponse.json({ error: "That image is too large." }, { status: 400 });
  }
  const type = image.type || "image/jpeg";
  if (!allowedImageType(type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP." }, { status: 400 });
  }
  const bytes = Buffer.from(await image.arrayBuffer());
  const post = await setInstaImage(id, bytes, type);
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ post });
}
