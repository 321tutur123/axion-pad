"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useCart } from "@/store/cart";

const NAV_LINKS = [
  { href: "/shop",     label: "Shop" },
  { href: "/software", label: "Logiciel" },
  { href: "/about",    label: "À propos" },
  { href: "/track",    label: "Suivi" },
];

export default function Navbar() {
  const navRef   = useRef<HTMLElement>(null);
  const cartCount = useCart(s => s.count());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.2 }
    );
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-3 flex items-center justify-between"
      style={{
        background: "var(--color-nav-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "0.5px solid var(--color-border)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="font-semibold text-lg tracking-tight"
        style={{ color: "var(--color-text)", letterSpacing: "-0.01em" }}
      >
        Axion<span style={{ color: "var(--color-accent)" }}>Pad</span>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "var(--color-text-mute)" }}>
        {NAV_LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="transition-colors hover:underline hover:[text-underline-offset:3px]"
            style={{ color: "var(--color-text-mute)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-accent)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-mute)")}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Panier */}
        <Link
          href="/cart"
          className="relative p-2 transition-colors"
          style={{ color: "var(--color-text-mute)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--color-accent)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-mute)")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {cartCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
              style={{ background: "var(--color-accent)" }}
            >
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </Link>

        {/* CTA desktop */}
        <Link
          href="/shop"
          className="hidden md:inline-flex btn-accent"
          style={{ padding: "10px 20px", fontSize: "0.875rem" }}
        >
          Commander
        </Link>

        {/* Hamburger mobile */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          style={{ color: "var(--color-text)" }}
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 flex flex-col gap-1 px-4 py-4"
          style={{ background: "rgba(8, 8, 16, 0.98)", borderBottom: "0.5px solid var(--color-border)", backdropFilter: "blur(12px)" }}
        >
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 px-2 text-sm font-medium border-b"
              style={{ color: "var(--color-text-mute)", borderColor: "var(--color-border)" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/shop"
            onClick={() => setMenuOpen(false)}
            className="btn-accent mt-3 w-full text-center"
          >
            Commander
          </Link>
        </div>
      )}
    </nav>
  );
}
