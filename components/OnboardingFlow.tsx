"use client";

/**
 * The Good Sort — post-sign-up onboarding (Option A, final)
 * Step 1: roles · Step 2: locations · Step 3: email alerts opt-in · Done
 *
 * Self-contained: no external UI libs, styles are inline objects so it
 * drops into any React / Next.js app. Wire `onComplete` to your backend.
 * Colours and type follow the site: Bricolage Grotesque and the brand
 * tokens in app/globals.css.
 */

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

export type OnboardingResult = {
  roles: string[];
  locations: string[];
  emailAlerts: boolean;
};

type Props = {
  onComplete?: (result: OnboardingResult) => void | Promise<void>;
  jobsHref?: string;
  roles?: string[];
  locationSuggestions?: string[];
};

const DEFAULT_ROLES = [
  "Chef", "Head Chef", "Sous Chef", "Chef de Partie", "Line Cook",
  "Pastry Chef", "Baker", "Barista", "Kitchen Team",
];

const DEFAULT_PLACES = ["Anywhere", "London", "Dublin", "Calgary", "Toronto"];

/* ---------- design tokens (site brand) ---------- */
const c = {
  bg: "#fff",
  ink: "var(--brand-ink)",
  muted: "var(--brand-muted)",
  subtle: "var(--brand-muted)",
  line: "var(--brand-card-border)",
  chipLine: "var(--brand-input-border)",
  soft: "var(--brand-cream)",
  olive: "var(--brand-logo-green)",
  brick: "var(--brand-brick)",
  surface: "var(--brand-card)",
  onFill: "#fff",
  disabledBg: "var(--brand-card-border)",
  disabledInk: "var(--brand-muted)",
};

function joinNice(a: string[]) {
  if (a.length <= 1) return a.join("");
  return a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
}

function matchingJobsHref(
  roles: string[],
  places: string[],
  roleOptions: string[],
  fallback: string
) {
  if (roles.length === 0 && places.length === 0) return fallback;
  const params = new URLSearchParams();
  for (const role of roles) {
    const preset = roleOptions.some((option) => option.toLowerCase() === role.toLowerCase());
    params.append(preset ? "role" : "roleText", role);
  }
  for (const place of places) params.append("place", place);
  return `/?${params.toString()}`;
}

export default function OnboardingFlow({
  onComplete,
  jobsHref = "/",
  roles: roleOptions = DEFAULT_ROLES,
  locationSuggestions = DEFAULT_PLACES,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [roles, setRoles] = useState<string[]>([]);
  const [places, setPlaces] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [roleDraft, setRoleDraft] = useState("");
  const [alerts, setAlerts] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const addPlace = (v: string) => {
    const t = v.trim();
    if (!t || places.some((p) => p.toLowerCase() === t.toLowerCase())) return;
    setPlaces([...places, t]);
    setQuery("");
  };

  const addRole = (v: string) => {
    const typed = v.trim().slice(0, 80);
    if (!typed) return;
    const preset = roleOptions.find((option) => option.toLowerCase() === typed.toLowerCase());
    const value = preset ?? typed;
    if (!roles.some((role) => role.toLowerCase() === value.toLowerCase())) {
      setRoles([...roles, value]);
    }
    setRoleDraft("");
  };

  const customRoles = roles.filter(
    (role) => !roleOptions.some((option) => option.toLowerCase() === role.toLowerCase())
  );
  const roleDraftTrimmed = roleDraft.trim();

  const q = query.trim();
  const ql = q.toLowerCase();
  const suggestions = useMemo(
    () =>
      locationSuggestions
        .filter((p) => !places.includes(p) && (!ql || p.toLowerCase().includes(ql)))
        .slice(0, 8),
    [locationSuggestions, places, ql]
  );
  const showCustom =
    !!q &&
    !locationSuggestions.some((p) => p.toLowerCase() === ql) &&
    !places.some((p) => p.toLowerCase() === ql);

  const cantContinue =
    (step === 1 && roles.length === 0) || (step === 2 && places.length === 0);

  const finish = async (emailAlerts: boolean) => {
    setAlerts(emailAlerts);
    setSaving(true);
    try {
      await onComplete?.({ roles, locations: places, emailAlerts });
    } finally {
      setSaving(false);
      setStep(4);
    }
  };

  const firstRole = roles[0]?.toLowerCase() ?? "sous chef";
  const firstPlace =
    places[0] && places[0] !== "Anywhere" ? places[0].split(",")[0] : "Cardiff";

  return (
    <div style={s.page}>
      <div style={s.shell}>
        {/* header */}
        <div style={s.header}>
          <div style={{ width: 44, height: 44 }}>
            {step > 1 && step < 4 && (
              <button
                type="button"
                aria-label="Back"
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                style={s.iconBtn}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
          </div>
          <div style={s.stepLabel}>{step < 4 ? `${step} of 3` : ""}</div>
        </div>

        {/* progress */}
        <div style={s.progress} aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{ ...s.seg, background: n <= Math.min(step, 3) ? c.brick : c.line }}
            />
          ))}
        </div>

        {/* STEP 1 — roles */}
        {step === 1 && (
          <div style={s.body}>
            <p style={s.eyebrow}>Welcome in</p>
            <h1 style={s.h1}>What kind of kitchen work are you after?</h1>
            <p style={s.lead}>Pick as many as you like. We&apos;ll only send you jobs that match.</p>
            <div style={s.chipWrap}>
              {roleOptions.map((r) => {
                const on = roles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(roles, setRoles, r)}
                    style={{ ...s.chip, ...(on ? s.chipOn : s.chipOff) }}
                  >
                    {r}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={otherOpen}
                aria-expanded={otherOpen}
                onClick={() => setOtherOpen((open) => !open)}
                style={{ ...s.chip, ...(otherOpen ? s.chipOn : s.chipOff) }}
              >
                Other
              </button>
            </div>
            {customRoles.length > 0 && (
              <div style={{ ...s.chipWrap, gap: 8, marginTop: 14 }}>
                {customRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    aria-label={`Remove ${role}`}
                    onClick={() => toggle(roles, setRoles, role)}
                    style={s.selectedPlace}
                  >
                    {role}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
            {otherOpen && (
              <div style={{ marginTop: 16 }}>
                <label htmlFor="onb-role" style={s.label}>Type a role</label>
                <div style={s.inputWrap}>
                  <input
                    id="onb-role"
                    type="text"
                    value={roleDraft}
                    autoComplete="off"
                    maxLength={80}
                    placeholder="e.g. Sommelier, pizza chef"
                    onChange={(e) => setRoleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRole(roleDraft);
                      }
                    }}
                    style={s.input}
                  />
                </div>
                {roleDraftTrimmed && (
                  <button type="button" onClick={() => addRole(roleDraft)} style={{ ...s.customChip, marginTop: 10 }}>
                    + Add “{roleDraftTrimmed}”
                  </button>
                )}
              </div>
            )}
            <div style={{ flex: 1 }} />
            <PrimaryButton disabled={cantContinue} onClick={() => setStep(2)}>
              Continue
            </PrimaryButton>
          </div>
        )}

        {/* STEP 2 — locations */}
        {step === 2 && (
          <div style={s.body}>
            <h1 style={s.h1}>Where would you like to work?</h1>
            <p style={s.lead}>Add cities or countries. Choose Anywhere if you&apos;re happy to move.</p>
            <label htmlFor="onb-loc" style={s.label}>City or country</label>
            <div style={s.inputWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.subtle} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                id="onb-loc"
                type="text"
                value={query}
                autoComplete="off"
                placeholder="e.g. Lisbon, Cardiff, Japan"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPlace(query);
                  }
                }}
                style={s.input}
              />
            </div>

            {places.length > 0 && (
              <div style={{ ...s.chipWrap, gap: 8, marginTop: 14 }}>
                {places.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-label={`Remove ${p}`}
                    onClick={() => toggle(places, setPlaces, p)}
                    style={s.selectedPlace}
                  >
                    {p}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            <p style={s.smallLabel}>{q ? "Matches" : "Suggestions"}</p>
            <div style={{ ...s.chipWrap, gap: 8 }}>
              {showCustom && (
                <button type="button" onClick={() => addPlace(q)} style={s.customChip}>
                  + Add “{q}”
                </button>
              )}
              {suggestions.map((p) => (
                <button key={p} type="button" onClick={() => addPlace(p)} style={s.suggestChip}>
                  + {p}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <PrimaryButton disabled={cantContinue} onClick={() => setStep(3)}>
              Continue
            </PrimaryButton>
          </div>
        )}

        {/* STEP 3 — email alerts */}
        {step === 3 && (
          <div style={s.body}>
            <h1 style={s.h1}>Be first in line.</h1>
            <p style={{ ...s.lead, marginBottom: 32 }}>
              The best kitchens hire fast. Here&apos;s how alerts get you there early.
            </p>

            <ol style={s.timeline}>
              <TimelineItem
                bg={c.soft}
                title="A kitchen starts hiring"
                text={`A ${firstRole} role opens in ${firstPlace}.`}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 10l8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
                    <path d="M9 20v-6h6v6" />
                  </svg>
                }
              />
              <TimelineItem
                bg={c.olive}
                title="You get an email straight away"
                text="Only if it matches what you picked."
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.onFill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                }
              />
              <TimelineItem
                last
                bg={c.ink}
                title="You apply before the crowd"
                text="Get your name in while the role is fresh."
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.bg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                }
              />
            </ol>

            <div style={{ flex: 1 }} />
            <p style={s.fineprint}>Never sponsored. Unsubscribe in one tap.</p>
            <PrimaryButton disabled={saving} onClick={() => finish(true)}>
              Yes, email me new jobs
            </PrimaryButton>
            <button
              type="button"
              disabled={saving}
              onClick={() => finish(false)}
              style={s.textBtn}
            >
              Not now
            </button>
          </div>
        )}

        {/* DONE */}
        {step === 4 && (
          <div style={s.body}>
            <div style={s.doneIcon}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={c.onFill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h1 style={s.h1}>{alerts ? "You’re first in line." : "All set."}</h1>
            <p style={s.lead}>
              {alerts
                ? `We’ll email you as soon as a ${roles[0] ?? "matching"} job goes up in ${joinNice(places) || "your area"}.`
                : "Your jobs are filtered to what you picked. You can turn on email alerts any time from your account."}
            </p>
            <div style={{ flex: 1 }} />
            <a href={matchingJobsHref(roles, places, roleOptions, jobsHref)} style={s.darkLink}>See my matching jobs</a>
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...s.primary,
        ...(disabled
          ? { background: c.disabledBg, color: c.disabledInk, cursor: "not-allowed" }
          : { background: c.olive, color: c.onFill, cursor: "pointer" }),
      }}
    >
      {children}
    </button>
  );
}

function TimelineItem({
  icon,
  bg,
  title,
  text,
  last,
}: {
  icon: ReactNode;
  bg: string;
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <li style={{ display: "flex", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ ...s.tlDot, background: bg }}>{icon}</div>
        {!last && <div style={s.tlLine} />}
      </div>
      <div style={{ padding: last ? "10px 0 0" : "10px 0 24px" }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 14, lineHeight: 1.45, color: c.muted, marginTop: 4 }}>{text}</div>
      </div>
    </li>
  );
}

/* ---------- styles ---------- */
const chipBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 44,
  borderRadius: 999,
  font: "inherit",
  fontSize: 15,
  fontWeight: 500,
  cursor: "pointer",
  boxSizing: "border-box",
  color: c.ink,
};

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: c.bg,
    color: c.ink,
    fontFamily: "inherit",
    display: "flex",
    justifyContent: "center",
  },
  shell: {
    width: "100%",
    maxWidth: 480,
    minHeight: "100dvh",
    boxSizing: "border-box",
    padding: "16px 24px calc(28px + var(--cookie-offset, 0px))",
    display: "flex",
    flexDirection: "column",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 48 },
  iconBtn: {
    width: 44, height: 44, border: "none", background: "transparent", padding: 0,
    display: "flex", alignItems: "center", color: c.ink, cursor: "pointer",
  },
  stepLabel: { width: 44, textAlign: "right", fontSize: 13, color: c.subtle },
  progress: { display: "flex", gap: 6, margin: "8px 0 32px" },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  body: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 },
  eyebrow: {
    margin: "0 0 10px", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", color: c.brick,
  },
  h1: { margin: "0 0 12px", fontWeight: 700, fontSize: 30, lineHeight: 1.2, letterSpacing: "-0.025em" },
  lead: { margin: "0 0 24px", fontSize: 16, lineHeight: 1.5, color: c.muted },
  chipWrap: { display: "flex", flexWrap: "wrap", gap: 10 },
  chip: { ...chipBase, padding: "0 18px" },
  chipOn: { border: `1.5px solid ${c.olive}`, background: c.olive, color: c.onFill },
  chipOff: { border: `1.5px solid ${c.chipLine}`, background: c.surface },
  label: { fontSize: 13, fontWeight: 600, marginBottom: 8 },
  inputWrap: {
    display: "flex", alignItems: "center", gap: 10, height: 52, padding: "0 16px",
    border: `1.5px solid ${c.chipLine}`, borderRadius: 14, background: c.surface,
  },
  input: {
    flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
    font: "inherit", fontSize: 16, color: c.ink,
  },
  selectedPlace: {
    ...chipBase, gap: 8, minHeight: 40, padding: "0 12px 0 16px",
    border: "none", background: c.olive, color: c.onFill,
  },
  smallLabel: { margin: "22px 0 10px", fontSize: 13, fontWeight: 600, color: c.subtle },
  customChip: {
    ...chipBase, gap: 6, padding: "0 16px", border: `1.5px dashed ${c.ink}`, background: "transparent",
  },
  suggestChip: { ...chipBase, padding: "0 16px", border: `1.5px solid ${c.chipLine}`, background: c.surface },
  primary: {
    width: "100%", height: 56, border: "none", borderRadius: 16,
    font: "inherit", fontSize: 16, fontWeight: 700,
  },
  textBtn: {
    marginTop: 8, minHeight: 48, border: "none", background: "transparent", color: c.ink,
    font: "inherit", fontSize: 15, fontWeight: 500, textDecoration: "underline",
    textUnderlineOffset: 3, cursor: "pointer",
  },
  fineprint: { margin: "0 0 14px", textAlign: "center", fontSize: 12, lineHeight: 1.5, color: c.subtle },
  timeline: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" },
  tlDot: {
    width: 44, height: 44, borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center", flex: "none",
  },
  tlLine: { width: 2, flex: 1, minHeight: 28, background: c.line },
  doneIcon: {
    width: 64, height: 64, borderRadius: "50%", background: c.olive, display: "flex",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  darkLink: {
    display: "flex", alignItems: "center", justifyContent: "center", height: 56,
    borderRadius: 16, background: c.olive, color: c.onFill, fontSize: 16, fontWeight: 700,
    textDecoration: "none",
  },
};
