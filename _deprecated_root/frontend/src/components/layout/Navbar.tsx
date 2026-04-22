"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useCart } from "@/store/cart";

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const cartCount = useCart(s => s.count());

  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.2 }
    );
  }, []);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/40 border-b border-white/10">
      <Link href="/" className="text-white font-bold text-xl tracking-tight">
        AXION<span className="text-violet-500">PAD</span>
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm text-zinc-300">
        <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
        <Link href="/software" className="hover:text-white transition-colors">Logiciel</Link>
        <Link href="/about" className="hover:text-white transition-colors">À propos</Link>
        <Link href="/track" className="hover:text-white transition-colors">Suivi</Link>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/cart" className="relative p-2 text-zinc-400 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </Link>
        <Link href="/shop" className="px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
          Commander
        </Link>
      </div>
    </nav>
  );
}
