import { pad } from "./clockUtils";

interface EditableTimeProps {
  hours24: number;
  minutes: number;
  is24Hour: boolean;
  onChange: (hours24: number, minutes: number) => void;
}

export function EditableTime({ hours24, minutes, is24Hour, onChange }: EditableTimeProps) {
  const inputClass =
    "w-10 sm:w-12 px-1 py-0.5 rounded bg-panel-elevated border border-amber-500/30 text-fg text-[16px] sm:text-[18px] font-mono text-center focus:outline-none focus:border-amber-500/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  function clampHour24(value: number) {
    return Math.min(23, Math.max(0, value));
  }

  function clampMinute(value: number) {
    return Math.min(59, Math.max(0, value));
  }

  function clampHour12(value: number) {
    return Math.min(12, Math.max(1, value));
  }

  if (is24Hour) {
    return (
      <div
        className="flex items-center justify-center gap-0.5 mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="number"
          min={0}
          max={23}
          value={pad(hours24)}
          onChange={(e) =>
            onChange(clampHour24(parseInt(e.target.value, 10) || 0), minutes)
          }
          className={inputClass}
          aria-label="Hours"
        />
        <span className="text-[18px] font-bold font-mono text-fg">:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={pad(minutes)}
          onChange={(e) =>
            onChange(hours24, clampMinute(parseInt(e.target.value, 10) || 0))
          }
          className={inputClass}
          aria-label="Minutes"
        />
      </div>
    );
  }

  const hour12 = hours24 % 12 || 12;
  const period = hours24 >= 12 ? "PM" : "AM";

  function setHour12(nextHour12: number) {
    const clamped = clampHour12(nextHour12);
    const nextHours24 = period === "PM" ? (clamped % 12) + 12 : clamped % 12;
    onChange(nextHours24 === 24 ? 12 : nextHours24, minutes);
  }

  function togglePeriod() {
    onChange(period === "AM" ? hours24 + 12 : hours24 - 12, minutes);
  }

  return (
    <div
      className="flex items-center justify-center gap-1 mt-2 flex-wrap"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="number"
        min={1}
        max={12}
        value={hour12}
        onChange={(e) => setHour12(parseInt(e.target.value, 10) || 12)}
        className={inputClass}
        aria-label="Hours"
      />
      <span className="text-[18px] font-bold font-mono text-fg">:</span>
      <input
        type="number"
        min={0}
        max={59}
        value={pad(minutes)}
        onChange={(e) => onChange(hours24, clampMinute(parseInt(e.target.value, 10) || 0))}
        className={inputClass}
        aria-label="Minutes"
      />
      <button
        type="button"
        onClick={togglePeriod}
        className="px-2 py-0.5 rounded bg-panel-elevated border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[12px] font-mono font-semibold hover:border-amber-500/60 transition-colors cursor-pointer"
      >
        {period}
      </button>
    </div>
  );
}
