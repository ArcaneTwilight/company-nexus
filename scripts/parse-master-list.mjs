#!/usr/bin/env node
/** Generate sanitized Company List artifacts from the checked-in Fortune 100 seed. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "src/data/companyFortune100.ts");
const jsonPath = path.join(root, "src/data/company-master-list.json");
const markdownPath = path.join(root, "src/data/Company-Master-List.md");
const placeholderUrl = "https://www.company.com";
const source = fs.readFileSync(sourcePath, "utf8");
const names = [...source.matchAll(/^  "([^"]+)",$/gm)].map((match) => match[1]);

if (names.length !== 100) {
  throw new Error(`Expected 100 Fortune companies, found ${names.length}`);
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function createRow(name, rank) {
  return {
    id: `company-${String(rank).padStart(3, "0")}-${slugify(name)}`,
    companyName: name,
    statusKey: "new",
    statusLabel: "New Order",
    liveVersion: "",
    upgradeOrNewOrder: "New",
    v3Release: "",
    v3ReleaseRaw: "",
    initialReleaseDate: "",
    initialReleaseDateRaw: "",
    dateOrdered: "",
    daysCompleted: "",
    ongoingV2Production: "",
    iosDownloads: "",
    androidDownloads: "",
    pushNotification: "",
    deleteAccountFeature: "",
    accountFeature: { value: "unknown", label: "" },
    media: { value: "unknown", label: "" },
    aiFeatures: { value: "unknown", label: "" },
    initialIosRelease: "",
    initialAndroidRelease: "",
    dateField: "",
    comments: "Placeholder company record",
    hasChanges: "No",
    salesOnboardingPoc: [],
    salesOnboardingPocRaw: "",
    pssPoc: [],
    devPoc: [],
    country: "Placeholder",
    market: "Placeholder",
    stockExchange: "Placeholder",
    dynamicContent: "",
    manualUpdateModule: "",
    marketingMaterial: [placeholderUrl],
    marketingMaterialRaw: placeholderUrl,
    androidClosedTesting: [placeholderUrl],
    androidClosedTestingRaw: placeholderUrl,
    androidInternalTesting: [placeholderUrl],
    androidInternalTestingRaw: placeholderUrl,
    lastUpdated: "",
  };
}

const rows = names.map(createRow);
const markdownRows = rows
  .map(
    (row, index) =>
      `| ${index + 1} | ${row.companyName} | New Order | ${placeholderUrl} | ${placeholderUrl} | ${placeholderUrl} |`
  )
  .join("\n");

fs.writeFileSync(jsonPath, `${JSON.stringify(rows, null, 2)}\n`);
fs.writeFileSync(
  markdownPath,
  `# Company Master List\n\nSanitized Fortune 500 2025 top 100 seed. Operational links are placeholders.\n\n| Rank | Company Name | Status | Marketing Material | Android Testing | Android Internal Testing |\n| ---: | --- | --- | --- | --- | --- |\n${markdownRows}\n`
);

console.log(`Wrote ${rows.length} sanitized companies to ${jsonPath}`);
console.log(`Wrote sanitized source table to ${markdownPath}`);
