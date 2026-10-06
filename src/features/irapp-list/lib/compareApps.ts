import type { companymasterapp } from "../../../types";
import type { SortState } from "../viewPresets";

function parseSortableDate(value: string): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const iso = Date.parse(value);
  if (!Number.isNaN(iso)) return iso;
  return Number.NEGATIVE_INFINITY;
}

export function compareApps(a: companymasterapp, b: companymasterapp, sort: SortState): number {
  const dir = sort.direction === "asc" ? 1 : -1;
  if (sort.column === "companyName") {
    return a.companyName.localeCompare(b.companyName) * dir;
  }
  const left = parseSortableDate(a[sort.column]);
  const right = parseSortableDate(b[sort.column]);
  if (left === right) return a.companyName.localeCompare(b.companyName);
  return (left - right) * dir;
}
