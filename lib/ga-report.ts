import crypto from "crypto";

export type NameCount = { label: string; users: number };

export type CountStat = {
  users: number;
  percent: number;
  error?: string;
};

export type AnalyticsReport = {
  start: string;
  end: string;
  visitors: {
    count: number;
    bouncePercent: number;
    averageSeconds: number;
    wallLeft: CountStat;
    wallSignedUp: CountStat;
    sources: NameCount[];
    countries: NameCount[];
  };
  users: {
    count: number;
    searchedAfter: CountStat;
    averageSeconds: number;
    sources: NameCount[];
    countries: NameCount[];
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
let timeZoneCache: string | null = null;

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

async function propertyTimeZone(propertyId: string, token: string) {
  if (timeZoneCache) return timeZoneCache;
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [{ name: "activeUsers" }],
      }),
      cache: "no-store",
    }
  );
  const json = (await response.json()) as {
    metadata?: { timeZone?: string };
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(json.error?.message || "Google Analytics did not return the numbers.");
  }
  timeZoneCache = json.metadata?.timeZone || "UTC";
  return timeZoneCache;
}

function zonedDateHour(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = pick("hour") === "24" ? "00" : pick("hour");
  return {
    date: `${pick("year")}-${pick("month")}-${pick("day")}`,
    dateHour: `${pick("year")}${pick("month")}${pick("day")}${hour}`,
  };
}

function rollingDay(timeZone: string) {
  const now = new Date();
  const hours: string[] = [];
  let start = "";
  let end = "";
  for (let ago = 24; ago >= 0; ago -= 1) {
    const zoned = zonedDateHour(new Date(now.getTime() - ago * 60 * 60 * 1000), timeZone);
    if (!hours.includes(zoned.dateHour)) hours.push(zoned.dateHour);
    if (ago === 24) start = zoned.date;
    if (ago === 0) end = zoned.date;
  }
  return { start, end, hours };
}

function duringHours(hours: string[]) {
  return {
    filter: {
      fieldName: "dateHour",
      inListFilter: { values: hours },
    },
  };
}

function withoutGreece() {
  return {
    notExpression: {
      filter: {
        fieldName: "country",
        stringFilter: { matchType: "EXACT", value: "Greece", caseSensitive: false },
      },
    },
  };
}

function combineFilters(...filters: (Record<string, unknown> | undefined)[]) {
  const present = filters.filter((filter): filter is Record<string, unknown> => Boolean(filter));
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];
  return { andGroup: { expressions: present } };
}

async function runFunnel(
  propertyId: string,
  token: string,
  dateRanges: { startDate: string; endDate: string }[],
  events: string[],
  dimensionFilter?: Record<string, unknown>,
  breakdown?: string
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
        ...(dimensionFilter ? { dimensionFilter } : {}),
        ...(breakdown
          ? { funnelBreakdown: { breakdownDimension: { name: breakdown }, limit: 8 } }
          : {}),
        funnel: {
          steps: events.map((eventName) => ({
            name: eventName,
            filterExpression: { funnelEventFilter: { eventName } },
          })),
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

function asError(error: unknown, fallback: string) {
  return error instanceof Error ? error : new Error(fallback);
}

function placeLabel(raw: string) {
  if (raw === "(direct) / (none)" || raw === "(none)") return "Direct visit";
  if (raw === "(not set)" || !raw) return "Unknown";
  return raw;
}

function breakdownCounts(table: FunnelTable | undefined, dimension: string): NameCount[] {
  const stepIndex = headerIndex(table?.dimensionHeaders, "funnelStepName");
  const nameIndex = headerIndex(table?.dimensionHeaders, dimension);
  const metric = headerIndex(table?.metricHeaders, "activeUsers");
  const counts: NameCount[] = [];
  for (const row of table?.rows ?? []) {
    const step = row.dimensionValues?.[stepIndex]?.value ?? "";
    const raw = row.dimensionValues?.[nameIndex]?.value ?? "";
    if (!step.startsWith("1.") || raw === "RESERVED_TOTAL" || metric < 0) continue;
    const users = Number(row.metricValues?.[metric]?.value ?? 0);
    counts.push({ label: placeLabel(raw), users: Number.isFinite(users) ? users : 0 });
  }
  counts.sort((a, b) => b.users - a.users);
  return counts;
}

function nameCounts(report: GaReport | undefined, dimension: string): NameCount[] {
  return (report?.rows ?? []).map((row) => ({
    label: placeLabel(dimensionValue(report, row, dimension)),
    users: metricValue(report, row, "activeUsers"),
  }));
}

function engagementSeconds(report: GaReport | undefined, users: number) {
  const row = report?.rows?.[0];
  const total = metricValue(report, row, "userEngagementDuration");
  if (!users) return 0;
  return Math.round(total / users);
}

export async function getAnalyticsReport(
  start: string,
  end: string,
  options?: { excludeGreece?: boolean; last24Hours?: boolean }
): Promise<AnalyticsReport> {
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
  let hourFilter: Record<string, unknown> | undefined;
  if (options?.last24Hours) {
    const window = rollingDay(await propertyTimeZone(creds.propertyId, token));
    start = window.start;
    end = window.end;
    hourFilter = duringHours(window.hours);
  }
  const dateRanges = [{ startDate: start, endDate: end }];
  const countryFilter = options?.excludeGreece ? withoutGreece() : undefined;
  const visitorFilter = combineFilters(countryFilter, hourFilter);
  const eventFilter = combineFilters(
    {
      filter: {
        fieldName: "eventName",
        stringFilter: { matchType: "EXACT", value: "sign_up" },
      },
    },
    countryFilter
  );

  const main = runReports(creds.propertyId, token, [
    {
      dateRanges,
      metrics: [
        { name: "activeUsers" },
        { name: "bounceRate" },
        { name: "userEngagementDuration" },
      ],
      ...(visitorFilter ? { dimensionFilter: visitorFilter } : {}),
    },
    {
      dateRanges,
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "activeUsers" }, { name: "userEngagementDuration" }],
      dimensionFilter: combineFilters(eventFilter, hourFilter),
    },
    {
      dateRanges,
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: "8",
      ...(visitorFilter ? { dimensionFilter: visitorFilter } : {}),
    },
    {
      dateRanges,
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: "8",
      ...(visitorFilter ? { dimensionFilter: visitorFilter } : {}),
    },
  ]);
  const welcomeFunnel = runFunnel(
    creds.propertyId,
    token,
    dateRanges,
    ["welcome_search", "sign_up"],
    visitorFilter
  )
    .then((table) => ({
      searched: funnelStepUsers(table, 1),
      signedUp: funnelStepUsers(table, 2),
    }))
    .catch((error: unknown) => asError(error, "The sign-up wall numbers could not be loaded."));
  const searchedAfterFunnel = runFunnel(
    creds.propertyId,
    token,
    dateRanges,
    ["sign_up", "search"],
    visitorFilter
  )
    .then((table) => ({
      users: funnelStepUsers(table, 1),
      searched: funnelStepUsers(table, 2),
    }))
    .catch((error: unknown) => asError(error, "The user numbers could not be loaded."));
  const userSourcesFunnel = runFunnel(
    creds.propertyId,
    token,
    dateRanges,
    ["sign_up"],
    visitorFilter,
    "sessionSourceMedium"
  )
    .then((table) => breakdownCounts(table, "sessionSourceMedium"))
    .catch((error: unknown) => asError(error, "Where users came from could not be loaded."));
  const userCountriesFunnel = runFunnel(
    creds.propertyId,
    token,
    dateRanges,
    ["sign_up"],
    visitorFilter,
    "country"
  )
    .then((table) => breakdownCounts(table, "country"))
    .catch((error: unknown) => asError(error, "Where users came from could not be loaded."));

  const [overview, events, sources, countries] = await main;
  const overviewRow = overview?.rows?.[0];
  const visitors = metricValue(overview, overviewRow, "activeUsers");
  const bounce = metricValue(overview, overviewRow, "bounceRate");
  const signupRow = events?.rows?.[0];
  const signupEventUsers = metricValue(events, signupRow, "activeUsers");
  const welcomeResult = await welcomeFunnel;
  const searchedAfter = await searchedAfterFunnel;
  const userSources = await userSourcesFunnel;
  const userCountries = await userCountriesFunnel;
  const wallFailed = welcomeResult instanceof Error;
  const wallLeft = wallFailed
    ? 0
    : Math.min(visitors, Math.max(welcomeResult.searched - welcomeResult.signedUp, 0));
  const wallSignedUp = wallFailed ? 0 : Math.min(visitors, welcomeResult.signedUp);
  const userCount = searchedAfter instanceof Error ? signupEventUsers : searchedAfter.users;
  const searchedAfterUsers =
    searchedAfter instanceof Error
      ? 0
      : Math.min(userCount, searchedAfter.searched);
  return {
    start,
    end,
    visitors: {
      count: visitors,
      bouncePercent: Math.round((bounce <= 1 ? bounce * 100 : bounce) * 10) / 10,
      averageSeconds: engagementSeconds(overview, visitors),
      wallLeft: {
        users: wallLeft,
        percent: wallFailed ? 0 : percent(wallLeft, visitors),
        error: wallFailed ? welcomeResult.message : undefined,
      },
      wallSignedUp: {
        users: wallSignedUp,
        percent: wallFailed ? 0 : percent(wallSignedUp, visitors),
        error: wallFailed ? welcomeResult.message : undefined,
      },
      sources: nameCounts(sources, "sessionSourceMedium"),
      countries: nameCounts(countries, "country"),
    },
    users: {
      count: userCount,
      searchedAfter: {
        users: searchedAfterUsers,
        percent: searchedAfter instanceof Error ? 0 : percent(searchedAfterUsers, userCount),
        error: searchedAfter instanceof Error ? searchedAfter.message : undefined,
      },
      averageSeconds: userCount
        ? Math.round(metricValue(events, signupRow, "userEngagementDuration") / userCount)
        : 0,
      sources: userSources instanceof Error ? [] : userSources,
      countries: userCountries instanceof Error ? [] : userCountries,
      error:
        userSources instanceof Error
          ? userSources.message
          : userCountries instanceof Error
            ? userCountries.message
            : undefined,
    },
  };
}
