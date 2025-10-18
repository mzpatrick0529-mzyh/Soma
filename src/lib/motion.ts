import type { Variants, Transition, Easing } from "framer-motion";

// Reusable motion variants for youware-style animations
// Bottom-to-top quick pop with slight rebound
const springQuick: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 28,
  mass: 0.6,
};

export const bounceUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: springQuick,
  },
};

// Container that staggers children from bottom to top
export const containerReverseStagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
      staggerDirection: -1, // reverse order: bottom to top
    },
  },
};

// Optional subtle fade for headers/toolbars
const easeOutExpo: Easing = [0.16, 1, 0.3, 1];
export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: easeOutExpo },
  },
};
