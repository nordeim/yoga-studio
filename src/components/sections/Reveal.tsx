"use client";

import { type ElementType, type ReactNode } from "react";
import { useReveal } from "@/hooks/use-reveal";

interface RevealProps {
  children: ReactNode;
  /** 0 = no delay, 1..4 = sequential delays (120ms steps). */
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
  as?: ElementType;
  /** When false, re-fires on every scroll-back in. */
  once?: boolean;
}

const DELAY_CLASS: Record<number, string> = {
  0: "",
  1: "delay-1",
  2: "delay-2",
  3: "delay-3",
  4: "delay-4",
};

/**
 * Wraps children in a fade-up reveal driven by IntersectionObserver.
 * Renders as a `div` by default; pass `as="article"` etc. to override.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as,
  once = true,
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, revealed } = useReveal<HTMLElement>({ once });
  return (
    <Tag
      ref={ref}
      className={`fade-up ${DELAY_CLASS[delay] ?? ""} ${
        revealed ? "fade-up-in" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
