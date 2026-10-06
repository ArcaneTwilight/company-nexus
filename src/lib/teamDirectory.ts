import { TIMEZONES_TO_SHOW } from "../data";

/** Shown when filtering the team directory by a known team role. */
export const TEAM_DESCRIPTIONS: Record<string, string> = {
  "App Support": "Manages Company end-to-end production",
  "Mobile Developer": "Creates builds for the Company in iOS and Android",
  QA: "Verifies Company builds to meet specifications",
};

/** Seed options when no members (hence no teams) exist yet. */
export const SEED_TEAM_CATEGORIES = [
  "App Support",
  "Mobile Developer",
  "QA",
  "Engineering Lead",
  "Operations Manager",
  "Server Engineer",
] as const;

export function displayTeamRole(role: string): string {
  return role.trim().toLowerCase() === "pss" ? "App Support" : role.trim();
}

/** Unique team categories from members, sorted; falls back to seeds if empty. */
export function collectTeamCategories(roles: string[]): string[] {
  const unique = Array.from(
    new Set(roles.map(displayTeamRole).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  if (unique.length > 0) return unique;
  return [...SEED_TEAM_CATEGORIES];
}

/** Same regions as Overview clocks; labels use region names. */
export const COMMON_MEMBER_TIMEZONES: Array<{ id: string; label: string }> = (() => {
  const byTimezone = new Map<string, string[]>();
  for (const tz of TIMEZONES_TO_SHOW) {
    const names = byTimezone.get(tz.timezone) ?? [];
    if (!names.includes(tz.name)) names.push(tz.name);
    byTimezone.set(tz.timezone, names);
  }
  return Array.from(byTimezone.entries()).map(([id, names]) => ({
    id,
    label: names.join(" / "),
  }));
})();
export function createTeamMemberId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `team-${crypto.randomUUID()}`;
  }
  return `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Prefer timezoneId; fall back to parsing a legacy "Region/City (Abbr)" label. */
export function resolveTimezoneId(timezoneId: string | undefined, timezoneLabel: string): string {
  if (timezoneId?.trim()) return timezoneId.trim();
  const match = timezoneLabel.match(/^([A-Za-z_]+\/[A-Za-z_]+)/);
  return match?.[1] ?? "UTC";
}

export function labelForTimezoneId(timezoneId: string): string {
  const known = COMMON_MEMBER_TIMEZONES.find((tz) => tz.id === timezoneId);
  return known?.label ?? timezoneId;
}

export function formatLocalTime(date: Date, timezoneId: string, hour12 = false): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezoneId,
      hour: "2-digit",
      minute: "2-digit",
      hour12,
    }).format(date);
  } catch {
    return "--:--";
  }
}
