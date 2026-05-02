"use client";
import Link from "next/link";

const NAV = [
  {
    title: "Boutique",
    links: [
      { href: "/shop",                        label: "Tous les produits" },
      { href: "/shop?category=macro-pads",    label: "Macro Pads" },
      { href: "/shop?category=kits",          label: "Kits DIY" },
      { href: "/shop?category=accessories",   label: "Accessoires" },
    ],
  },
  {
    title: "Aide",
    links: [
      { href: "/track",        label: "Suivi de commande" },
      { href: "/software",     label: "Logiciel configurateur" },
      { href: "/about",        label: "À propos" },
      { href: "mailto:contact@axionpad.com", label: "Contact" },
      { href: "/cgv#7",        label: "Retours & remboursements" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/mentions-legales",  label: "Mentions légales" },
      { href: "/cgv",               label: "CGV" },
      { href: "/confidentialite",   label: "Politique de confidentialité" },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: "linear-gradient(180deg, var(--color-bg-soft) 0%, #020205 100%)" }}>

      {/* Bandeau "Fabriqué en France" */}
      <div
        className="w-full py-3 text-center text-sm font-medium"
        style={{ background: "var(--color-accent)", color: "#fff", letterSpacing: "0.01em" }}
      >
        🇫🇷 Fabriqué en France · Orléans — assemblé et expédié à la main
      </div>

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="font-semibold text-xl tracking-tight" style={{ color: "#fff", letterSpacing: "-0.01em" }}>
              Axion<span style={{ color: "var(--color-accent)" }}>Pad</span>
            </Link>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Macro pad RP2040 open-source.<br />
              Fabriqué à la main en France.
            </p>
            <div className="flex items-center gap-1.5 mt-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>En stock — expédié sous 5 jours</span>
            </div>
          </div>

          {/* Nav columns */}
          {NAV.map(col => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:opacity-100"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--color-accent)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} Axion Pad — Arthur Delacour. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <span>🔒 Paiement sécurisé Stripe</span>
            <span>·</span>
            <span>📦 Expédié depuis Orléans</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
