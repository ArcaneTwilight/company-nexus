import { type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { durations, transitions } from "../../lib/motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";

type GlassButtonVariant = "primary" | "secondary" | "ghost" | "accent";

interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: GlassButtonVariant;
  iconRight?: ReactNode;
  className?: string;
}

const variantClasses: Record<GlassButtonVariant, string> = {
  primary: "cyber-button-primary cyber-glitch",
  secondary: "cyber-button-secondary",
  ghost: "cyber-button-ghost",
  accent: "cyber-button-accent cyber-glitch",
};

export function GlassButton({
  children,
  variant = "secondary",
  iconRight,
  className = "",
  disabled,
  ...props
}: GlassButtonProps) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      disabled={disabled}
      className={`px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer glass-button focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      whileHover={
        reduced || disabled
          ? undefined
          : { y: -2, boxShadow: "0 8px 24px rgba(56, 189, 248, 0.12)" }
      }
      whileTap={reduced || disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: durations.fast, ease: transitions.enter.ease }}
      {...props}
    >
      <span>{children}</span>
      {iconRight && (
        <motion.span
          className="inline-flex"
          initial={false}
          whileHover={reduced ? undefined : { x: 2 }}
          transition={{ duration: durations.fast }}
        >
          {iconRight}
        </motion.span>
      )}
    </motion.button>
  );
}
