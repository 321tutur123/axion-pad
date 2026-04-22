import Link from "next/link";

const NAV = [
  {
    title: "Boutique",
    links: [
      { href: "/shop", label: "Tous les produits" },
      { href: "/shop?category=macro-pads", label: "Macro Pads" },
      { href: "/shop?category=kits", label: "Kits DIY" },
      { href: "/shop?category=accessories", label: "Accessoires" },
    ],
  },
  {
    title: "Aide",
    links: [
      { href: "/track", label: "Suivi de commande" },
      { href: "/software", label: "Logiciel configurateur" },
      { href: "/about", label: "À propos" },
      { href: "mailto:contact@axionpad.com", label: "Contact" },
      { href: "/cgv#7", label: "Retours & remboursements" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/cgv", label: "CGV" },
      { href: "/confidentialite", label: "Politique de confidentialité" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="text-white font-bold text-xl tracking-tight">
              AXION<span className="text-violet-500">PAD</span>
            </Link>
            <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
              Macro pad RP2040 open-source.<br />
              Fabriqué à la main en France.
            </p>
            <div className="flex items-center gap-1.5 mt-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-zinc-600">En stock — expédié sous 5 jours</span>
            </div>
          </div>

          {/* Nav columns */}
          {NAV.map(col => (
            <div key={col.title}>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-zinc-500 hover:text-zinc-200 transition-colors text-sm"
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
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs">
            © {new Date().getFullYear()} Axion Pad — Arthur Delacour. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>🔒 Paiement sécurisé Stripe</span>
            <span>·</span>
            <span>🇫🇷 Expédié depuis la France</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
