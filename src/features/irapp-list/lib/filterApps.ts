import type { HasChangesValue, companymasterapp, IRAppMasterStatusKey } from "../../../types";
import { normalizeHasChanges } from "../../../lib/companyAppNormalize";
import { STATUS_BY_KEY } from "../columnConfig";
import { compareApps } from "./compareApps";
import type { SortState } from "../viewPresets";

export function filterApps(
  apps: companymasterapp[],
  searchTerm: string,
  statusFilter: Set<IRAppMasterStatusKey>,
  hasChangesFilter: Set<HasChangesValue>,
  sort: SortState
): companymasterapp[] {
  const query = searchTerm.trim().toLowerCase();
  const filtered = apps.filter((app) => {
    if (statusFilter.size > 0 && !statusFilter.has(app.statusKey)) return false;

    const hasChanges = normalizeHasChanges(app.hasChanges);
    if (hasChangesFilter.size > 0 && !hasChangesFilter.has(hasChanges)) return false;

    if (!query) return true;

    const haystack = [
      app.companyName,
      app.statusLabel,
      STATUS_BY_KEY[app.statusKey]?.label ?? "",
      app.liveVersion,
      app.upgradeOrNewOrder,
      app.comments,
      hasChanges,
      app.country,
      app.market,
      app.stockExchange,
      app.salesOnboardingPocRaw,
      app.marketingMaterialRaw,
      ...app.salesOnboardingPoc,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  return [...filtered].sort((a, b) => compareApps(a, b, sort));
}
