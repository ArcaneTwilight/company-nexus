import { type ReactNode, useId } from "react";

interface IconTooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom";
}

/** Compact hover tooltip for icons and dense controls. */
export function IconTooltip({
  label,
  children,
  className = "",
  side = "top",
}: IconTooltipProps) {
  const tipId = useId();
  const position =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-1.5"
      : "top-full left-1/2 -translate-x-1/2 mt-1.5";

  return (
    <span className={`relative inline-flex group/tip ${className}`}>
      <span aria-describedby={tipId} className="inline-flex">
        {children}
      </span>
      <span
        id={tipId}
        role="tooltip"
        className={`pointer-events-none absolute ${position} z-40 w-max max-w-[14rem] rounded-md border border-border bg-panel-elevated px-2 py-1 text-[10px] leading-snug text-fg opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100`}
      >
        {label}
      </span>
    </span>
  );
}
