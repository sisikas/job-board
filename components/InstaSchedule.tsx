"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { todayISODate } from "@/lib/format";
import type { InstaPost, InstaStatus } from "@/lib/instagram-schedule";

const IG_LIMIT = 2200;
const FIELD =
  "w-full rounded-lg border px-2.5 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";
const TEXT_FIELD = FIELD + " border-neutral-200 bg-white";

type FilterId = "all" | InstaStatus;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Not yet" },
  { id: "uploaded", label: "Uploaded" },
];

function comparePosts(a: InstaPost, b: InstaPost) {
  if (a.postDate !== b.postDate) return a.postDate > b.postDate ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt > b.createdAt ? -1 : 1;
  return a.id > b.id ? -1 : 1;
}

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function waitingLine(posts: InstaPost[], today: string) {
  const waiting = posts.filter((post) => post.status === "pending");
  if (waiting.length === 0) return "Nothing waiting to be posted.";
  const oldest = waiting.reduce((soonest, post) => (post.postDate < soonest.postDate ? post : soonest));
  const count = `${waiting.length} still to post`;
  if (oldest.postDate < today) return `${count}. Oldest is ${formatDay(oldest.postDate)}.`;
  if (oldest.postDate === today) return `${count}. Next is today.`;
  return `${count}. Next is ${formatDay(oldest.postDate)}.`;
}

function imageSrc(post: InstaPost) {
  return `/api/admin/instagram/${post.id}/image?v=${encodeURIComponent(post.updatedAt)}`;
}

function ProfileGrid({
  posts,
  onPreview,
}: {
  posts: InstaPost[];
  onPreview: (src: string, caption: string) => void;
}) {
  const tiles = posts.filter((post) => post.hasImage);

  return (
    <section aria-label="Instagram grid">
      <p className="text-xs text-neutral-500">Newest posting date at the top left, in the same 4:5 shape as the photos.</p>
      {tiles.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">Add an image to a post to see it here.</p>
      ) : (
        <div className="mt-3 grid w-full max-w-xl grid-cols-3 gap-1">
          {tiles.map((post) => {
            const src = imageSrc(post);
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => onPreview(src, post.caption)}
                aria-label={`View post from ${formatDay(post.postDate)}`}
                className="aspect-[4/5] overflow-hidden bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function dateHint(postDate: string, status: InstaStatus, today: string) {
  if (status !== "pending") return "";
  if (postDate === today) return "Today";
  if (postDate < today) return "Still to post";
  return "";
}

async function readError(res: Response) {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error !== "unauthorized") return data.error;
  } catch {
    // The response was not JSON.
  }
  return "Something went wrong. Try again.";
}

function unauthorized(res: Response) {
  return res.status === 401;
}

async function prepareInstaImage(file: File): Promise<Blob> {
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Use an image file.");
  }
  if (file.size > 25_000_000) {
    throw new Error("That image is too large. Try one under 25 MB.");
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Couldn't read that image. Save it as a JPG or PNG and try again.");
  }
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't read that image. Save it as a JPG or PNG and try again.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) throw new Error("Couldn't read that image. Save it as a JPG or PNG and try again.");
    return blob;
  } finally {
    bitmap.close();
  }
}

function fileFromClipboard(event: ClipboardEvent<HTMLElement>): File | null {
  const list = event.clipboardData?.files;
  if (list && list.length > 0) return list[0];
  const items = event.clipboardData?.items;
  if (!items) return null;
  for (const item of items) {
    if (item.kind === "file") return item.getAsFile();
  }
  return null;
}

function CaptionCount({ value }: { value: string }) {
  if (value.length < 1800) return null;
  const over = value.length > IG_LIMIT;
  return (
    <p className={over ? "text-amber-800" : "text-neutral-400"}>
      {value.length.toLocaleString("en-GB")} / 2,200
      {over ? " · Instagram stops at 2,200 characters." : ""}
    </p>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    const value = text;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) return;
    }
    setCopied(true);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      disabled={!text.trim()}
      aria-label={copied ? "Caption copied" : "Copy caption"}
      className={
        "shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 " +
        (copied
          ? "border-[#7eaf4a] bg-[#e7f6d4] text-[#2f5c16]"
          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50")
      }
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ImageGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-neutral-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1.4" />
      <path d="M7 16l3.2-3.2a1 1 0 0 1 1.4 0L16 17" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.5 7l1 13h9l1-13" />
    </svg>
  );
}

function ImageWell({
  src,
  busy,
  error,
  onFile,
  onPreview,
  onClear,
}: {
  src: string | null;
  busy: boolean;
  error: string;
  onFile: (file: File) => void;
  onPreview?: () => void;
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function choose(file: File | null | undefined) {
    if (!file) return;
    onFile(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    choose(event.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={
          "relative aspect-[4/5] w-[9rem] overflow-hidden rounded-lg border " +
          (src ? "border-neutral-200 bg-neutral-100 " : "border-dashed border-neutral-300 bg-neutral-50 ") +
          (dragOver ? "ring-2 ring-neutral-900 ring-offset-2" : "")
        }
      >
        {src ? (
          <button
            type="button"
            onClick={onPreview}
            className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            aria-label="View image"
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            aria-label="Add image"
          >
            <ImageGlyph />
            <span className="text-[11px] leading-tight text-neutral-500">Add image</span>
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-[11px] text-neutral-600">
            Saving…
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      {src && (
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            Replace
          </button>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs leading-snug text-red-700">{error}</p>}
    </div>
  );
}

function statusClass(status: InstaStatus) {
  return status === "uploaded"
    ? "border-[#7eaf4a] bg-[#e7f6d4] text-[#2f5c16]"
    : "border-[#e4d3a1] bg-[#fff6dd] text-[#6a5018]";
}

function Lightbox({
  src,
  caption,
  onClose,
}: {
  src: string;
  caption: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instagram post"
        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-3 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <img src={src} alt="" className="mx-auto max-h-[68vh] w-full rounded-lg bg-neutral-100 object-contain" />
        {caption.trim() && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-800">{caption}</p>
        )}
        <div className="mt-3 flex justify-end gap-2">
          {caption.trim() && <CopyButton text={caption} />}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PostRow({
  post,
  today,
  onUpdated,
  onRemove,
  onPreview,
  onUnauthorized,
}: {
  post: InstaPost;
  today: string;
  onUpdated: (post: InstaPost) => void;
  onRemove: (post: InstaPost) => void;
  onPreview: (src: string, caption: string) => void;
  onUnauthorized: () => void;
}) {
  const [caption, setCaption] = useState(post.caption);
  const [postDate, setPostDate] = useState(post.postDate);
  const [status, setStatus] = useState<InstaStatus>(post.status);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const timer = useRef<number | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);
  const captionRef = useRef(post.caption);
  const dateRef = useRef(post.postDate);
  const statusRef = useRef<InstaStatus>(post.status);
  const saved = useRef({ caption: post.caption, postDate: post.postDate, status: post.status });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      const body = {
        caption: captionRef.current,
        postDate: dateRef.current,
        status: statusRef.current,
      };
      if (
        body.caption === saved.current.caption &&
        body.postDate === saved.current.postDate &&
        body.status === saved.current.status
      ) {
        return;
      }
      void fetch(`/api/admin/instagram/${post.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      });
    };
  }, [post.id]);

  useEffect(() => {
    if (saving !== "saved") return;
    const timeout = window.setTimeout(() => {
      if (mounted.current) setSaving("idle");
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [saving]);

  useEffect(() => {
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [localUrl]);

  const enqueue = useCallback(() => {
    const run = chain.current.then(async () => {
      const body = {
        caption: captionRef.current,
        postDate: dateRef.current,
        status: statusRef.current,
      };
      if (
        body.caption === saved.current.caption &&
        body.postDate === saved.current.postDate &&
        body.status === saved.current.status
      ) {
        return;
      }
      if (mounted.current) {
        setSaving("saving");
        setSaveError("");
      }
      const res = await fetch(`/api/admin/instagram/${post.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (unauthorized(res)) {
        onUnauthorized();
        return;
      }
      if (!res.ok) {
        if (mounted.current) {
          setSaving("error");
          setSaveError(await readError(res));
        }
        return;
      }
      const data = (await res.json()) as { post: InstaPost };
      saved.current = body;
      onUpdated(data.post);
      if (mounted.current) setSaving("saved");
    });
    chain.current = run.then(
      () => undefined,
      () => undefined
    );
  }, [onUnauthorized, onUpdated, post.id]);

  function queueCaption(value: string) {
    setCaption(value);
    captionRef.current = value;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => enqueue(), 700);
  }

  function blurCaption() {
    if (timer.current) window.clearTimeout(timer.current);
    enqueue();
  }

  function changeDate(value: string) {
    setPostDate(value);
    dateRef.current = value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) enqueue();
  }

  function blurDate() {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateRef.current)) return;
    dateRef.current = saved.current.postDate;
    setPostDate(saved.current.postDate);
  }

  function changeStatus(value: InstaStatus) {
    setStatus(value);
    statusRef.current = value;
    enqueue();
  }

  async function attachImage(file: File) {
    setImageError("");
    setImageBusy(true);
    let blob: Blob;
    try {
      blob = await prepareInstaImage(file);
    } catch (err) {
      setImageBusy(false);
      setImageError(err instanceof Error ? err.message : "Couldn't save that image.");
      return;
    }
    const url = URL.createObjectURL(blob);
    setLocalUrl(url);
    try {
      const body = new FormData();
      body.set("image", blob, "post.jpg");
      const res = await fetch(`/api/admin/instagram/${post.id}/image`, { method: "PUT", body });
      if (unauthorized(res)) {
        onUnauthorized();
        return;
      }
      if (!res.ok) throw new Error(await readError(res));
      const data = (await res.json()) as { post: InstaPost };
      onUpdated(data.post);
    } catch (err) {
      setLocalUrl(null);
      setImageError(err instanceof Error ? err.message : "Couldn't save that image.");
    } finally {
      setImageBusy(false);
    }
  }

  const src = localUrl ?? (post.hasImage ? imageSrc(post) : null);
  const hint = dateHint(postDate, status, today);

  return (
    <article
      id={`insta-${post.id}`}
      role="row"
      onPaste={(event) => {
        const file = fileFromClipboard(event);
        if (!file) return;
        event.preventDefault();
        void attachImage(file);
      }}
      className={
        "grid grid-cols-1 gap-3 border-t border-l-4 p-4 md:grid-cols-[9rem_12.5rem_minmax(0,1fr)_10.5rem_2.25rem] md:items-start md:gap-4 " +
        (status === "uploaded" ? "border-l-[#7eaf4a]" : "border-l-[#e4d3a1]")
      }
    >
      <div role="cell">
        <span className="mb-1 block text-xs font-medium text-neutral-500 md:hidden">Image</span>
        <ImageWell
          src={src}
          busy={imageBusy}
          error={imageError}
          onFile={(file) => void attachImage(file)}
          onPreview={src ? () => onPreview(src, captionRef.current) : undefined}
        />
      </div>
      <div role="cell">
        <span className="mb-1 block text-xs font-medium text-neutral-500 md:hidden">Posting date</span>
        <input
          type="date"
          value={postDate}
          onChange={(event) => changeDate(event.target.value)}
          onBlur={blurDate}
          aria-label="Posting date"
          className={TEXT_FIELD}
        />
        <p className={"mt-1 min-h-4 text-xs " + (hint === "Still to post" ? "text-amber-800" : "text-neutral-500")}>
          {hint}
        </p>
      </div>
      <div role="cell" className="min-w-0">
        <span className="mb-1 block text-xs font-medium text-neutral-500 md:hidden">Caption</span>
        <div className="flex items-start gap-2">
          <textarea
            value={caption}
            onChange={(event) => queueCaption(event.target.value)}
            onBlur={blurCaption}
            rows={3}
            placeholder="Caption to paste into Instagram"
            aria-label="Caption"
            className={TEXT_FIELD + " min-h-24 flex-1 resize-y"}
          />
          <CopyButton text={caption} />
        </div>
        <div className="mt-1 flex min-h-4 items-start justify-between gap-3 text-xs">
          <CaptionCount value={caption} />
          <p
            className={"ml-auto shrink-0 " + (saving === "error" ? "text-red-700" : "text-neutral-400")}
            aria-live="polite"
          >
            {saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : saving === "error" ? saveError || "Couldn't save" : ""}
          </p>
        </div>
      </div>
      <div role="cell">
        <span className="mb-1 block text-xs font-medium text-neutral-500 md:hidden">Status</span>
        <select
          value={status}
          onChange={(event) => changeStatus(event.target.value as InstaStatus)}
          aria-label="Status"
          className={FIELD + " font-medium " + statusClass(status)}
        >
          <option value="pending">Not yet</option>
          <option value="uploaded">Uploaded</option>
        </select>
      </div>
      <div role="cell" className="md:pt-1">
        {confirmRemove ? (
          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={() => onRemove(post)}
              className="text-xs font-medium text-red-700 hover:text-red-900"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Remove post"
            onClick={() => setConfirmRemove(true)}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </article>
  );
}

export function InstaSchedule() {
  const router = useRouter();
  const onUnauthorized = useCallback(() => {
    router.push("/admin");
    router.refresh();
  }, [router]);
  const today = todayISODate();
  const [posts, setPosts] = useState<InstaPost[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadId, setLoadId] = useState(0);
  const [filter, setFilter] = useState<FilterId>("all");
  const [view, setView] = useState<"grid" | "schedule">("schedule");
  const [notice, setNotice] = useState("");
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const [postDate, setPostDate] = useState(today);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<InstaStatus>("pending");
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [formError, setFormError] = useState("");
  const [adding, setAdding] = useState(false);
  const captionInput = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/instagram");
        if (unauthorized(res)) {
        onUnauthorized();
        return;
      }
        if (!res.ok) throw new Error(await readError(res));
        const data = (await res.json()) as { posts: InstaPost[] };
        if (!cancel) {
          setPosts(data.posts);
          setLoadError("");
        }
      } catch (err) {
        if (!cancel) {
          setLoadError(err instanceof Error ? err.message : "Couldn't load the schedule.");
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [loadId, onUnauthorized]);

  function applyPost(next: InstaPost) {
    setPosts((prev) => {
      if (!prev || !prev.some((post) => post.id === next.id)) return prev;
      return prev.map((post) => (post.id === next.id ? next : post)).sort(comparePosts);
    });
  }

  function removePost(post: InstaPost) {
    setPosts((prev) => (prev ? prev.filter((item) => item.id !== post.id) : prev));
    void (async () => {
      const res = await fetch(`/api/admin/instagram/${post.id}`, { method: "DELETE" });
      if (unauthorized(res)) {
        onUnauthorized();
        return;
      }
      if (!res.ok) {
        setPosts((prev) => (prev ? [...prev, post].sort(comparePosts) : [post]));
        setNotice("That post is still here. Try removing it again.");
      }
    })();
  }

  function clearPreview() {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  async function takeComposerFile(file: File) {
    setImageError("");
    setImageBusy(true);
    try {
      const blob = await prepareInstaImage(file);
      const url = URL.createObjectURL(blob);
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { url, blob };
      });
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Couldn't read that image.");
    } finally {
      setImageBusy(false);
    }
  }

  async function addPost(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(postDate)) {
      setFormError("Pick a posting date.");
      return;
    }
    setAdding(true);
    setFormError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/instagram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postDate, caption, status }),
      });
      if (unauthorized(res)) {
        onUnauthorized();
        return;
      }
      if (!res.ok) throw new Error(await readError(res));
      let created = ((await res.json()) as { post: InstaPost }).post;
      const shot = preview;
      if (shot) {
        const body = new FormData();
        body.set("image", shot.blob, "post.jpg");
        const imageRes = await fetch(`/api/admin/instagram/${created.id}/image`, { method: "PUT", body });
        if (unauthorized(imageRes)) {
          onUnauthorized();
          return;
        }
        if (!imageRes.ok) {
          setPosts((prev) => (prev ? [...prev, created].sort(comparePosts) : [created]));
          setNotice("The post is in the schedule. Add the image on its row.");
        } else {
          created = ((await imageRes.json()) as { post: InstaPost }).post;
          setPosts((prev) => (prev ? [...prev, created].sort(comparePosts) : [created]));
        }
      } else {
        setPosts((prev) => (prev ? [...prev, created].sort(comparePosts) : [created]));
      }
      const id = created.id;
      if (filter !== "all" && filter !== created.status) setFilter("all");
      setCaption("");
      setStatus("pending");
      clearPreview();
      setImageError("");
      requestAnimationFrame(() => {
        document.getElementById(`insta-${id}`)?.scrollIntoView({ block: "nearest" });
        captionInput.current?.focus();
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't add that post.");
    } finally {
      setAdding(false);
    }
  }

  if (posts === null) {
    return loadError ? (
      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-8 text-sm text-neutral-700">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoadError("");
            setLoadId((value) => value + 1);
          }}
          className="mt-3 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Retry
        </button>
      </div>
    ) : (
      <p className="text-sm text-neutral-500">Loading the schedule…</p>
    );
  }

  const visible = posts.filter((post) => filter === "all" || post.status === filter);

  return (
    <div>
      {notice && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
          {notice}
        </p>
      )}

      <form
        onSubmit={(event) => void addPost(event)}
        onPaste={(event) => {
          const file = fileFromClipboard(event);
          if (!file) return;
          event.preventDefault();
          void takeComposerFile(file);
        }}
        className="rounded-xl border border-neutral-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold text-neutral-900">New post</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-[9rem_12.5rem_minmax(0,1fr)_10.5rem] md:items-start">
          <div>
            <span className="mb-1 block text-xs font-medium text-neutral-500">Image</span>
            <ImageWell
              src={preview?.url ?? null}
              busy={imageBusy}
              error={imageError}
              onFile={(file) => void takeComposerFile(file)}
              onPreview={
                preview ? () => setLightbox({ src: preview.url, caption }) : undefined
              }
              onClear={clearPreview}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="insta-new-date">
              Posting date
            </label>
            <input
              id="insta-new-date"
              type="date"
              required
              value={postDate}
              onChange={(event) => setPostDate(event.target.value)}
              className={TEXT_FIELD}
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="insta-new-caption">
              Caption
            </label>
            <div className="flex items-start gap-2">
              <textarea
                id="insta-new-caption"
                ref={captionInput}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                rows={3}
                placeholder="Caption to paste into Instagram"
                className={TEXT_FIELD + " min-h-24 flex-1 resize-y"}
              />
              <CopyButton text={caption} />
            </div>
            <div className="mt-1 min-h-4 text-xs">
              <CaptionCount value={caption} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="insta-new-status">
              Status
            </label>
            <select
              id="insta-new-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as InstaStatus)}
              className={FIELD + " font-medium " + statusClass(status)}
            >
              <option value="pending">Not yet</option>
              <option value="uploaded">Uploaded</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {formError ? (
            <p className="text-sm text-red-700" role="alert">
              {formError}
            </p>
          ) : (
            <p className="text-xs text-neutral-500">You can add the image later. Drop it, paste it, or browse.</p>
          )}
          <button
            type="submit"
            disabled={adding || imageBusy || !postDate}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add post"}
          </button>
        </div>
      </form>

      <div role="tablist" aria-label="Instagram views" className="mt-5 inline-flex rounded-xl bg-neutral-100 p-1">
        {(
          [
            ["schedule", "Schedule"],
            ["grid", "Grid"],
          ] as const
        ).map(([id, label]) => {
          const selected = view === id;
          return (
            <button
              key={id}
              id={`insta-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`insta-panel-${id}`}
              onClick={() => setView(id)}
              className={
                selected
                  ? "rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-lg px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-white"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <div id="insta-panel-grid" role="tabpanel" aria-labelledby="insta-tab-grid" hidden={view !== "grid"} className="mt-4">
        <ProfileGrid
          posts={posts}
          onPreview={(src, text) => setLightbox({ src, caption: text })}
        />
      </div>

      <div id="insta-panel-schedule" role="tabpanel" aria-labelledby="insta-tab-schedule" hidden={view !== "schedule"}>
      <div className="mt-5 mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">{waitingLine(posts, today)}</p>
        <div role="group" aria-label="Filter posts" className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const count =
              item.id === "all" ? posts.length : posts.filter((post) => post.status === item.id).length;
            const selected = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(item.id)}
                className={
                  "rounded-full border px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 " +
                  (selected
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100")
                }
              >
                {item.label} {count}
              </button>
            );
          })}
        </div>
      </div>

      <section
        role="table"
        aria-label="Scheduled posts"
        className="overflow-x-auto rounded-xl border border-neutral-200 bg-white"
      >
        <div
          role="row"
          className="hidden border-l-4 border-l-transparent px-4 py-3 text-xs font-medium text-neutral-500 md:grid md:grid-cols-[9rem_12.5rem_minmax(0,1fr)_10.5rem_2.25rem] md:gap-4"
        >
          <div role="columnheader">Image</div>
          <div role="columnheader">Posting date</div>
          <div role="columnheader">Caption</div>
          <div role="columnheader">Status</div>
          <div role="columnheader">
            <span className="sr-only">Remove</span>
          </div>
        </div>
        {visible.length === 0 ? (
          <p className="border-t border-neutral-100 px-4 py-10 text-center text-sm text-neutral-500">
            {posts.length === 0 ? "Nothing scheduled yet." : "Nothing in this view."}
          </p>
        ) : (
          visible.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              today={today}
              onUpdated={applyPost}
              onRemove={removePost}
              onUnauthorized={onUnauthorized}
              onPreview={(src, text) => setLightbox({ src, caption: text })}
            />
          ))
        )}
      </section>
      </div>

      {lightbox && <Lightbox src={lightbox.src} caption={lightbox.caption} onClose={closeLightbox} />}
    </div>
  );
}
