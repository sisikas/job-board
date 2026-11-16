const NOW_GBP = 39;
const WAS_GBP = 79;

const COUNTRY_CURRENCY: Record<string, string> = {
  AD: "EUR",
  AT: "EUR",
  AU: "AUD",
  BE: "EUR",
  BR: "BRL",
  CA: "CAD",
  CC: "AUD",
  CH: "CHF",
  CK: "NZD",
  CN: "CNY",
  CX: "AUD",
  CY: "EUR",
  CZ: "CZK",
  DE: "EUR",
  DK: "DKK",
  EE: "EUR",
  ES: "EUR",
  FI: "EUR",
  FO: "DKK",
  FR: "EUR",
  GB: "GBP",
  GG: "GBP",
  GL: "DKK",
  GR: "EUR",
  HK: "HKD",
  HR: "EUR",
  HU: "HUF",
  ID: "IDR",
  IE: "EUR",
  IL: "ILS",
  IM: "GBP",
  IN: "INR",
  IS: "ISK",
  IT: "EUR",
  JE: "GBP",
  JP: "JPY",
  KI: "AUD",
  KR: "KRW",
  LI: "CHF",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  MC: "EUR",
  ME: "EUR",
  MT: "EUR",
  MX: "MXN",
  MY: "MYR",
  NF: "AUD",
  NL: "EUR",
  NO: "NOK",
  NR: "AUD",
  NU: "NZD",
  NZ: "NZD",
  PH: "PHP",
  PL: "PLN",
  PN: "NZD",
  PT: "EUR",
  RO: "RON",
  SE: "SEK",
  SG: "SGD",
  SI: "EUR",
  SK: "EUR",
  SM: "EUR",
  TH: "THB",
  TK: "NZD",
  TR: "TRY",
  TV: "AUD",
  US: "USD",
  VA: "EUR",
  XK: "EUR",
  ZA: "ZAR",
};

const CURRENCY_LOCALE: Record<string, string> = {
  AUD: "en-AU",
  BRL: "pt-BR",
  CAD: "en-CA",
  CHF: "de-CH",
  CNY: "zh-CN",
  CZK: "cs-CZ",
  DKK: "da-DK",
  EUR: "en-IE",
  GBP: "en-GB",
  HKD: "en-HK",
  HUF: "hu-HU",
  IDR: "id-ID",
  ILS: "he-IL",
  INR: "en-IN",
  ISK: "is-IS",
  JPY: "ja-JP",
  KRW: "ko-KR",
  MXN: "es-MX",
  MYR: "ms-MY",
  NOK: "nb-NO",
  NZD: "en-NZ",
  PHP: "en-PH",
  PLN: "pl-PL",
  RON: "ro-RO",
  SEK: "sv-SE",
  SGD: "en-SG",
  THB: "th-TH",
  TRY: "tr-TR",
  USD: "en-US",
  ZAR: "en-ZA",
};

const FALLBACK_RATES: Record<string, number> = {
  GBP: 1,
  AUD: 1.9493,
  BRL: 7.4911,
  CAD: 1.8859,
  CHF: 1.1089,
  CNY: 8.8247,
  CZK: 29.23,
  DKK: 8.9465,
  EUR: 1.1968,
  HKD: 10.3776,
  HUF: 437.54,
  IDR: 24131,
  ILS: 4.2467,
  INR: 124.65,
  ISK: 163.48,
  JPY: 211.62,
  KRW: 1768.57,
  MXN: 24.592,
  MYR: 5.4064,
  NOK: 12.6491,
  NZD: 2.3909,
  PHP: 84.4,
  PLN: 5.2793,
  RON: 6.4019,
  SEK: 13.293,
  SGD: 1.7037,
  THB: 44.858,
  TRY: 66.62,
  USD: 1.3227,
  ZAR: 22.437,
};

export const PRICE_REGIONS = [
  { id: "uk", code: "GBP", symbol: "£", short: "UK", place: "United Kingdom" },
  { id: "us", code: "USD", symbol: "$", short: "US", place: "United States" },
  { id: "ca", code: "CAD", symbol: "$", short: "CA", place: "Canada" },
  { id: "au", code: "AUD", symbol: "$", short: "AU", place: "Australia" },
  { id: "eu", code: "EUR", symbol: "€", short: "EU", place: "Europe" },
  { id: "row", code: "USD", symbol: "$", short: "World", place: "Rest of the world" },
] as const;

export type PriceRegionId = (typeof PRICE_REGIONS)[number]["id"];

export function isPriceRegion(value: string | undefined): value is PriceRegionId {
  return PRICE_REGIONS.some((region) => region.id === value);
}

export function regionForCountry(country: string | null | undefined): PriceRegionId {
  const code = (country ?? "").trim().toUpperCase();
  if (!code || code === "XX" || code === "T1") return "uk";
  if (code === "GB" || code === "GG" || code === "IM" || code === "JE") return "uk";
  if (code === "US") return "us";
  if (code === "CA") return "ca";
  if (COUNTRY_CURRENCY[code] === "AUD") return "au";
  if (COUNTRY_CURRENCY[code] === "EUR") return "eu";
  return "row";
}

export function formatLocalAmount(amountGbp: number, currency: string, rate: number) {
  const rounded = Math.round(amountGbp * rate);
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);
}

async function gbpRates() {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=GBP", {
      next: { revalidate: 60 * 60 * 12 },
    });
    if (!response.ok) return FALLBACK_RATES;
    const data = (await response.json()) as { rates?: Record<string, number> };
    if (!data.rates) return FALLBACK_RATES;
    return { GBP: 1, ...data.rates };
  } catch {
    return FALLBACK_RATES;
  }
}

export const CURRENCY_COOKIE = "tgs-currency";

export type LocalPriceChoice = {
  id: PriceRegionId;
  code: string;
  symbol: string;
  short: string;
  place: string;
  now: string;
  was: string;
};

export async function allLocalPrices(): Promise<LocalPriceChoice[]> {
  const rates = await gbpRates();
  return PRICE_REGIONS.map((region) => {
    const rate = rates[region.code] ?? FALLBACK_RATES[region.code] ?? 1;
    return {
      ...region,
      now: formatLocalAmount(NOW_GBP, region.code, rate),
      was: formatLocalAmount(WAS_GBP, region.code, rate),
    };
  });
}
