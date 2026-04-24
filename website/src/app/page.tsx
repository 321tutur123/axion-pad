"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollProgress } from "@/lib/scrollProgress";
import ScrollReveal from "@/components/animations/ScrollReveal";

const ScrollScene = dynamic(() => import("@/components/3d/ScrollScene"), { ssr: false });

const FEATURES = [
  { title: "12 Touches macro", desc: "Programmables individuellement via l'app de configuration desktop." },
  { title: "4 Potentiomètres", desc: "Contrôle du volume par application (protocole AxionPad Native)." },
  { title: "RP2040 + CircuitPython", desc: "Firmware open-source, hackable à l'infini sans recompiler." },
  { title: "USB-C natif", desc: "Plug & play sur Windows, macOS et Linux." },
];

const SCROLL_STEPS = [
  { at: 0.05, title: "Design compact", body: "12 touches mécaniques dans un format minimaliste." },
  { at: 0.45, title: "Intérieur RP2040", body: "Microcontrôleur dual-core 133 MHz. Firmware CircuitPython." },
  { at: 0.75, title: "PCB sur mesure", body: "4 potentiomètres ALPS pour un contrôle audio précis." },
];

export default function HomePage() {
  const scrollSectionRef = useRef<HTMLElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!scrollSectionRef.current) return;

    // Pilote scrollProgress depuis ScrollTrigger — zéro re-render
    const trigger = ScrollTrigger.create({
      trigger: scrollSectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: self => { scrollProgress.current = self.progress; },
    });

    // Labels fade in/out selon la progression
    labelRefs.current.forEach((el, i) => {
      if (!el) return;
      const step = SCROLL_STEPS[i];
      const start = step.at;
      const peak  = start + 0.12;
      const end   = start + 0.28;

      ScrollTrigger.create({
        trigger: scrollSectionRef.current,
        start: `${start * 100}% top`,
        end:   `${end   * 100}% top`,
        scrub: true,
        onUpdate: self => {
          const p = self.progress;
          const opacity = p < 0.5
            ? gsap.utils.mapRange(0, 0.5, 0, 1, p)
            : gsap.utils.mapRange(0.5, 1, 1, 0, p);
          gsap.set(el, { opacity, y: gsap.utils.mapRange(0, 1, 20, 0, Math.min(p * 2, 1)) });
        },
      });
    });

    return () => { trigger.kill(); ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <main className="bg-black">

      {/* ── Scrollytelling ─────────────────────────────────────────── */}
      <section
        ref={scrollSectionRef}
        className="relative"
        style={{ height: "300vh" }}
      >
        {/* Canvas collé en sticky */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <ScrollScene />

          {/* Titre initial (disparaît au scroll) */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 pointer-events-none z-10">
            <div className="text-center px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Disponible maintenant
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-5 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                Axion Pad
              </h1>
              <p className="text-zinc-400 text-lg mb-8 max-w-sm mx-auto">
                Scroll pour explorer
              </p>
              <div className="animate-bounce">
                <svg className="w-5 h-5 text-zinc-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Labels scroll — apparaissent progressivement */}
          {SCROLL_STEPS.map((step, i) => (
            <div
              key={i}
              ref={el => { labelRefs.current[i] = el; }}
              className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 max-w-xs opacity-0 pointer-events-none z-10"
              style={{ transform: "translateY(calc(-50% + 20px)" }}
            >
              <div className="border-l-2 border-violet-500 pl-4">
                <h3 className="text-white font-bold text-xl mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA apparu en bas de la section */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-4 z-20 pointer-events-auto">
          <Link
            href="/shop"
            className="px-8 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-violet-900/40"
          >
            Commander — 79€
          </Link>
          <Link
            href="/about"
            className="px-8 py-3.5 rounded-full border border-white/20 hover:border-white/40 text-zinc-300 hover:text-white transition-all"
          >
            En savoir plus
          </Link>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="py-32 px-6 max-w-6xl mx-auto">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Conçu pour aller vite
          </h2>
          <p className="text-zinc-500 text-center mb-16 max-w-xl mx-auto">
            Chaque détail a été pensé pour maximiser ta productivité.
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.08}>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-colors group">
                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-violet-300 transition-colors">
                  {f.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center">
        <ScrollReveal>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Prêt à passer au niveau supérieur ?
          </h2>
          <Link
            href="/shop"
            className="inline-flex px-10 py-4 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-all hover:scale-105"
          >
            Acheter maintenant
          </Link>
        </ScrollReveal>
      </section>
    </main>
  );
}
