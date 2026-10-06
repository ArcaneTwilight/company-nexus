import { useState, useEffect, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TIMEZONES_TO_SHOW } from "../../../data";
import { transitions } from "../../../lib/motion";
import { ClockCard } from "./ClockCard";
import { ClockToolbar } from "./ClockToolbar";
import {
  formatDateForZone,
  formatTimeForZone,
  getDateForTimeInTimezone,
  getLocalPartsInZone,
  sortTimezonesWestward,
  toDateInputValue,
} from "./clockUtils";

interface ClockSectionProps {
  compact?: boolean;
}

export default function ClockSection({ compact = false }: ClockSectionProps) {
  const [time, setTime] = useState(new Date());
  const [timeFormat, setTimeFormat] = useState<"24h" | "ampm">("ampm");
  const [showCustomCheck, setShowCustomCheck] = useState(false);
  const [sourceRegion, setSourceRegion] = useState("Manila");
  const [customDate, setCustomDate] = useState("");
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(0);

  const is24Hour = timeFormat === "24h";
  const sourceTimezone =
    TIMEZONES_TO_SHOW.find((tz) => tz.name === sourceRegion)?.timezone ?? "Asia/Manila";

  useEffect(() => {
    if (showCustomCheck) return;
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [showCustomCheck]);

  const displayDate = useMemo(() => {
    if (!showCustomCheck || !customDate) return time;
    return getDateForTimeInTimezone(
      customHours,
      customMinutes,
      0,
      sourceTimezone,
      customDate
    );
  }, [showCustomCheck, customDate, customHours, customMinutes, sourceTimezone, time]);

  const orderedTimezones = useMemo(
    () => sortTimezonesWestward(TIMEZONES_TO_SHOW, displayDate),
    [displayDate]
  );

  const sourceMonthDay = useMemo(() => {
    if (!customDate) return null;
    const [, month, day] = customDate.split("-").map(Number);
    return { month, day };
  }, [customDate]);

  function syncFieldsFromInstant(instant: Date, regionName: string) {
    const timezone =
      TIMEZONES_TO_SHOW.find((tz) => tz.name === regionName)?.timezone ?? "Asia/Manila";
    const parts = getLocalPartsInZone(instant, timezone);
    setCustomDate(toDateInputValue(parts));
    setCustomHours(parts.hour);
    setCustomMinutes(parts.minute);
  }

  function enableCustomCheck() {
    syncFieldsFromInstant(time, sourceRegion);
    setShowCustomCheck(true);
  }

  function disableCustomCheck() {
    setShowCustomCheck(false);
    setTime(new Date());
  }

  function handleSelectRegion(regionName: string) {
    if (!showCustomCheck) return;
    setSourceRegion(regionName);
    syncFieldsFromInstant(displayDate, regionName);
  }

  function isDateDifferentFromSource(timezone: string) {
    if (!showCustomCheck || !sourceMonthDay) return false;
    const parts = getLocalPartsInZone(displayDate, timezone);
    return (
      parts.month !== sourceMonthDay.month || parts.day !== sourceMonthDay.day
    );
  }

  return (
    <div
      className={`rounded-2xl glass-container border border-border relative overflow-hidden ${
        compact ? "p-4 sm:p-5" : "p-6"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 relative z-10">
        <h2
          className={`font-bold font-display text-fg ${compact ? "text-lg sm:text-xl" : "text-[22px]"}`}
        >
          Global Team Clocks
        </h2>

        <ClockToolbar
          compact={compact}
          showCustomCheck={showCustomCheck}
          timeFormat={timeFormat}
          onToggleCustomCheck={() =>
            showCustomCheck ? disableCustomCheck() : enableCustomCheck()
          }
          onTimeFormatChange={setTimeFormat}
        />
      </div>

      {showCustomCheck && (
        <p className="text-[12px] text-amber-700/80 dark:text-amber-300/80 font-mono mb-4 text-center relative z-10">
          Tap a region card to select it, then edit the time and date directly on that card
        </p>
      )}

      <motion.div
        layout
        className={`grid gap-4 relative z-10 ${
          compact
            ? "grid-cols-3 sm:grid-cols-5 lg:grid-cols-9"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-9"
        }`}
        transition={transitions.layout}
      >
        <AnimatePresence mode="popLayout">
          {orderedTimezones.map((tz, index) => (
            <Fragment key={tz.name}>
              <ClockCard
              tz={tz}
              index={index}
              compact={compact}
              showCustomCheck={showCustomCheck}
              isSource={showCustomCheck && tz.name === sourceRegion}
              is24Hour={is24Hour}
              timeStr={formatTimeForZone(displayDate, tz.timezone, is24Hour)}
              dateStr={formatDateForZone(displayDate, tz.timezone)}
              dateDiffers={isDateDifferentFromSource(tz.timezone)}
              customHours={customHours}
              customMinutes={customMinutes}
              customDate={customDate}
              onSelectRegion={handleSelectRegion}
              onCustomTimeChange={(h, m) => {
                setCustomHours(h);
                setCustomMinutes(m);
              }}
              onCustomDateChange={setCustomDate}
            />
            </Fragment>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
