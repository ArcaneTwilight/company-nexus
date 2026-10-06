import { motion } from "motion/react";
import type { TimezoneConfig } from "../../../types";
import { AnimatedTime } from "../../../components/motion";
import { transitions } from "../../../lib/motion";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { EditableTime } from "./EditableTime";

interface ClockCardProps {
  tz: TimezoneConfig;
  index: number;
  compact?: boolean;
  showCustomCheck: boolean;
  isSource: boolean;
  is24Hour: boolean;
  timeStr: string;
  dateStr: string;
  dateDiffers: boolean;
  customHours: number;
  customMinutes: number;
  customDate: string;
  onSelectRegion: (name: string) => void;
  onCustomTimeChange: (hours: number, minutes: number) => void;
  onCustomDateChange: (date: string) => void;
}

export function ClockCard({
  tz,
  index,
  compact = false,
  showCustomCheck,
  isSource,
  is24Hour,
  timeStr,
  dateStr,
  dateDiffers,
  customHours,
  customMinutes,
  customDate,
  onSelectRegion,
  onCustomTimeChange,
  onCustomDateChange,
}: ClockCardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      layout
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{ ...transitions.enter, delay: reduced ? 0 : index * 0.03 }}
      role={showCustomCheck ? "button" : undefined}
      tabIndex={showCustomCheck ? 0 : undefined}
      onClick={() => onSelectRegion(tz.name)}
      onKeyDown={(e) => {
        if (showCustomCheck && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelectRegion(tz.name);
        }
      }}
      whileHover={reduced ? undefined : { y: -2 }}
      className={`rounded-xl bg-panel border flex flex-col items-center justify-center text-center transition-colors group ${
        compact ? "p-3" : "p-3.5"
      } ${showCustomCheck ? "cursor-pointer hover:bg-panel-elevated" : "hover:bg-panel-elevated"} ${
        isSource
          ? "border-amber-500/40 ring-1 ring-amber-500/20"
          : "border-border hover:border-border"
      }`}
    >
      <span
        className={`font-semibold font-sans transition-colors ${
          compact ? "text-[13px] sm:text-[14px]" : "text-[14px]"
        } ${isSource ? "text-amber-700 dark:text-amber-300" : "text-fg-muted group-hover:text-sky-400"}`}
      >
        {tz.name}
      </span>
      <span className="text-[12px] text-fg-subtle font-mono mt-0.5">
        {tz.label.match(/\([^)]*\)$/)?.[0] || ""}
      </span>

      {isSource ? (
        <EditableTime
          hours24={customHours}
          minutes={customMinutes}
          is24Hour={is24Hour}
          onChange={onCustomTimeChange}
        />
      ) : (
        <AnimatedTime
          time={timeStr}
          highlight={!showCustomCheck && tz.name === "Manila"}
          className={`font-bold font-mono tracking-tight mt-2 block ${
            compact ? "text-[17px] sm:text-[18px]" : "text-[20px]"
          } ${
            !showCustomCheck && tz.name === "Manila"
              ? "text-amber-700 dark:text-amber-300"
              : "text-fg bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
          }`}
        />
      )}

      {isSource ? (
        <input
          type="date"
          value={customDate}
          onChange={(e) => onCustomDateChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 px-1.5 py-0.5 rounded bg-panel-elevated border border-amber-500/30 text-fg-muted text-[11px] font-mono focus:outline-none focus:border-amber-500/60 cursor-pointer"
        />
      ) : (
        <span
          className={`text-[12px] font-mono mt-1 opacity-80 ${
            showCustomCheck && dateDiffers ? "text-amber-700 dark:text-amber-300" : "text-fg-muted"
          }`}
        >
          {dateStr}
        </span>
      )}
    </motion.div>
  );
}
