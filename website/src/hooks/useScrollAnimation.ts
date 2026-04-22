"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

interface ScrollRevealOptions {
  delay?: number;
  start?: string;
  toggleActions?: string;
}

export function useScrollReveal<T extends Element>(options?: ScrollRevealOptions) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: options?.delay ?? 0,
          ease: "power3.out",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scrollTrigger: {
            trigger: el,
            start: options?.start ?? "top 85%",
            toggleActions: options?.toggleActions ?? "play none none reverse",
          } as any,
        }
      );
    });

    return () => ctx.revert();
  }, [options?.delay, options?.start, options?.toggleActions]);

  return ref;
}

export function useParallax<T extends Element>(speed = 0.5) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: -20 * speed,
        ease: "none",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        } as any,
      });
    });

    return () => ctx.revert();
  }, [speed]);

  return ref;
}
