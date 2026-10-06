import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { eases } from "../lib/motion";

interface WelcomeMessageProps {
  phrases: readonly string[];
  holdMs?: number;
  wipeMs?: number;
}

function pickPhrase(phrases: readonly string[], exclude: string[]): string {
  const pool = phrases.filter((phrase) => !exclude.includes(phrase));
  const source = pool.length > 0 ? pool : phrases;
  return source[Math.floor(Math.random() * source.length)];
}

const textClass =
  "text-sm sm:text-base text-fg-muted font-sans whitespace-nowrap";

export function WelcomeMessage({
  phrases,
  holdMs = 60_000,
  wipeMs = 1300,
}: WelcomeMessageProps) {
  const recentRef = useRef<string[]>([]);
  const displayedRef = useRef(pickPhrase(phrases, []));
  const [displayed, setDisplayed] = useState(displayedRef.current);
  const [incoming, setIncoming] = useState<string | null>(null);
  const [wipePercent, setWipePercent] = useState(0);
  const isWiping = incoming !== null;

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;
    let wipeControl: { stop: () => void } | null = null;

    const runCycle = () => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;

        const current = displayedRef.current;
        const exclude = [current, ...recentRef.current.slice(0, 2)];
        const next = pickPhrase(phrases, exclude);
        setIncoming(next);
        setWipePercent(0);

        wipeControl = animate(0, 100, {
          duration: wipeMs / 1000,
          ease: eases.default,
          onUpdate: (value) => {
            if (!cancelled) setWipePercent(value);
          },
          onComplete: () => {
            if (cancelled) return;
            displayedRef.current = next;
            setDisplayed(next);
            setIncoming(null);
            setWipePercent(0);
            recentRef.current = [next, ...recentRef.current].slice(0, 3);
            runCycle();
          },
        });
      }, holdMs);
    };

    runCycle();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      wipeControl?.stop();
    };
  }, [phrases, holdMs, wipeMs]);

  return (
    <div
      className="relative inline-flex items-center justify-center min-h-[1.6em] max-w-full"
      aria-live="polite"
    >
      <span className={`${textClass} opacity-0 pointer-events-none select-none`}>
        {incoming ?? displayed}
      </span>

      <span
        className={`absolute inset-0 flex items-center justify-center ${textClass}`}
        style={
          isWiping
            ? { clipPath: `inset(0 0 0 ${wipePercent}%)` }
            : undefined
        }
      >
        {displayed}
      </span>

      {incoming && (
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - wipePercent}% 0 0)` }}
        >
          <span className={textClass}>{incoming}</span>

          <div
            className="welcome-wipe-edge pointer-events-none absolute top-[-4px] bottom-[-4px] w-[10px] -translate-x-1/2"
            style={{ left: `${wipePercent}%` }}
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}
