import type { Transition, Variants } from "motion/react";

/** Global motion tokens — 150–300 ms for UI, soft easing for entrances */
export const durations = {
  instant: 0,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  reveal: 0.6,
} as const;

export const eases = {
  default: [0.42, 0, 0.2, 1] as const,
  enter: [0, 0, 0.2, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  smooth: "easeOut" as const,
  inOut: "easeInOut" as const,
};

export const transitions = {
  enter: { duration: durations.normal, ease: eases.enter } satisfies Transition,
  exit: { duration: durations.fast, ease: eases.exit } satisfies Transition,
  page: { duration: durations.normal, ease: eases.default } satisfies Transition,
  accordion: { duration: durations.normal, ease: eases.inOut } satisfies Transition,
  spring: { type: "spring", stiffness: 260, damping: 22 } satisfies Transition,
  springSoft: { type: "spring", stiffness: 200, damping: 20 } satisfies Transition,
  layout: { duration: durations.normal, ease: eases.default } satisfies Transition,
  stagger: 0.05,
} as const;

export const fadeSlideUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeSlideDown = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const fadeScale = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: transitions.stagger, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: transitions.enter,
  },
};

/** Returns instant transitions when reduced motion is preferred */
export function withReducedMotion<T extends Transition>(
  transition: T,
  reduced: boolean
): T | { duration: 0 } {
  return reduced ? { duration: 0 } : transition;
}

export function motionProps(reduced: boolean) {
  return {
    initial: reduced ? false : fadeSlideUp.initial,
    animate: fadeSlideUp.animate,
    exit: reduced ? undefined : fadeSlideUp.exit,
    transition: withReducedMotion(transitions.page, reduced),
  };
}

export function hoverLift(reduced: boolean) {
  if (reduced) return {};
  return {
    whileHover: { y: -2, transition: transitions.enter },
    whileTap: { scale: 0.98, transition: { duration: durations.fast } },
  };
}

export function cardHover(reduced: boolean) {
  if (reduced) return {};
  return {
    whileHover: {
      y: -3,
      transition: transitions.enter,
    },
    whileTap: { scale: 0.995, transition: { duration: durations.fast } },
  };
}
