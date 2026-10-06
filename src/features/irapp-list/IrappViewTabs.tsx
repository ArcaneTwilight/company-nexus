import { VIEW_PRESETS, VIEW_PRESET_BY_ID, type SavedViewId } from "./viewPresets";

interface IrappViewTabsProps {
  activeViewId: SavedViewId;
  onSelectView: (viewId: SavedViewId) => void;
}

export function IrappViewTabs({ activeViewId, onSelectView }: IrappViewTabsProps) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-fg-subtle">
        Saved views
      </p>
      <div
        className="flex w-full gap-1.5 overflow-x-auto rounded-xl border border-border bg-panel-solid p-1"
        role="tablist"
        aria-label="Saved table views"
      >
        {VIEW_PRESETS.map((preset) => {
          const isActive = activeViewId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={preset.description}
              onClick={() => onSelectView(preset.id)}
              className={`relative shrink-0 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/35"
                  : "text-fg-muted hover:bg-white/5 hover:text-fg"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-fg-subtle">
        {VIEW_PRESET_BY_ID[activeViewId].description}
      </p>
    </div>
  );
}
