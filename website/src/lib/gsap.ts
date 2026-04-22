"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

export { gsap, ScrollTrigger, ScrollSmoother };

export const fadeInUp = (element: string | Element, delay = 0) =>
  gsap.fromTo(
    element,
    { opacity: 0, y: 60 },
    { opacity: 1, y: 0, duration: 0.9, delay, ease: "power3.out" }
  );

export const staggerReveal = (elements: string | Element[], stagger = 0.12) =>
  gsap.fromTo(
    elements,
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.8, stagger, ease: "power2.out" }
  );
