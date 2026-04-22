import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black pt-20">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          Fait en France
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Fabriqué par un passionné,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
            pour les passionnés
          </span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
          L'Axion Pad est né d'un besoin simple : avoir un macro pad entièrement hackable,
          open-source, et assemblé à la main. Pas de compromis.
        </p>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02]">
          <h2 className="text-2xl font-bold text-white mb-4">L'histoire</h2>
          <div className="space-y-4 text-zinc-400 leading-relaxed text-[15px]">
            <p>
              Tout a commencé avec une frustration : les macro pads disponibles sur le marché
              étaient soit trop chers, soit fermés et non modifiables, soit les deux.
              En tant que maker, ça ne pouvait pas convenir.
            </p>
            <p>
              J'ai donc conçu mon propre PCB autour du <span className="text-zinc-200">RP2040 de Raspberry Pi</span> — un
              microcontrôleur dual-core 133 MHz, open-source, avec 2 MB de flash. Le firmware tourne
              sous <span className="text-zinc-200">CircuitPython</span>, ce qui signifie que n'importe qui peut
              modifier son comportement sans installer de chaîne de compilation.
            </p>
            <p>
              Le boîtier est imprimé en 3D par défaut — chaque commande est fabriquée à la demande.
              Tu peux choisir le matériau, la couleur, et même commander la version aluminium CNC
              si tu veux quelque chose de plus premium.
            </p>
            <p>
              Chaque Axion Pad est assemblé, testé et expédié à la main, depuis la France.
            </p>
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-zinc-500 text-xs uppercase tracking-widest mb-8">La technique</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "RP2040",
              sub: "Microcontrôleur",
              desc: "Dual-core ARM Cortex-M0+ à 133 MHz. 2 MB flash QSPI. Le cerveau de chaque Axion Pad.",
              color: "#059669",
            },
            {
              title: "Cherry MX",
              sub: "Switches",
              desc: "Mécaniques, 100M frappes de durabilité. Red (linéaire), Brown (tactile) ou Blue (clicky).",
              color: "#dc2626",
            },
            {
              title: "CircuitPython",
              sub: "Firmware open-source",
              desc: "Pas de compilation. Tu branches, tu modifies le fichier Python, c'est live.",
              color: "#7c3aed",
            },
            {
              title: "PCB 4 couches",
              sub: "Conception maison",
              desc: "Conçu sur KiCad. PCB FR4 4 couches avec potentiomètres ALPS et connecteur USB-C.",
              color: "#0891b2",
            },
            {
              title: "3D Print",
              sub: "Boîtier sur mesure",
              desc: "PLA par défaut, PETG, ABS ou aluminium CNC disponibles. Chaque boîtier est imprimé à la commande.",
              color: "#d97706",
            },
            {
              title: "DEEJ",
              sub: "Contrôle audio",
              desc: "Les 4 potentiomètres s'intègrent avec DEEJ pour contrôler le volume par application.",
              color: "#7c3aed",
            },
          ].map(card => (
            <div
              key={card.title}
              className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
            >
              <div
                className="w-2 h-2 rounded-full mb-4"
                style={{ background: card.color, boxShadow: `0 0 8px ${card.color}60` }}
              />
              <div className="text-white font-bold text-base mb-0.5">{card.title}</div>
              <div className="text-zinc-600 text-xs uppercase tracking-wider mb-3">{card.sub}</div>
              <p className="text-zinc-500 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          {[
            { icon: "🇫🇷", title: "Fait en France", desc: "Assemblé et expédié depuis la France. Support en français." },
            { icon: "🔓", title: "Open source", desc: "PCB sous KiCad, firmware sous CircuitPython. Tout est disponible sur GitHub." },
            { icon: "🔧", title: "Réparable", desc: "Chaque composant est remplaçable. Aucune obsolescence programmée." },
          ].map(v => (
            <div key={v.title} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="text-4xl mb-3">{v.icon}</div>
              <div className="text-white font-semibold mb-2">{v.title}</div>
              <p className="text-zinc-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-2xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Une question ? Un projet ?</h2>
        <p className="text-zinc-400 mb-8">
          Pour les collaborations, questions techniques ou retours sur le produit,
          n'hésite pas à écrire directement.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:contact@axionpad.com"
            className="px-8 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all hover:scale-105"
          >
            contact@axionpad.com
          </a>
          <Link
            href="/shop"
            className="px-8 py-3.5 rounded-full border border-white/20 hover:border-white/40 text-zinc-300 hover:text-white transition-all"
          >
            Voir la boutique
          </Link>
        </div>
      </section>

    </main>
  );
}
