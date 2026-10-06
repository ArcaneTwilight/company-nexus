import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { durations, transitions } from "../../lib/motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface ParsedValue {
  prefix: string;
  number: number;
  suffix: string;
  decimals: number;
}

function parseMetricValue(value: string): ParsedValue | null {
  const match = value.match(/^([^0-9.-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  const [, prefix, numStr, suffix] = match;
  const number = parseFloat(numStr.replace(/,/g, ""));
  if (Number.isNaN(number)) return null;

  const decimalPart = numStr.includes(".") ? numStr.split(".")[1].length : 0;

  return { prefix, number, suffix, decimals: decimalPart };
}

function formatNumber(n: number, decimals: number): string {
  return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
}

interface AnimatedNumberProps {
  value: string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  className = "",
  duration = 0.8,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const parsed = parseMetricValue(value);
  const displayRef = useRef(parsed?.number ?? 0);
  const [display, setDisplay] = useState(parsed?.number ?? 0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (!parsed) return;

    if (reduced || prevValue.current === value) {
      setDisplay(parsed.number);
      displayRef.current = parsed.number;
      prevValue.current = value;
      return;
    }

    prevValue.current = value;
    const start = displayRef.current;
    const end = parsed.number;
    const startTime = performance.now();
    const ms = duration * 1000;

    let frame: number;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / ms, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + (end - start) * eased;
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, parsed, reduced, duration]);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  const shown = reduced ? parsed.number : display;

  return (
    <span className={className}>
      {parsed.prefix}
      {formatNumber(shown, parsed.decimals)}
      {parsed.suffix}
    </span>
  );
}

interface AnimatedTimeProps {
  time: string;
  className?: string;
  highlight?: boolean;
}

export function AnimatedTime({ time, className = "", highlight = false }: AnimatedTimeProps) {
  const reduced = useReducedMotion();
  const prevTime = useRef(time);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (reduced || prevTime.current === time) {
      prevTime.current = time;
      return;
    }
    prevTime.current = time;
    setPulse(true);
    const id = window.setTimeout(() => setPulse(false), 400);
    return () => window.clearTimeout(id);
  }, [time, reduced]);

  if (reduced) {
    return <span className={className}>{time}</span>;
  }

  return (
    <span className={`relative inline-block ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={time}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: durations.fast, ease: transitions.enter.ease }}
          className="inline-block"
        >
          {time}
        </motion.span>
      </AnimatePresence>
      {pulse && highlight && (
        <motion.span
          className="absolute inset-0 rounded-md bg-amber-400/10 pointer-events-none"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </span>
  );
}
