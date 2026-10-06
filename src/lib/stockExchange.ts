import { getCountryFlag } from "../data/countryFlags";

/** Regional indicator flag emoji for a country label. */
export function countryFlagEmoji(country: string): string {
  return getCountryFlag(country);
}

/** Pull acronym from trailing parentheses, e.g. "London Stock Exchange (LSE)" → "LSE". */
export function extractExchangeAcronym(exchange: string): string {
  const parenMatch = exchange.match(/\(([A-Za-z0-9]+)\)\s*$/);
  if (parenMatch) return parenMatch[1].toUpperCase();

  const normalized = exchange.trim();
  if (/^nasdaq$/i.test(normalized)) return "NASDAQ";

  const words = normalized
    .replace(/\([^)]*\)/g, "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^[A-Z]{2,}$/.test(word));

  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return (words[0] ?? normalized).slice(0, 4).toUpperCase();
}

/** Exchange name without trailing acronym parentheses. */
export function exchangeDisplayName(exchange: string): string {
  return exchange.replace(/\s*\([^)]+\)\s*$/, "").trim();
}

export function formatExchangeLocation(city: string, country: string): string {
  return `${city}, ${country}`;
}

export type StockExchangeRegion =
  | "Middle East & Africa"
  | "Asia & Oceania"
  | "Europe"
  | "The Americas";

const REGION_COUNTRIES: Record<StockExchangeRegion, readonly string[]> = {
  "Middle East & Africa": [
    "Saudi Arabia",
    "UAE",
    "United Arab Emirates",
    "Kuwait",
    "Oman",
    "Jordan",
    "Qatar",
    "Bahrain",
    "Egypt",
    "Israel",
    "Turkey",
    "South Africa",
    "Morocco",
    "Nigeria",
    "Kenya",
  ],
  "Asia & Oceania": [
    "Hong Kong",
    "Japan",
    "Singapore",
    "India",
    "China",
    "South Korea",
    "Taiwan",
    "Australia",
    "New Zealand",
    "Indonesia",
    "Malaysia",
    "Thailand",
    "Philippines",
    "Vietnam",
  ],
  Europe: [
    "United Kingdom",
    "Finland",
    "Sweden",
    "Portugal",
    "Spain",
    "Italy",
    "Germany",
    "France",
    "Netherlands",
    "Switzerland",
    "Ireland",
    "Norway",
    "Denmark",
    "Belgium",
    "Austria",
    "Poland",
    "Greece",
    "Luxembourg",
  ],
  "The Americas": [
    "United States",
    "Canada",
    "Brazil",
    "Mexico",
    "Argentina",
    "Chile",
    "Colombia",
    "Peru",
  ],
};

const COUNTRY_TO_REGION = Object.entries(REGION_COUNTRIES).reduce(
  (map, [region, countries]) => {
    for (const country of countries) {
      map.set(country.toLowerCase(), region as StockExchangeRegion);
    }
    return map;
  },
  new Map<string, StockExchangeRegion>()
);

export function resolveExchangeRegion(country: string): StockExchangeRegion {
  return COUNTRY_TO_REGION.get(country.trim().toLowerCase()) ?? "Europe";
}

export const STOCK_EXCHANGE_COLUMNS: ReadonlyArray<{
  title: string;
  regions: readonly StockExchangeRegion[];
}> = [
  { title: "Middle East & Africa", regions: ["Middle East & Africa"] },
  { title: "Europe", regions: ["Europe"] },
  { title: "Asia, Oceania & The Americas", regions: ["Asia & Oceania", "The Americas"] },
];
