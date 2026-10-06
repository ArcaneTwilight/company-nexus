import type { TimezoneConfig } from "../../../types";

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function getTimezoneOffsetMs(timezone: string, date: Date): number {
  const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const local = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return local.getTime() - utc.getTime();
}

export function sortTimezonesWestward(
  timezones: TimezoneConfig[],
  date: Date
): TimezoneConfig[] {
  return [...timezones].sort((a, b) => {
    const offsetDiff =
      getTimezoneOffsetMs(b.timezone, date) - getTimezoneOffsetMs(a.timezone, date);
    if (offsetDiff !== 0) return offsetDiff;

    const manilaIndex = timezones.findIndex((tz) => tz.name === "Manila");
    const aIndex = timezones.findIndex((tz) => tz.name === a.name);
    const bIndex = timezones.findIndex((tz) => tz.name === b.name);

    if (aIndex === manilaIndex) return -1;
    if (bIndex === manilaIndex) return 1;
    return aIndex - bIndex;
  });
}

export function getLocalPartsInZone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;

  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    hour,
    minute: parseInt(get("minute"), 10),
  };
}

export function getDateForTimeInTimezone(
  hours: number,
  minutes: number,
  seconds: number,
  timezone: string,
  dateStr: string
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const desiredLocalMs = Date.UTC(year, month - 1, day, hours, minutes, seconds);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  let utcMs = desiredLocalMs;

  for (let i = 0; i < 10; i++) {
    const parts = formatter.formatToParts(new Date(utcMs));
    const get = (type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

    let h = get("hour");
    if (h === 24) h = 0;

    const actualLocalMs = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      h,
      get("minute"),
      get("second")
    );

    const diff = desiredLocalMs - actualLocalMs;
    if (diff === 0) break;
    utcMs += diff;
  }

  return new Date(utcMs);
}

export function toDateInputValue(parts: { year: number; month: number; day: number }) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function formatTimeForZone(
  displayDate: Date,
  timezone: string,
  is24Hour: boolean
) {
  try {
    return displayDate.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: !is24Hour,
    });
  } catch {
    return "00:00";
  }
}

export function formatDateForZone(displayDate: Date, timezone: string) {
  try {
    return displayDate.toLocaleDateString("en-US", {
      timeZone: timezone,
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  } catch {
    return "";
  }
}
