import type { HasChangesValue } from "../../../types";

export function HasChangesBadge({ value }: { value: HasChangesValue }) {
  const isYes = value === "Yes";
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        isYes
          ? "border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-200"
          : "border-border bg-white/5 text-fg-muted"
      }`}
    >
      {value}
    </span>
  );
}
