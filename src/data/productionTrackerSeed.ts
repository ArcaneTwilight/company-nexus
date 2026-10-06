import type { ProductionTrackerEntry } from "../types";
import { COMPANY_MASTER_APPS } from "./companyMasterApps";

const PRIORITIES = ["[P1]", "[P2]", "Pending", "For Release", "On Hold"];
const PHASES = [
  "Setting up requirements",
  "Development",
  "Internal Testing",
  "External Testing",
  "Submit the app for review",
  "Go live",
];
const DEVELOPERS = ["Alex Morgan", "Taylor Kim", "Sam Rivera", "Cameron Reed"];
const PSS_OWNERS = ["Jordan Lee", "Riley Patel", "Jamie Park", "Drew Bennett"];

function demoNumber(rank: number, salt: number): number {
  let value = Math.imul(rank ^ salt, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

/** Synthetic production pipeline entries linked one-to-one with the Company List. */
export const PRODUCTION_TRACKER_SEED: ProductionTrackerEntry[] =
  COMPANY_MASTER_APPS.map((app, index) => {
    const rank = index + 1;
    const assignedDev = DEVELOPERS[demoNumber(rank, 109) % DEVELOPERS.length];
    const assignedPss = PSS_OWNERS[demoNumber(rank, 113) % PSS_OWNERS.length];
    const updatedAt = `2026-09-${String((demoNumber(rank, 127) % 28) + 1).padStart(2, "0")}T10:00:00.000Z`;

    return {
      id: `production-${app.id}`,
      clientName: app.companyName,
      companyAppId: app.id,
      priority: PRIORITIES[demoNumber(rank, 131) % PRIORITIES.length],
      assignedDev,
      assignedPss,
      currentPhase: PHASES[demoNumber(rank, 137) % PHASES.length],
      comments: `Demo workflow · ${app.statusLabel}.`,
      createdAt: updatedAt,
      updatedAt,
    };
  });
