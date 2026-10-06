import { type ReactNode } from "react";
import { motion } from "motion/react";
import { fadeSlideUp, motionProps } from "../../lib/motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const reduced = useReducedMotion();
  const props = motionProps(reduced);

  return (
    <motion.div
      initial={props.initial}
      animate={props.animate}
      exit={props.exit}
      transition={props.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { fadeSlideUp };
