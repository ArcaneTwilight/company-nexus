import { VIEW_PRESET_BY_ID, type SavedViewId } from "./viewPresets";

interface IrappResultsSummaryProps {
  filteredCount: number;
  totalCount: number;
  activeViewId: SavedViewId;
}

export function IrappResultsSummary({
  filteredCount,
  totalCount,
  activeViewId,
}: IrappResultsSummaryProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px] text-fg-subtle">
      <p>
        Showing <span className="font-mono text-fg-muted">{filteredCount}</span> of{" "}
        <span className="font-mono text-fg-muted">{totalCount}</span> apps
        <span className="mx-2 text-fg-subtle">·</span>
        <span className="text-fg-muted">{VIEW_PRESET_BY_ID[activeViewId].label}</span>
      </p>
      <p className="hidden sm:block">
        Use Edit to update comments and fields — changes sync to Firebase
      </p>
    </div>
  );
}
