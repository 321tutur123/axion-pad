import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logiciel Configurateur — Axion Pad",
  description: "Configurez votre Axion Pad en quelques clics. Mappings, macros, layers, contrôle audio DEEJ. Gratuit, open-source, Windows / macOS / Linux.",
};

const FEATURES = [
  {
    icon: "⌨️",
    title: "Mapping visuel",
    desc: "Assigne une action à chaque touche par glisser-déposer. Raccourcis clavier, texte, lancement d'appli, séquences personnalisées.",
    color: "#7c3aed",
  },
  {
    icon: "⚡",
    title: "Macros",
    desc: "Enregistre et rejoue des séquences de touches complexes avec délais personnalisables. Idéal pour les workflows répétitifs.",
    color: "#059669",
  },
  {
    icon: "📚",
    title: "Layers",
    desc: "Jusqu'à 8 layers par profil. Bascule de layer via une touche dédiée pour multiplier les fonctions sans changer de config.",
    color: "#0891b2",
  },
  {
    icon: "🎚️",
    title: "Mixeur DEEJ",
    desc: "Contrôle le volume de chaque application indépendamment via les 4 potentiomètres. Spotify, Discord, navigateur... en même temps.",
    color: "#d97706",
  },
  {
    icon: "🎨",
    title: "Profils par app",
    desc: "Détection automatique de l'application active. Les mappings changent quand tu passes de Premiere à VS Code ou OBS.",
    color: "#7c3aed",
  },
  {
    icon: "🔄",
    title: "Sync instantanée",
    desc: "Les modifications sont appliquées en temps réel sur le pad. Pas besoin de redémarrer. L'Axion Pad se monte comme une clé USB.",
    color: "#dc2626",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Branche ton Axion Pad",
    desc: "Il apparaît comme une clé USB nommée AXIONPAD. Aucun driver à installer.",
  },
  {
    n: "02",
    title: "Ouvre le Configurateur",
    desc: "Clique sur une touche, choisis son action. Les changements sont sauvegardés en direct sur le pad.",
  },
  {
    n: "03",
    title: "C'est prêt",
    desc: "Débranche, rebranche — ta config est stockée dans la mémoire flash du pad, pas sur ton PC.",
  },
];

export default function SoftwarePage() {
  return (
    <main className="min-h-screen bg-black">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              v2.1 — Gratuit & open-source
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Axion Pad
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
                Configurateur
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              L'application desktop pour programmer ton Axion Pad sans toucher à une ligne de code.
              Mappings, macros, layers, mixeur audio DEEJ — tout en quelques clics.
            </p>
            <div className="flex flex-wrap gap-3">
              <DownloadButton os="Windows" icon="🪟" ext=".exe" href="#download" primary />
              <DownloadButton os="macOS" icon="🍎" ext=".dmg" href="#download" />
              <DownloadButton os="Linux" icon="🐧" ext=".AppImage" href="#download" />
            </div>
            <p className="text-zinc-600 text-xs mt-4">
              Compatible Windows 10+, macOS 12+, Ubuntu 20.04+ · Python non requis
            </p>
          </div>

          {/* App mockup */}
          <AppMockup />
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Tout ce dont tu as besoin</h2>
          <p className="text-zinc-500">Puissant pour les power users, simple pour les débutants.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}
              >
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-violet-300 transition-colors">
                {f.title}
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEEJ section ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <DeejMockup />
          <div>
            <div className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-5">
              Protocole DEEJ
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Un potentiomètre,<br />un volume.
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              Chacun des 4 potentiomètres de l'Axion Pad peut être assigné à n'importe quelle
              application en cours d'exécution. Plus besoin de plonger dans le mixer Windows.
            </p>
            <ul className="space-y-3">
              {[
                "Pot 1 → Volume système",
                "Pot 2 → Spotify / musique",
                "Pot 3 → Discord / voix",
                "Pot 4 → Navigateur web",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-zinc-600 text-xs mt-5">
              Compatible avec l'appli DEEJ open-source ou le mode natif Axion.
            </p>
          </div>
        </div>
      </section>

      {/* ── CircuitPython section ─────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-violet-500/10 bg-gradient-to-br from-violet-950/30 to-zinc-950 p-10 md:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-5">
                Mode avancé
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Pas de limites avec CircuitPython
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Si le configurateur ne suffit plus, édite directement le fichier{" "}
                <code className="text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded text-sm">code.py</code>{" "}
                sur l'Axion Pad. Il se monte comme une clé USB — modifie le code,
                sauvegarde, la mise à jour est instantanée. Zéro compilation.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://circuitpython.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-colors text-sm"
                >
                  Doc CircuitPython →
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full border border-white/10 text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  GitHub — firmware →
                </a>
              </div>
            </div>
            <CodeSnippet />
          </div>
        </div>
      </section>

      {/* ── Getting started ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-14">
          Opérationnel en 3 minutes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(step => (
            <div key={step.n} className="relative p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-5xl font-black text-white/5 absolute top-4 right-5 leading-none select-none">
                {step.n}
              </div>
              <div className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">
                Étape {step.n}
              </div>
              <h3 className="text-white font-semibold mb-2">{step.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Download ─────────────────────────────────────────────────────── */}
      <section id="download" className="py-20 px-6 max-w-3xl mx-auto text-center">
        <div className="p-10 rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="text-5xl mb-5">⬇️</div>
          <h2 className="text-3xl font-bold text-white mb-3">Télécharger le configurateur</h2>
          <p className="text-zinc-400 mb-8">
            Gratuit, sans publicité, sans télémétrie. Code source disponible sur GitHub.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <DownloadButton os="Windows" icon="🪟" ext=".exe" href="#" primary size="lg" />
            <DownloadButton os="macOS" icon="🍎" ext=".dmg" href="#" size="lg" />
            <DownloadButton os="Linux" icon="🐧" ext=".AppImage" href="#" size="lg" />
          </div>
          <p className="text-zinc-600 text-xs">
            v2.1.0 · 45 MB · Nécessite l'Axion Pad pour fonctionner
          </p>
        </div>
      </section>

      {/* ── CTA shop ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 text-center">
        <p className="text-zinc-500 text-sm mb-4">Tu n'as pas encore l'Axion Pad ?</p>
        <Link
          href="/shop"
          className="inline-flex px-8 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all hover:scale-105"
        >
          Commander — à partir de 59,99 €
        </Link>
      </section>

    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DownloadButton({
  os, icon, ext, href, primary = false, size = "md",
}: {
  os: string; icon: string; ext: string; href: string;
  primary?: boolean; size?: "md" | "lg";
}) {
  const base = size === "lg" ? "px-6 py-3.5 text-sm" : "px-4 py-2.5 text-sm";
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2.5 rounded-full font-medium transition-all hover:scale-105 ${base} ${
        primary
          ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30"
          : "border border-white/15 text-zinc-300 hover:border-white/30 hover:text-white"
      }`}
    >
      <span>{icon}</span>
      <span>{os}</span>
      <span className={`text-xs ${primary ? "text-violet-300" : "text-zinc-600"}`}>{ext}</span>
    </a>
  );
}

function AppMockup() {
  const keys = [
    { label: "OBS", sub: "Rec", color: "#dc2626" },
    { label: "Scene", sub: "2", color: "#7c3aed" },
    { label: "Mute", sub: "mic", color: "#dc2626" },
    { label: "Vol ↑", sub: "", color: "#059669" },
    { label: "Spotify", sub: "▶", color: "#059669" },
    { label: "Skip", sub: "→", color: "#059669" },
    { label: "Ctrl+Z", sub: "undo", color: "#0891b2" },
    { label: "Ctrl+S", sub: "save", color: "#0891b2" },
    { label: "Win+D", sub: "desk", color: "#7c3aed" },
    { label: "Layer", sub: "→2", color: "#d97706" },
    { label: "Macro", sub: "1", color: "#7c3aed" },
    { label: "Sleep", sub: "💤", color: "#52525b" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 overflow-hidden shadow-2xl shadow-violet-950/30">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-950/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-zinc-500 font-medium">Axion Pad Configurator</span>
        <div className="w-14" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 bg-zinc-950/30">
        {["Layer 1", "Layer 2", "Layer 3", "+ Ajouter"].map((l, i) => (
          <button
            key={l}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              i === 0
                ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {l}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-zinc-600">Connecté</span>
        </div>
      </div>

      {/* Key grid */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-2 mb-4">
          {keys.map((key, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 border ${
                i === 4 ? "ring-2 ring-violet-500 ring-offset-1 ring-offset-zinc-900" : ""
              }`}
              style={{
                background: i === 4 ? `${key.color}28` : `${key.color}10`,
                borderColor: i === 4 ? key.color : `${key.color}30`,
              }}
            >
              <span className="text-[10px] font-bold text-white/80 leading-tight text-center px-1">
                {key.label}
              </span>
              {key.sub && (
                <span className="text-[8px] text-zinc-500 mt-0.5">{key.sub}</span>
              )}
            </div>
          ))}
        </div>

        {/* Selected key editor */}
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Touche sélectionnée — Spotify ▶</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300">
              Ctrl + Alt + Espace
            </div>
            <div className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs text-zinc-500">↻</div>
          </div>
          <div className="flex gap-1.5">
            {["Touche", "Macro", "Media", "App"].map((t, i) => (
              <span
                key={t}
                className={`text-[9px] px-2 py-0.5 rounded-full ${
                  i === 2
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-zinc-600"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeejMockup() {
  const channels = [
    { name: "Système",  app: "🔊", val: 85, color: "#7c3aed" },
    { name: "Spotify",  app: "🎵", val: 62, color: "#059669" },
    { name: "Discord",  app: "🎧", val: 40, color: "#0891b2" },
    { name: "Chrome",   app: "🌐", val: 70, color: "#d97706" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-xl shadow-amber-950/10">
      <div className="text-xs text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Mixeur DEEJ — en direct
      </div>
      <div className="flex items-end gap-4 justify-center">
        {channels.map((ch, i) => (
          <div key={ch.name} className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium" style={{ color: ch.color }}>
              {ch.val}%
            </span>
            {/* Fader track */}
            <div className="relative w-7 rounded-full bg-white/5 border border-white/10" style={{ height: 120 }}>
              {/* Fill */}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
                style={{ height: `${ch.val}%`, background: `${ch.color}50`, borderTop: `2px solid ${ch.color}` }}
              />
              {/* Knob */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 shadow-lg"
                style={{
                  bottom: `calc(${ch.val}% - 10px)`,
                  borderColor: ch.color,
                  background: "#18181b",
                  boxShadow: `0 0 8px ${ch.color}60`,
                }}
              />
            </div>
            <span className="text-lg">{ch.app}</span>
            <span className="text-[10px] text-zinc-600 text-center w-12 leading-tight">{ch.name}</span>
            <div
              className="w-5 h-5 rounded-full border text-[10px] flex items-center justify-center font-bold text-zinc-400"
              style={{ borderColor: `${ch.color}40` }}
            >
              {i + 1}
            </div>
          </div>
        ))}
      </div>
      <p className="text-zinc-600 text-xs text-center mt-4">Mappé sur les 4 potentiomètres</p>
    </div>
  );
}

function CodeSnippet() {
  const lines = [
    { indent: 0, tokens: [{ t: "import", c: "#c678dd" }, { t: " usb_hid", c: "#abb2bf" }] },
    { indent: 0, tokens: [{ t: "from", c: "#c678dd" }, { t: " adafruit_hid.keyboard ", c: "#abb2bf" }, { t: "import", c: "#c678dd" }, { t: " Keyboard", c: "#e5c07b" }] },
    { indent: 0, tokens: [] },
    { indent: 0, tokens: [{ t: "kbd ", c: "#e06c75" }, { t: "= ", c: "#abb2bf" }, { t: "Keyboard", c: "#e5c07b" }, { t: "(usb_hid.devices)", c: "#abb2bf" }] },
    { indent: 0, tokens: [] },
    { indent: 0, tokens: [{ t: "# Assigner Ctrl+S à la touche 1", c: "#5c6370" }] },
    { indent: 0, tokens: [{ t: "def", c: "#c678dd" }, { t: " on_key_1", c: "#61afef" }, { t: "():", c: "#abb2bf" }] },
    { indent: 1, tokens: [{ t: "kbd.press", c: "#61afef" }, { t: "(KC.CTRL, KC.S)", c: "#abb2bf" }] },
    { indent: 1, tokens: [{ t: "kbd.release_all", c: "#61afef" }, { t: "()", c: "#abb2bf" }] },
    { indent: 0, tokens: [] },
    { indent: 0, tokens: [{ t: "# Layer 2 — raccourcis OBS", c: "#5c6370" }] },
    { indent: 0, tokens: [{ t: "LAYERS", c: "#e5c07b" }, { t: " = [layer_1, layer_2]", c: "#abb2bf" }] },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-xl">
      {/* Editor header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900/50">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        </div>
        <span className="text-xs text-zinc-500 font-mono">AXIONPAD / code.py</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-[10px] text-zinc-600">modifié</span>
        </div>
      </div>

      {/* Code */}
      <div className="p-4 font-mono text-xs leading-6 overflow-x-auto">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="text-zinc-700 w-6 shrink-0 text-right mr-4 select-none">{i + 1}</span>
            <span>
              {"  ".repeat(line.indent)}
              {line.tokens.map((tok, j) => (
                <span key={j} style={{ color: tok.c }}>{tok.t}</span>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-white/5 bg-zinc-900/30 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="text-xs text-zinc-500">Sauvegardé — mise à jour appliquée instantanément</span>
      </div>
    </div>
  );
}
