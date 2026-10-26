import crypto from "crypto";

const ACTION_LABELS: Record<string, string> = {
  search: "Pressed Search",
  scroll_end: "Reached the bottom",
  sign_up: "Signed up",
  view_job: "Opened a job",
};

const EVERYONE_ACTIONS = ["search", "scroll_end", "sign_up"] as const;
const SIGNUP_ACTIONS = ["search", "view_job", "scroll_end"] as const;

export type ActionStat = {
  key: string;
  label: string;
  users: number;
  percent: number;
};

export type NameCount = { label: string; users: number };

export type AnalyticsReport = {
  start: string;
  end: string;
  visitors: number;
  bouncePercent: number;
  averageSeconds: number;
  actions: ActionStat[];
  sources: NameCount[];
  countries: NameCount[];
  signups: {
    users: number;
    averageSeconds: number;
    actions: ActionStat[];
    error?: string;
  };
};

type GaRow = {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
};

type GaReport = {
  dimensionHeaders?: { name?: string }[];
  metricHeaders?: { name?: string }[];
  rows?: GaRow[];
};

type TokenCache = { token: string; exp: number };
let tokenCache: TokenCache | null = null;

export function analyticsConfigured() {
  return Boolean(credentials());
}

function credentials() {
  const email = process.env.GA_CLIENT_EMAIL?.trim();
  const propertyId = process.env.GA_PROPERTY_ID?.trim().replace(/^properties\//, "");
  let key = process.env.GA_PRIVATE_KEY?.trim() ?? "";
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, "\n");
  if (!email || !key || !propertyId) return null;
  return { email, key, propertyId };
}

function base64url(value: string | Buffer) {
  const buffer = typeof value === "string" ? Buffer.from(value) : value;
  return buffer.toString("base64url");
}

async function accessToken(email: string, key: string) {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp > now + 60) return tokenCache.token;

  const unsigned = [
    base64url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    base64url(
      JSON.stringify({
        iss: email,
        scope: "https://www.googleapis.com/auth/analytics.readonly",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    ),
  ].join(".");
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(key).toString("base64url")}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
    error?: string;
  };
  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "Google refused the login.");
  }
  tokenCache = { token: json.access_token, exp: now + (json.expires_in || 3600) };
  return json.access_token;
}

async function runReports(
  propertyId: string,
  token: string,
  requests: Record<string, unknown>[]
) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
      cache: "no-store",
    }
  );
  const json = (await response.json()) as {
    reports?: GaReport[];
    error?: { message?: string; status?: string };
  };
  if (!response.ok) {
    const message = json.error?.message || "Google Analytics did not return the numbers.";
    if (json.error?.status === "PERMISSION_DENIED") {
      throw new Error(
        "Google refused this connection. Add the service account email as a Viewer on the Analytics property."
      );
    }
    if (propertyId.startsWith("G-")) {
      throw new Error(
        "Use the property ID from Admin, then Property settings. It is a number, not the G- measurement ID."
      );
    }
    throw new Error(message);
  }
  return json.reports ?? [];
}

type FunnelTable = {
  dimensionHeaders?: { name?: string }[];
  metricHeaders?: { name?: string }[];
  rows?: GaRow[];
};

async function runFunnel(
  propertyId: string,
  token: string,
  dateRanges: { startDate: string; endDate: string }[],
  eventName: string
) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1alpha/properties/${propertyId}:runFunnelReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges,
        funnel: {
          steps: [
            {
              name: "Signed up",
              filterExpression: { funnelEventFilter: { eventName: "sign_up" } },
            },
            {
              name: eventName,
              filterExpression: { funnelEventFilter: { eventName } },
            },
          ],
        },
      }),
      cache: "no-store",
    }
  );
  const json = (await response.json()) as {
    funnelTable?: FunnelTable;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(json.error?.message || "Sign-up numbers could not be loaded.");
  }
  return json.funnelTable;
}

function funnelStepUsers(table: FunnelTable | undefined, step: number) {
  const dimension = headerIndex(table?.dimensionHeaders, "funnelStepName");
  const metric = headerIndex(table?.metricHeaders, "activeUsers");
  const row = table?.rows?.find((item) =>
    (item.dimensionValues?.[dimension]?.value ?? "").startsWith(`${step}.`)
  );
  if (!row || metric < 0) return 0;
  const value = Number(row.metricValues?.[metric]?.value ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function headerIndex(headers: { name?: string }[] | undefined, name: string) {
  return headers?.findIndex((header) => header.name === name) ?? -1;
}

function metricValue(report: GaReport | undefined, row: GaRow | undefined, name: string) {
  const index = headerIndex(report?.metricHeaders, name);
  if (!row || index < 0) return 0;
  const value = Number(row.metricValues?.[index]?.value ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function dimensionValue(report: GaReport | undefined, row: GaRow, name: string) {
  const index = headerIndex(report?.dimensionHeaders, name);
  if (index < 0) return "";
  return row.dimensionValues?.[index]?.value ?? "";
}

function percent(part: number, whole: number) {
  if (!whole || !part) return 0;
  return Math.round((part / whole) * 100);
}

function actionsFrom(
  report: GaReport | undefined,
  keys: readonly string[],
  whole: number
): ActionStat[] {
  const usersByEvent = new Map<string, number>();
  for (const row of report?.rows ?? []) {
    const name = dimensionValue(report, row, "eventName");
    usersByEvent.set(name, metricValue(report, row, "activeUsers"));
  }
  return keys.map((key) => {
    const users = usersByEvent.get(key) ?? 0;
    return { key, label: ACTION_LABELS[key] ?? key, users, percent: percent(users, whole) };
  });
}

function nameCounts(report: GaReport | undefined, dimension: string): NameCount[] {
  return (report?.rows ?? []).map((row) => {
    const raw = dimensionValue(report, row, dimension);
    const label =
      raw === "(direct) / (none)"
        ? "Direct visit"
        : raw === "(not set)" || !raw
          ? "Unknown"
          : raw;
    return { label, users: metricValue(report, row, "activeUsers") };
  });
}

function engagementSeconds(report: GaReport | undefined, users: number) {
  const row = report?.rows?.[0];
  const total = metricValue(report, row, "userEngagementDuration");
  if (!users) return 0;
  return Math.round(total / users);
}

export async function getAnalyticsReport(start: string, end: string): Promise<AnalyticsReport> {
  const creds = credentials();
  if (!creds) {
    throw new Error("Google Analytics is not connected yet.");
  }
  if (creds.propertyId.startsWith("G-")) {
    throw new Error(
      "Use the property ID from Admin, then Property settings. It is a number, not the G- measurement ID."
    );
  }

  const token = await accessToken(creds.email, creds.key);
  const dateRanges = [{ startDate: start, endDate: end }];
  const eventFilter = {
    filter: {
      fieldName: "eventName",
      inListFilter: { values: ["search", "scroll_end", "sign_up", "view_job"] },
    },
  };

  const main = runReports(creds.propertyId, token, [
    {
      dateRanges,
      metrics: [
        { name: "activeUsers" },
        { name: "bounceRate" },
        { name: "userEngagementDuration" },
      ],
    },
    {
      dateRanges,
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "activeUsers" }, { name: "userEngagementDuration" }],
      dimensionFilter: eventFilter,
    },
    {
      dateRanges,
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: "8",
    },
    {
      dateRanges,
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: "8",
    },
  ]);
  const signupFunnels = Promise.all(
    SIGNUP_ACTIONS.map(async (eventName) => {
      const table = await runFunnel(creds.propertyId, token, dateRanges, eventName);
      return {
        eventName,
        signups: funnelStepUsers(table, 1),
        users: funnelStepUsers(table, 2),
      };
    })
  ).catch((error: unknown) =>
    error instanceof Error ? error : new Error("Sign-up numbers could not be loaded.")
  );

  const [overview, events, sources, countries] = await main;
  const signupResult = await signupFunnels;
  const signupFailed = signupResult instanceof Error;
  const overviewRow = overview?.rows?.[0];
  const visitors = metricValue(overview, overviewRow, "activeUsers");
  const bounce = metricValue(overview, overviewRow, "bounceRate");
  const signupRow = events?.rows?.find(
    (row) => dimensionValue(events, row, "eventName") === "sign_up"
  );
  const signupUsers = signupFailed
    ? 0
    : Math.max(...signupResult.map((item) => item.signups), 0);

  return {
    start,
    end,
    visitors,
    bouncePercent: Math.round((bounce <= 1 ? bounce * 100 : bounce) * 10) / 10,
    averageSeconds: engagementSeconds(overview, visitors),
    actions: actionsFrom(events, EVERYONE_ACTIONS, visitors),
    sources: nameCounts(sources, "sessionSourceMedium"),
    countries: nameCounts(countries, "country"),
    signups: {
      users: signupUsers,
      averageSeconds: signupUsers
        ? Math.round(metricValue(events, signupRow, "userEngagementDuration") / signupUsers)
        : 0,
      actions: signupFailed
        ? []
        : signupResult.map((item) => ({
            key: item.eventName,
            label: ACTION_LABELS[item.eventName] ?? item.eventName,
            users: item.users,
            percent: percent(item.users, signupUsers),
          })),
      error: signupFailed ? signupResult.message : undefined,
    },
  };
}
