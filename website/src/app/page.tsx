"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollProgress } from "@/lib/scrollProgress";
import ScrollReveal from "@/components/animations/ScrollReveal";

const ScrollScene = dynamic(() => import("@/components/3d/ScrollScene"), { ssr: false });

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: "12 Touches macro",
    desc: "Programmables individuellement via l'app de configuration desktop.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    title: "4 Potentiomètres ALPS",
    desc: "Contrôle du volume par application, précis et silencieux.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    title: "RP2040 + CircuitPython",
    desc: "Firmware open-source, hackable à l'infini sans recompiler.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "USB-C natif",
    desc: "Plug & play sur Windows, macOS et Linux. Aucun driver requis.",
  },
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

    const triggers: ReturnType<typeof ScrollTrigger.create>[] = [];

    triggers.push(
      ScrollTrigger.create({
        trigger: scrollSectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: self => { scrollProgress.current = self.progress; },
      })
    );

    labelRefs.current.forEach((el, i) => {
      if (!el) return;
      const step = SCROLL_STEPS[i];
      const start = step.at;
      const end   = start + 0.28;

      triggers.push(
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
        })
      );
    });

    return () => { triggers.forEach(t => t.kill()); };
  }, []);

  return (
    <main style={{ background: "transparent" }}>

      {/* ── Hero scrollytelling ──────────────────────────────────────── */}
      <section
        ref={scrollSectionRef}
        className="relative"
        style={{ height: "300vh" }}
      >
        {/* Canvas sticky */}
        <div className="sticky top-0 h-screen w-full overflow-hidden scene-3d-shell">
          <div className="scene-3d-atmosphere" aria-hidden />
          <div className="scene-3d-canvas-wrap">
            <ScrollScene />
          </div>

          {/* Titre initial */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 pointer-events-none z-[2]">
            <div className="text-center px-4">
              <span className="badge mb-5 inline-flex">
                <span
                  className="w-1.5 h-1.5 rounded-full mr-2 animate-pulse"
                  style={{ background: "var(--color-accent)" }}
                />
                Disponible maintenant
              </span>

              <h1
                className="font-semibold mb-4 tracking-tight"
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  letterSpacing: "-0.02em",
                  color: "var(--color-text)",
                  lineHeight: 1.1,
                }}
              >
                Conçu pour aller vite
              </h1>

              <p
                className="mb-8 max-w-sm mx-auto"
                style={{
                  fontSize: "1rem",
                  color: "var(--color-text-mute)",
                  lineHeight: 1.7,
                }}
              >
                Scroll pour explorer l'Axion Pad
              </p>

              <div className="animate-bounce">
                <svg
                  className="w-5 h-5 mx-auto"
                  style={{ color: "var(--color-text-mute)" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Labels scroll */}
          {SCROLL_STEPS.map((step, i) => (
            <div
              key={i}
              ref={el => { labelRefs.current[i] = el; }}
              className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 max-w-xs opacity-0 pointer-events-none z-[2]"
            >
              <div
                className="pl-4"
                style={{ borderLeft: "2px solid var(--color-accent)" }}
              >
                <h3
                  className="font-semibold text-xl mb-2"
                  style={{ color: "var(--color-text)" }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-mute)", lineHeight: 1.7 }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA bas de section */}
        <div className="absolute bottom-12 left-0 right-0 flex flex-col sm:flex-row justify-center items-center gap-4 z-20 pointer-events-auto px-4">
          <Link href="/shop" className="btn-accent w-full sm:w-auto text-center" style={{ padding: "14px 40px" }}>
            Commander — 79 €
          </Link>
          <Link href="/about" className="btn-ghost">
            Voir la démo →
          </Link>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section
        className="px-6"
        style={{ padding: "96px 24px", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="max-w-[1100px] mx-auto">
          <ScrollReveal>
            <h2
              className="text-center font-semibold mb-3"
              style={{ fontSize: "28px", color: "var(--color-text)", letterSpacing: "-0.01em" }}
            >
              Pourquoi Axion Pad ?
            </h2>
            <p
              className="text-center mb-14 max-w-xl mx-auto"
              style={{ fontSize: "1rem", color: "var(--color-text-mute)", lineHeight: 1.7 }}
            >
              Chaque détail a été pensé pour maximiser ta productivité sans compromis.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-4 lg:grid-cols-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 col-span-full gap-5">
              {FEATURES.map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 0.08}>
                  <div className="card p-6" style={{ height: "100%" }}>
                    <div style={{ color: "var(--color-accent)", marginBottom: "1rem" }}>
                      {f.icon}
                    </div>
                    <h3
                      className="font-medium mb-2"
                      style={{ fontSize: "16px", color: "var(--color-text)" }}
                    >
                      {f.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: "var(--color-text-mute)", lineHeight: 1.7 }}>
                      {f.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Valeurs ─────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", background: "transparent" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                badge: "🇫🇷 Fabriqué en France",
                title: "Assemblé à Orléans",
                desc: "Chaque pièce est montée, testée et expédiée à la main depuis la France.",
              },
              {
                badge: "🔓 Open source",
                title: "100 % hackable",
                desc: "PCB sous KiCad, firmware CircuitPython. Modifie tout, sans rien casser.",
              },
              {
                badge: "🔧 Réparable",
                title: "Zéro obsolescence",
                desc: "Chaque composant est remplaçable. Conçu pour durer, pas pour être jeté.",
              },
            ].map(v => (
              <ScrollReveal key={v.title}>
                <div className="card p-8 text-center">
                  <span className="badge mb-4 inline-flex">{v.badge}</span>
                  <h3
                    className="font-semibold mb-2"
                    style={{ fontSize: "18px", color: "var(--color-text)" }}
                  >
                    {v.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--color-text-mute)", lineHeight: 1.7 }}>
                    {v.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────────────── */}
      <section
        className="text-center px-6"
        style={{ padding: "96px 24px", background: "var(--color-accent-lt)" }}
      >
        <ScrollReveal>
          <h2
            className="font-semibold mb-4"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              color: "var(--color-text)",
              letterSpacing: "-0.02em",
            }}
          >
            Prêt à passer au niveau supérieur ?
          </h2>
          <p
            className="mb-8 max-w-md mx-auto"
            style={{ fontSize: "1rem", color: "var(--color-text-mute)", lineHeight: 1.7 }}
          >
            Un outil de productivité haut de gamme, fabriqué en France, livré chez toi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/shop" className="btn-accent w-full sm:w-auto text-center" style={{ padding: "14px 40px" }}>
              Acheter maintenant — 79 €
            </Link>
            <Link href="/about" className="btn-ghost">
              En savoir plus →
            </Link>
          </div>
        </ScrollReveal>
      </section>

    </main>
  );
}
