import { type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cardHover, transitions } from "../../lib/motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  layout?: boolean;
  index?: number;
}

export function GlassCard({
  children,
  className = "",
  layout = false,
  index = 0,
  ...props
}: GlassCardProps) {
  const reduced = useReducedMotion();
  const hover = cardHover(reduced);

  return (
    <motion.div
      layout={layout}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -6 }}
      transition={{
        ...transitions.enter,
        delay: reduced ? 0 : index * 0.05,
      }}
      whileHover={hover.whileHover}
      whileTap={hover.whileTap}
      className={`rounded-2xl bg-panel border border-border hover:border-border-strong transition-colors hover:shadow-xl hover:shadow-indigo-500/5 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
