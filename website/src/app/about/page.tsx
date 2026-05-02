import Link from "next/link";

const TECH = [
  {
    title: "RP2040",
    sub: "Microcontrôleur",
    desc: "Dual-core ARM Cortex-M0+ à 133 MHz. 2 MB flash QSPI. Le cerveau de chaque Axion Pad.",
  },
  {
    title: "Cherry MX",
    sub: "Switches",
    desc: "Mécaniques, 100M frappes de durabilité. Red (linéaire), Brown (tactile) ou Blue (clicky).",
  },
  {
    title: "CircuitPython",
    sub: "Firmware open-source",
    desc: "Pas de compilation. Tu branches, tu modifies le fichier Python, c'est live.",
  },
  {
    title: "PCB 2 couches",
    sub: "Conception maison",
    desc: "Conçu sur KiCad. FR4 haute stabilité avec potentiomètres ALPS, sockets Kailh Hot-swap et USB-C.",
  },
  {
    title: "3D Print",
    sub: "Boîtier sur mesure",
    desc: "PLA par défaut, PETG, ABS ou aluminium CNC. Chaque boîtier est imprimé à la commande.",
  },
  {
    title: "AxionPad Native",
    sub: "Protocole propriétaire",
    desc: "Protocole bas-latence avec Watchdog intégré pour la récupération automatique en cas de déconnexion.",
  },
];

const VALUES = [
  { badge: "🇫🇷 Fabriqué en France", title: "Assemblé à Orléans",  desc: "Chaque pièce montée, testée et expédiée à la main depuis la France. Support en français." },
  { badge: "🔓 Open source",          title: "Hackable à l'infini", desc: "PCB sous KiCad, firmware CircuitPython. Tout est sur GitHub, modifiable sans risque." },
  { badge: "🔧 Réparable",            title: "Zéro obsolescence",   desc: "Chaque composant est remplaçable. Conçu pour durer, pas pour être jeté." },
];

export default function AboutPage() {
  return (
    <main style={{ minHeight: "100vh", background: "transparent", paddingTop: "80px" }}>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <span className="badge mb-6 inline-flex">🇫🇷 Fait en France · Orléans</span>
        <h1
          className="font-semibold mb-6 leading-tight"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
          }}
        >
          Fabriqué par un passionné,{" "}
          <span style={{ color: "var(--color-accent)" }}>pour les passionnés</span>
        </h1>
        <p
          className="max-w-2xl mx-auto"
          style={{ fontSize: "1.125rem", color: "var(--color-text-mute)", lineHeight: 1.7 }}
        >
          L'Axion Pad est né d'un besoin simple : avoir un macro pad entièrement hackable,
          open-source, et assemblé à la main. Pas de compromis.
        </p>
      </section>

      {/* Histoire — fond plus doux que blanc pur */}
      <section
        style={{
          padding: "0 24px 80px",
          background: "linear-gradient(180deg, var(--color-bg-soft) 0%, var(--color-bg-muted) 45%, var(--color-bg) 100%)",
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="card p-8" style={{ background: "var(--color-bg-card-alt)", boxShadow: "0 4px 28px rgba(0,0,0,0.35)" }}>
            <h2
              className="font-semibold mb-4"
              style={{ fontSize: "22px", color: "var(--color-text)" }}
            >
              L'histoire
            </h2>
            <div className="space-y-4" style={{ color: "var(--color-text-mute)", lineHeight: 1.8, fontSize: "0.9375rem" }}>
              <p>
                Tout a commencé avec une frustration : les macro pads disponibles sur le marché
                étaient soit trop chers, soit fermés et non modifiables, soit les deux. En tant que maker, ça ne pouvait pas convenir.
              </p>
              <p>
                J'ai donc conçu mon propre PCB autour du{" "}
                <span style={{ color: "var(--color-text)", fontWeight: 500 }}>RP2040 de Raspberry Pi</span>{" "}
                — un microcontrôleur dual-core 133 MHz, open-source, avec 2 MB de flash. Le firmware tourne sous{" "}
                <span style={{ color: "var(--color-text)", fontWeight: 500 }}>CircuitPython</span>, ce qui signifie
                que n'importe qui peut modifier son comportement sans installer de chaîne de compilation.
              </p>
              <p>
                Le boîtier est imprimé en 3D par défaut — chaque commande est fabriquée à la demande.
                Tu peux choisir le matériau, la couleur, et même commander la version aluminium CNC
                si tu veux quelque chose de plus premium.
              </p>
              <p>Chaque Axion Pad est assemblé, testé et expédié à la main, depuis la France.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section style={{ padding: "80px 24px", background: "transparent" }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {VALUES.map(v => (
              <div key={v.title} className="card p-6 text-center">
                <span className="badge mb-4 inline-flex">{v.badge}</span>
                <h3
                  className="font-semibold mb-2"
                  style={{ fontSize: "16px", color: "var(--color-text)" }}
                >
                  {v.title}
                </h3>
                <p style={{ fontSize: "14px", color: "var(--color-text-mute)", lineHeight: 1.7 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technique */}
      <section style={{ padding: "80px 24px", background: "var(--color-bg-soft)" }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-xs uppercase tracking-widest mb-8"
            style={{ color: "var(--color-text-mute)" }}
          >
            La technique
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TECH.map(card => (
              <div key={card.title} className="card p-5">
                <div
                  className="w-2 h-2 rounded-full mb-4"
                  style={{ background: "var(--color-accent)" }}
                />
                <div
                  className="font-semibold text-base mb-0.5"
                  style={{ color: "var(--color-text)" }}
                >
                  {card.title}
                </div>
                <div
                  className="text-xs uppercase tracking-wider mb-3"
                  style={{ color: "var(--color-text-mute)" }}
                >
                  {card.sub}
                </div>
                <p style={{ fontSize: "14px", color: "var(--color-text-mute)", lineHeight: 1.7 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        className="text-center px-6"
        style={{
          padding: "80px 24px",
          background: "linear-gradient(145deg, var(--color-accent-lt) 0%, var(--color-bg-soft) 60%, var(--color-bg-muted) 100%)",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <h2
            className="font-semibold mb-4"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--color-text)", letterSpacing: "-0.01em" }}
          >
            Une question ? Un projet ?
          </h2>
          <p className="mb-8" style={{ color: "var(--color-text-mute)", lineHeight: 1.7 }}>
            Pour les collaborations, questions techniques ou retours sur le produit,
            n'hésite pas à écrire directement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:contact@axionpad.com" className="btn-accent w-full sm:w-auto text-center">
              contact@axionpad.com
            </a>
            <Link href="/shop" className="btn-ghost">
              Voir la boutique →
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
