import { type ReactNode } from "react";
import { motion } from "motion/react";
import { fadeScale, transitions } from "../../lib/motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : fadeScale.initial}
      animate={fadeScale.animate}
      transition={transitions.enter}
      className="p-12 text-center bg-panel/50 rounded-xl border border-dashed border-border"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...transitions.enter, delay: reduced ? 0 : 0.08 }}
        className="text-fg-subtle mx-auto mb-2 flex justify-center"
      >
        {icon}
      </motion.div>
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...transitions.enter, delay: reduced ? 0 : 0.14 }}
        className="text-fg-muted font-sans"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

interface DropdownPanelProps {
  children: ReactNode;
  className?: string;
}

export function DropdownPanel({ children, className = "" }: DropdownPanelProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, y: 6, scale: 0.99 }}
      transition={transitions.enter}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.enter}
      className="mb-6"
    >
      <h2 className="text-2xl font-bold font-display text-fg tracking-tight">{title}</h2>
      {description && (
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...transitions.enter, delay: reduced ? 0 : 0.06 }}
          className="text-xs sm:text-sm text-fg-muted mt-1"
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}

interface AccordionPanelProps {
  children: ReactNode;
  className?: string;
}

export function AccordionPanel({ children, className = "" }: AccordionPanelProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={reduced ? undefined : { height: 0, opacity: 0 }}
      transition={transitions.accordion}
      className={`overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className = "" }: ShimmerProps) {
  return (
    <div
      className={`animate-shimmer rounded-lg bg-panel ${className}`}
      aria-hidden
    />
  );
}

interface LoadingPulseProps {
  label: string;
  children?: ReactNode;
}

export function LoadingPulse({ label, children }: LoadingPulseProps) {
  const reduced = useReducedMotion();

  return (
    <div className="min-h-screen bg-ambient flex flex-col items-center justify-center gap-4 text-fg-muted font-mono text-sm px-6 text-center">
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <Shimmer className="h-6 w-6 rounded-full" />
        <Shimmer className="h-3 w-48" />
        {!reduced && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="text-xs"
          >
            {label}
          </motion.span>
        )}
        {reduced && <span className="text-xs">{label}</span>}
      </div>
      {children}
    </div>
  );
}

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
}

export function StaggerGrid({ children, className = "" }: StaggerGridProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : "hidden"}
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: reduced ? 0 : 0.05 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      variants={
        reduced
          ? undefined
          : {
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: transitions.enter },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
