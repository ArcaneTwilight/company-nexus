export type CategoryKind = "tools" | "faqs" | "kb" | "metrics" | "links";

export const DEFAULT_CATEGORIES: Record<CategoryKind, string[]> = {
  tools: ["Design", "Operations", "Analytics", "Technology"],
  faqs: ["General", "UI", "Data", "Compliance", "Process"],
  kb: [
    "Git Management",
    "Xcode / App Store",
    "Android Studio / Play Store",
    "Architecture",
    "Feature Config",
    "UI Config",
  ],
  metrics: ["KPIs", "Engineering", "Operations"],
  links: ["Internal", "Mobile Store", "Mobile Dev", "Reference Docs", "Trello", "HR"],
};

const STORAGE_PREFIX = "nexus_custom_categories_";

function storageKey(kind: CategoryKind) {
  return `${STORAGE_PREFIX}${kind}`;
}

export function getStoredCustomCategories(kind: CategoryKind): string[] {
  try {
    const raw = localStorage.getItem(storageKey(kind));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string" && c.trim()) : [];
  } catch {
    return [];
  }
}

export function registerCustomCategory(kind: CategoryKind, category: string): void {
  const trimmed = category.trim();
  if (!trimmed) return;

  const defaults = DEFAULT_CATEGORIES[kind];
  if (defaults.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;

  const existing = getStoredCustomCategories(kind);
  if (existing.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;

  localStorage.setItem(storageKey(kind), JSON.stringify([...existing, trimmed]));
}

export function getCategoryOptions(kind: CategoryKind, extra: string[] = []): string[] {
  const merged = [
    ...DEFAULT_CATEGORIES[kind],
    ...getStoredCustomCategories(kind),
    ...extra,
  ];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const category of merged) {
    const trimmed = category.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result.sort((a, b) => a.localeCompare(b));
}

export function getDefaultCategory(kind: CategoryKind): string {
  return DEFAULT_CATEGORIES[kind][0];
}
