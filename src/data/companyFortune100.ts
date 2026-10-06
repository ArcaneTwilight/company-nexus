import type { companymasterapp } from "../types";

export const COMPANY_PLACEHOLDER_URL = "https://www.company.com";

// Fortune 500 2025, ranks 1-100. Operational fields are intentionally neutral.
const FORTUNE_100_NAMES = [
  "Walmart",
  "Amazon",
  "UnitedHealth Group",
  "Apple",
  "CVS Health",
  "Berkshire Hathaway",
  "Alphabet",
  "Exxon Mobil",
  "McKesson",
  "Cencora",
  "JPMorgan Chase",
  "Costco Wholesale",
  "Microsoft",
  "Cardinal Health",
  "Chevron",
  "Cigna Group",
  "Ford Motor",
  "Bank of America",
  "General Motors",
  "Elevance Health",
  "Citigroup",
  "Centene",
  "Home Depot",
  "Walgreens Boots Alliance",
  "Kroger",
  "Marathon Petroleum",
  "Phillips 66",
  "Fannie Mae",
  "Valero Energy",
  "Meta Platforms",
  "Verizon Communications",
  "Goldman Sachs Group",
  "Wells Fargo",
  "Tesla",
  "Freddie Mac",
  "State Farm Insurance",
  "Humana",
  "FedEx",
  "Comcast",
  "John Deere",
  "PepsiCo",
  "United Parcel Service",
  "Archer Daniels Midland",
  "Procter & Gamble",
  "Lowe's",
  "Johnson & Johnson",
  "Albertsons",
  "Target",
  "Energy Transfer",
  "RTX",
  "Dell Technologies",
  "Sysco",
  "Merck",
  "Morgan Stanley",
  "Intel",
  "Progressive",
  "American Airlines Group",
  "Caterpillar",
  "Plains GP Holdings",
  "IBM",
  "MetLife",
  "HCA Healthcare",
  "Publix Super Markets",
  "Tyson Foods",
  "Nationwide",
  "Allstate",
  "Delta Air Lines",
  "TJX Companies",
  "Nike",
  "Best Buy",
  "Bristol-Myers Squibb",
  "United Airlines Holdings",
  "Enterprise Products Partners",
  "PBF Energy",
  "Liberty Mutual Insurance Group",
  "ConocoPhillips",
  "Performance Food Group",
  "Uber Technologies",
  "Thermo Fisher Scientific",
  "Abbott Laboratories",
  "Northrop Grumman",
  "Charter Communications",
  "Capital One Financial",
  "Cisco Systems",
  "HP",
  "American Express",
  "TIAA",
  "Oracle",
  "Broadcom",
  "General Dynamics",
  "Coca-Cola",
  "USAA",
  "Honeywell International",
  "Lockheed Martin",
  "Deere",
  "Charles Schwab",
  "New York Life Insurance",
  "StoneX Group",
  "Molina Healthcare",
  "Travelers",
] as const;

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const COUNTRIES = [
  ["United States", "North America", "NYSE"],
  ["Canada", "North America", "TSX"],
  ["United Kingdom", "Europe", "LSE"],
  ["Germany", "Europe", "XETRA"],
  ["France", "Europe", "Euronext Paris"],
  ["Japan", "Asia Pacific", "TSE"],
  ["Australia", "Asia Pacific", "ASX"],
  ["Singapore", "Asia Pacific", "SGX"],
  ["United Arab Emirates", "Middle East", "ADX"],
  ["Saudi Arabia", "Middle East", "Tadawul"],
] as const;

const STATUS_OPTIONS = [
  ["online", "Online"],
  ["for_production", "For Release"],
  ["client_testing", "Client Testing"],
  ["on_development", "On Development"],
  ["on_hold", "On Hold"],
  ["new", "New Order"],
] as const;

const PEOPLE = [
  ["Alex Morgan", "Jordan Lee", "Casey Brooks"],
  ["Taylor Kim", "Riley Patel", "Morgan Chen"],
  ["Sam Rivera", "Jamie Park", "Avery Wilson"],
  ["Cameron Reed", "Drew Bennett", "Quinn Taylor"],
] as const;

function demoNumber(rank: number, salt: number): number {
  let value = Math.imul(rank ^ salt, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

function sampleDate(rank: number, offset: number): string {
  const month = (demoNumber(rank, offset + 11) % 12) + 1;
  const day = (demoNumber(rank, offset + 17) % 27) + 1;
  return `${2024 + Math.floor((rank + offset) / 50)}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function createSanitizedCompany(name: string, rank: number): companymasterapp {
  const id = `company-${String(rank).padStart(3, "0")}-${slugify(name)}`;
  const slug = slugify(name);
  const [country, market, stockExchange] =
    COUNTRIES[demoNumber(rank, 23) % COUNTRIES.length];
  const [statusKey, statusLabel] =
    STATUS_OPTIONS[demoNumber(rank, 29) % STATUS_OPTIONS.length];
  const [salesOwner, pssOwner, devOwner] =
    PEOPLE[demoNumber(rank, 31) % PEOPLE.length];
  const baseUrl = `${COMPANY_PLACEHOLDER_URL}/${slug}`;
  const features = (seed: number) => {
    const featureStates = ["yes", "no", "partial", "unknown"] as const;
    const value =
      featureStates[demoNumber(rank, seed + 37) % featureStates.length];
    return { value, label: value === "unknown" ? "" : value === "yes" ? "Yes" : value === "no" ? "No" : "Partial" };
  };
  return {
    id,
    companyName: name,
    statusKey,
    statusLabel,
    liveVersion: demoNumber(rank, 41) % 3 === 0 ? "V3" : "V2",
    upgradeOrNewOrder: demoNumber(rank, 43) % 4 === 0 ? "Upgrade from V2" : "New",
    v3Release: "",
    v3ReleaseRaw: "",
    initialReleaseDate: sampleDate(rank, 0),
    initialReleaseDateRaw: sampleDate(rank, 0),
    dateOrdered: sampleDate(rank, 6),
    daysCompleted: String(12 + (demoNumber(rank, 47) % 74)),
    ongoingV2Production: demoNumber(rank, 53) % 2 === 0 ? "No" : "Yes",
    iosDownloads: "",
    androidDownloads: "",
    pushNotification:
      demoNumber(rank, 59) % 3 === 0
        ? "In review"
        : demoNumber(rank, 61) % 2 === 0
          ? "Available"
          : "Not available",
    deleteAccountFeature: "",
    accountFeature: features(0),
    media: features(1),
    aiFeatures: features(2),
    initialIosRelease: sampleDate(rank, 2),
    initialAndroidRelease: sampleDate(rank, 4),
    dateField: sampleDate(rank, 8),
    comments: `Demo record · ${statusLabel.toLowerCase()} workflow; next review ${sampleDate(rank, 10)}.`,
    hasChanges: demoNumber(rank, 67) % 3 === 0 ? "Yes" : "No",
    salesOnboardingPoc: [salesOwner],
    salesOnboardingPocRaw: salesOwner,
    pssPoc: [pssOwner],
    devPoc: [devOwner],
    country,
    market,
    stockExchange,
    dynamicContent: "",
    manualUpdateModule: "",
    marketingMaterial: [`${baseUrl}/overview`],
    marketingMaterialRaw: `${baseUrl}/overview`,
    androidClosedTesting: [`${baseUrl}/closed-testing`],
    androidClosedTestingRaw: `${baseUrl}/closed-testing`,
    androidInternalTesting: [`${baseUrl}/internal-testing`],
    androidInternalTestingRaw: `${baseUrl}/internal-testing`,
    lastUpdated: "2026-09-30",
  };
}

export const COMPANY_FORTUNE_100: companymasterapp[] = FORTUNE_100_NAMES.map(
  (name, index) => createSanitizedCompany(name, index + 1)
);
