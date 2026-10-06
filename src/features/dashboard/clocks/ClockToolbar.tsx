import { motion, LayoutGroup } from "motion/react";
import { transitions } from "../../../lib/motion";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

interface ClockToolbarProps {
  compact?: boolean;
  showCustomCheck: boolean;
  timeFormat: "24h" | "ampm";
  onToggleCustomCheck: () => void;
  onTimeFormatChange: (format: "24h" | "ampm") => void;
}

export function ClockToolbar({
  showCustomCheck,
  timeFormat,
  onToggleCustomCheck,
  onTimeFormatChange,
}: ClockToolbarProps) {
  const reduced = useReducedMotion();

  return (
    <LayoutGroup>
      <div className="flex flex-wrap items-center gap-2 relative z-10">
        <motion.button
          type="button"
          onClick={onToggleCustomCheck}
          className={`px-3 py-1.5 rounded-lg text-[14px] font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
            showCustomCheck
              ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300"
              : "bg-panel-elevated border-border text-fg-muted hover:text-fg hover:border-border-strong"
          }`}
          whileTap={reduced ? undefined : { scale: 0.97 }}
          aria-pressed={showCustomCheck}
        >
          Custom Time Check
        </motion.button>
        {(["24h", "ampm"] as const).map((format) => {
          const isActive = timeFormat === format;
          return (
            <motion.button
              key={format}
              type="button"
              onClick={() => onTimeFormatChange(format)}
              className={`relative px-3 py-1.5 rounded-lg text-[14px] font-semibold border transition-colors cursor-pointer ${
                isActive
                  ? format === "24h"
                    ? "text-sky-700 dark:text-sky-300"
                    : "text-indigo-300"
                  : "bg-panel-elevated border-border text-fg-muted hover:text-fg"
              }`}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              aria-pressed={isActive}
            >
              {isActive && !reduced && (
                <motion.span
                  layoutId="clock-format-indicator"
                  className={`absolute inset-0 rounded-lg border ${
                    format === "24h"
                      ? "bg-sky-500/15 border-sky-500/30"
                      : "bg-indigo-500/15 border-indigo-500/30"
                  }`}
                  transition={transitions.layout}
                />
              )}
              {isActive && reduced && (
                <span
                  className={`absolute inset-0 rounded-lg border ${
                    format === "24h"
                      ? "bg-sky-500/15 border-sky-500/30"
                      : "bg-indigo-500/15 border-indigo-500/30"
                  }`}
                />
              )}
              <span className="relative z-10">{format === "24h" ? "24h" : "AM/PM"}</span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
