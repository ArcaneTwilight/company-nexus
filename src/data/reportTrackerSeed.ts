import { COMPANY_MASTER_APPS } from "./companyMasterApps";

interface SeedQuarterStatus {
  fr: boolean | null;
  ip: boolean | null;
  others: string;
  completed: boolean;
}

interface SeedAnnualStatus {
  ar: boolean | null;
  sr: boolean | null;
  others: string;
}

export interface ReportTrackerSeedEntry {
  id: string;
  appName: string;
  companyCode: string;
  stockExchange: string;
  irappClientId: string;
  financialReports: boolean;
  annualReports: boolean;
  esgReports: boolean;
  quarters: Record<string, SeedQuarterStatus>;
  annual: Record<string, SeedAnnualStatus>;
  financialCalendar: boolean;
  docLib: boolean;
}

const REPORT_YEARS = [2025, 2026];
const QUARTERS = REPORT_YEARS.flatMap((year) =>
  ["Q1", "Q2", "Q3", "Q4"].map((quarter) => `${year}-${quarter}`)
);

function demoNumber(rank: number, salt: number): number {
  let value = Math.imul(rank ^ salt, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

/** Synthetic monitoring statuses, linked one-to-one with the Company List. */
export const REPORT_TRACKER_SEED: ReportTrackerSeedEntry[] =
  COMPANY_MASTER_APPS.map((app, index) => {
    const rank = index + 1;
    const quarters = Object.fromEntries(
      QUARTERS.map((quarter, quarterIndex) => {
        const hasUploads = demoNumber(rank, quarterIndex + 71) % 4 !== 0;
        const hasPresentation =
          hasUploads && demoNumber(rank, quarterIndex + 73) % 3 !== 0;
        return [
          quarter,
          {
            fr: hasUploads,
            ip: hasPresentation,
            others: "",
            completed: hasUploads && hasPresentation,
          },
        ];
      })
    );

    return {
      id: `report-${app.id}`,
      appName: app.companyName,
      companyCode: `DEMO-${String(rank).padStart(3, "0")}`,
      stockExchange: app.stockExchange,
      irappClientId: app.id,
      financialReports: demoNumber(rank, 79) % 5 !== 0,
      annualReports: demoNumber(rank, 83) % 4 !== 0,
      esgReports: demoNumber(rank, 89) % 3 !== 0,
      quarters,
      annual: Object.fromEntries(
        [2024, 2025].map((year, yearIndex) => [
          String(year),
          {
            ar: demoNumber(rank, yearIndex + 97) % 4 !== 0,
            sr: demoNumber(rank, yearIndex + 101) % 3 !== 0,
            others: "",
          },
        ])
      ),
      financialCalendar: demoNumber(rank, 103) % 2 === 0,
      docLib: demoNumber(rank, 107) % 3 === 0,
    };
  });
