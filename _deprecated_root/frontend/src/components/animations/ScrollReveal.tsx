"use client";

import { ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollAnimation";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function ScrollReveal({ children, className = "", delay }: ScrollRevealProps) {
  const ref = useScrollReveal<HTMLDivElement>(delay !== undefined ? { delay } : undefined);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
