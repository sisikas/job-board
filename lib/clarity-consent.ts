export const CONSENT_KEY = "tgs_cookie_consent";
export const CONSENT_CHANGE = "tgs-consent-change";

export type ConsentChoice = "granted" | "denied";

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };

function clarityQueue(): ClarityFn {
  const w = window as Window & { clarity?: ClarityFn };
  if (typeof w.clarity !== "function") {
    const queued: ClarityFn = (...args: unknown[]) => {
      (queued.q = queued.q || []).push(args);
    };
    w.clarity = queued;
  }
  return w.clarity;
}

export function trackClaritySignup() {
  clarityQueue()("event", "signup");
}

export function applyClarityConsent(choice: ConsentChoice) {
  const clarity = clarityQueue();
  const state = choice === "granted" ? "granted" : "denied";
  // consentv2 is the signal Clarity requires for EU, UK, and Switzerland.
  clarity("consentv2", { ad_Storage: state, analytics_Storage: state });
  // Older call. Still grants or clears the same cookies.
  clarity("consent", choice === "granted");
}
