import type { HasChangesValue, companymasterapp } from "../types";

/** Coerce any stored/legacy value to the strict Yes/No contract. */
export function normalizeHasChanges(value: unknown): HasChangesValue {
  if (value === "Yes" || value === "yes" || value === true || value === "Y" || value === "y") {
    return "Yes";
  }
  return "No";
}

/** Ensure Firestore / localStorage docs satisfy the current master-list shape. */
export function normalizecompanyApp(raw: companymasterapp): companymasterapp {
  return {
    ...raw,
    hasChanges: normalizeHasChanges(raw.hasChanges),
  };
}

export function normalizecompanyApps(items: companymasterapp[]): companymasterapp[] {
  return items.map(normalizecompanyApp);
}
