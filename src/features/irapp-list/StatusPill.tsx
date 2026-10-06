import type { IRAppMasterStatusKey } from "../../types";
import { STATUS_BY_KEY } from "./columnConfig";
import { IconTooltip } from "./IconTooltip";

interface StatusPillProps {
  statusKey: IRAppMasterStatusKey;
  label: string;
  compact?: boolean;
}

export function StatusPill({ statusKey, label, compact = false }: StatusPillProps) {
  const meta = STATUS_BY_KEY[statusKey] ?? STATUS_BY_KEY.unknown;
  const displayLabel = meta.key === "unknown" ? label || meta.label : meta.label;
  const labelLines = displayLabel.split(/\s*\/\s*/).filter(Boolean);
  const isMultiline = labelLines.length > 1;

  return (
    <IconTooltip label={meta.tooltip}>
      <span
        className={`inline-flex gap-1.5 rounded-full border px-2 font-mono uppercase tracking-wide ${meta.pillClass} ${
          compact ? "text-[9px]" : "text-[10px]"
        } ${isMultiline ? "items-start py-1" : "items-center py-0.5"}`}
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClass} ${
            isMultiline ? "mt-1" : ""
          }`}
        />
        {isMultiline ? (
          <span className="flex flex-col leading-tight text-left">
            {labelLines.map((line, index) => (
              <span key={`${line}-${index}`} className="whitespace-nowrap">
                {line}
              </span>
            ))}
          </span>
        ) : (
          <span className="whitespace-nowrap">{displayLabel}</span>
        )}
      </span>
    </IconTooltip>
  );
}
