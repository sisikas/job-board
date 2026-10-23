export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-4DQBH8XZR6";

type Gtag = (...args: unknown[]) => void;

type PendingEvent = { name: string; params?: Record<string, string> };

const pending: PendingEvent[] = [];
let started = false;
let lastPage = "";

const PRIVATE_PARAMS = ["q", "city", "country", "location", "token"];

function publicUrl(raw: string) {
  try {
    const url = new URL(raw, location.origin);
    for (const key of PRIVATE_PARAMS) url.searchParams.delete(key);
    const search = url.searchParams.toString();
    return `${url.origin}${url.pathname}${search ? `?${search}` : ""}`;
  } catch {
    return raw.split("?")[0];
  }
}

function gtag(): Gtag | null {
  const fn = (window as Window & { gtag?: Gtag }).gtag;
  return typeof fn === "function" ? fn : null;
}

function flush() {
  const fn = gtag();
  if (!fn) return;
  while (pending.length > 0) {
    const event = pending.shift();
    if (!event) break;
    fn("event", event.name, event.params);
  }
}

export function loadGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || started) return;
  started = true;

  const w = window as Window & { dataLayer?: unknown[]; gtag?: Gtag };
  w.dataLayer = w.dataLayer || [];
  // gtag.js reads the Arguments object. A rest array is ignored.
  w.gtag = function gtagShim() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer?.push(arguments as unknown);
  };
  w.gtag("js", new Date());
  w.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
    page_location: publicUrl(location.href),
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  flush();
}

export function trackGaEvent(name: string, params?: Record<string, string>) {
  if (!GA_MEASUREMENT_ID) return;
  loadGoogleAnalytics();
  const fn = gtag();
  if (!fn) {
    pending.push({ name, params });
    return;
  }
  fn("event", name, params);
}

export function trackPageView(path: string) {
  if (lastPage === path) return;
  lastPage = path;
  const referrer = document.referrer ? publicUrl(document.referrer) : "";
  trackGaEvent("page_view", {
    page_path: path,
    page_location: publicUrl(location.href),
    ...(referrer ? { page_referrer: referrer } : {}),
  });
}
