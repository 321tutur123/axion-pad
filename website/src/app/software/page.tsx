import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logiciel Configurateur — Axion Pad",
  description: "Configurez votre Axion Pad en quelques clics. Mappings, macros, layers, protocole AxionPad Native, optimisation CPU ultra-faible. Gratuit, open-source, Windows / macOS / Linux.",
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
    title: "AxionPad Native",
    desc: "Protocole propriétaire bas-latence avec Watchdog auto-recovery. Contrôle le volume de chaque application via les 4 potentiomètres. CPU ultra-faible.",
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
    <main className="min-h-screen pb-12" style={{ background: "transparent", paddingTop: "5.5rem" }}>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="pb-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Text */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mb-6"
              style={{
                background: "var(--color-accent-muted)",
                borderColor: "rgba(184,118,92,0.25)",
                color: "var(--color-accent)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
              v2.1 — Gratuit & open-source
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold mb-5 leading-tight" style={{ color: "var(--color-text)" }}>
              Axion Pad
              <br />
              <span style={{ color: "var(--color-accent)" }}>Configurateur</span>
            </h1>
            <p className="text-lg leading-relaxed mb-8" style={{ color: "var(--color-text-mute)" }}>
              L'application desktop pour programmer ton Axion Pad sans toucher à une ligne de code.
              Mappings, macros, layers, protocole AxionPad Native — tout en quelques clics.
            </p>
            <div className="flex flex-wrap gap-3">
              <DownloadButton os="Windows" icon="🪟" ext=".exe" href="#download" primary />
              <DownloadButton os="macOS" icon="🍎" ext=".dmg" href="#download" />
              <DownloadButton os="Linux" icon="🐧" ext=".AppImage" href="#download" />
            </div>
            <p className="text-xs mt-4" style={{ color: "var(--color-text-mute)" }}>
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
          <h2 className="text-3xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>Tout ce dont tu as besoin</h2>
          <p style={{ color: "var(--color-text-mute)" }}>Puissant pour les utilisateurs avancés, simple pour commencer.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="p-5 rounded-2xl border transition-shadow hover:shadow-md group card"
              style={{ borderColor: "var(--color-border)", background: "var(--color-bg-card)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ background: `${f.color}14`, border: `1px solid ${f.color}28` }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2 transition-colors" style={{ color: "var(--color-text)" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-mute)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AxionPad Native section ──────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <DeejMockup />
          <div>
            <div
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border mb-5"
              style={{
                background: "rgba(212,187,140,0.2)",
                color: "#6b5a45",
                borderColor: "rgba(184,118,92,0.25)",
              }}
            >
              Protocole AxionPad Native
            </div>
            <h2 className="text-3xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>
              Un potentiomètre,<br />un volume.
            </h2>
            <p className="leading-relaxed mb-6" style={{ color: "var(--color-text-mute)" }}>
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
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: "var(--color-text)" }}>
                  <span
                    className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: "var(--color-accent-lt)",
                      borderColor: "rgba(184,118,92,0.3)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs mt-5" style={{ color: "var(--color-text-mute)" }}>
              Protocole AxionPad Native — bas-latence, Watchdog auto-recovery intégré.
            </p>
          </div>
        </div>
      </section>

      {/* ── CircuitPython section ─────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div
          className="rounded-3xl border p-10 md:p-14"
          style={{
            borderColor: "var(--color-border)",
            background: "linear-gradient(145deg, var(--color-accent-lt) 0%, var(--color-bg-card) 40%, rgba(108,92,231,0.06) 100%)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border mb-5"
                style={{
                  background: "rgba(139,157,195,0.18)",
                  color: "#4d5670",
                  borderColor: "rgba(139,157,195,0.35)",
                }}
              >
                Mode avancé
              </div>
              <h2 className="text-3xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                Pas de limites avec CircuitPython
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: "var(--color-text-mute)" }}>
                Si le configurateur ne suffit plus, édite directement le fichier{" "}
                <code
                  className="px-1.5 py-0.5 rounded text-sm"
                  style={{ color: "var(--color-accent)", background: "var(--color-accent-muted)" }}
                >
                  code.py
                </code>{" "}
                sur l'Axion Pad. Il se monte comme une clé USB — modifie le code,
                sauvegarde, la mise à jour est instantanée. Zéro compilation.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://circuitpython.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full border text-sm transition-colors hover:opacity-90"
                  style={{ borderColor: "rgba(139,157,195,0.45)", color: "#4d5670", background: "rgba(139,157,195,0.1)" }}
                >
                  Doc CircuitPython →
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full border text-sm transition-colors"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-mute)" }}
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
        <h2 className="text-3xl font-semibold text-center mb-14" style={{ color: "var(--color-text)" }}>
          Opérationnel en 3 minutes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(step => (
            <div
              key={step.n}
              className="relative p-6 rounded-2xl border card"
              style={{ borderColor: "var(--color-border)", background: "var(--color-bg-card)" }}
            >
              <div
                className="text-5xl font-black absolute top-4 right-5 leading-none select-none"
                style={{ color: "rgba(58,54,51,0.06)" }}
              >
                {step.n}
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-accent)" }}>
                Étape {step.n}
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-mute)" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Download ─────────────────────────────────────────────────────── */}
      <section id="download" className="py-20 px-6 max-w-3xl mx-auto text-center">
        <div className="p-10 rounded-3xl border card" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-card-alt)" }}>
          <div className="text-5xl mb-5">⬇️</div>
          <h2 className="text-3xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>Télécharger le configurateur</h2>
          <p className="mb-8" style={{ color: "var(--color-text-mute)" }}>
            Gratuit, sans publicité, sans télémétrie. Code source disponible sur GitHub.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <DownloadButton os="Windows" icon="🪟" ext=".exe" href="#" primary size="lg" />
            <DownloadButton os="macOS" icon="🍎" ext=".dmg" href="#" size="lg" />
            <DownloadButton os="Linux" icon="🐧" ext=".AppImage" href="#" size="lg" />
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-mute)" }}>
            v2.1.0 · 45 MB · Nécessite l'Axion Pad pour fonctionner
          </p>
        </div>
      </section>

      {/* ── CTA shop ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 text-center">
        <p className="text-sm mb-4" style={{ color: "var(--color-text-mute)" }}>Tu n&apos;as pas encore l&apos;Axion Pad ?</p>
        <Link href="/shop" className="btn-accent inline-flex px-8 py-3.5 font-semibold">
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
      className={`inline-flex items-center gap-2.5 rounded-full font-medium transition-all hover:opacity-92 ${base} ${
        primary
          ? "btn-accent shadow-md"
          : "border"
      }`}
      style={
        primary
          ? undefined
          : {
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              background: "var(--color-bg-card)",
            }
      }
    >
      <span>{icon}</span>
      <span>{os}</span>
      <span className={`text-xs ${primary ? "opacity-90" : ""}`} style={primary ? undefined : { color: "var(--color-text-mute)" }}>
        {ext}
      </span>
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

  const chrome = {
    shell: { borderColor: "var(--color-border)", background: "var(--color-bg-card)" },
    bar: { borderColor: "var(--color-border)", background: "var(--color-bg-soft)" },
    muted: "var(--color-text-mute)",
    text: "var(--color-text)",
  } as const;

  return (
    <div className="rounded-2xl border overflow-hidden shadow-xl" style={chrome.shell}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={chrome.bar}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#e8a598" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#e8d598" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#a8c9a8" }} />
        </div>
        <span className="text-xs font-medium" style={{ color: chrome.muted }}>AxionPad Configurator</span>
        <div className="w-14" />
      </div>

      <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ ...chrome.bar, borderColor: "var(--color-border)" }}>
        {["Layer 1", "Layer 2", "Layer 3", "+ Ajouter"].map((l, i) => (
          <button
            key={l}
            type="button"
            className={`px-3 py-1 rounded text-xs transition-colors border ${
              i === 0 ? "" : ""
            }`}
            style={
              i === 0
                ? { background: "var(--color-accent-muted)", color: "var(--color-accent)", borderColor: "rgba(184,118,92,0.35)" }
                : { color: chrome.muted, borderColor: "transparent", background: "transparent" }
            }
          >
            {l}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#7aab82" }} />
          <span className="text-xs" style={{ color: chrome.muted }}>Connecté</span>
        </div>
      </div>

      <div className="p-4" style={{ background: "var(--color-bg-card-alt)" }}>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {keys.map((key, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.02] border"
              style={{
                background: i === 4 ? `${key.color}22` : `${key.color}12`,
                borderColor: i === 4 ? key.color : `${key.color}35`,
                ...(i === 4 ? { boxShadow: "0 0 0 2px rgba(184,118,92,0.28)" } : {}),
              }}
            >
              <span className="text-[10px] font-bold leading-tight text-center px-1" style={{ color: chrome.text }}>
                {key.label}
              </span>
              {key.sub && (
                <span className="text-[8px] mt-0.5" style={{ color: chrome.muted }}>{key.sub}</span>
              )}
            </div>
          ))}
        </div>

        <div
          className="rounded-xl border p-3"
          style={{ borderColor: "rgba(184,118,92,0.28)", background: "var(--color-accent-lt)" }}
        >
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: chrome.muted }}>
            Touche sélectionnée — Spotify ▶
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="flex-1 px-2 py-1.5 rounded-lg border text-xs"
              style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)", color: chrome.text }}
            >
              Ctrl + Alt + Espace
            </div>
            <div
              className="w-6 h-6 rounded border flex items-center justify-center text-xs"
              style={{ borderColor: "var(--color-border)", color: chrome.muted }}
            >
              ↻
            </div>
          </div>
          <div className="flex gap-1.5">
            {["Touche", "Macro", "Media", "App"].map((t, i) => (
              <span
                key={t}
                className="text-[9px] px-2 py-0.5 rounded-full"
                style={
                  i === 2
                    ? { background: "var(--color-accent-muted)", color: "var(--color-accent)" }
                    : { color: chrome.muted }
                }
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
    <div className="rounded-2xl border p-5 shadow-lg card" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-card)" }}>
      <div className="text-xs uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: "var(--color-text-mute)" }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--color-accent)" }} />
        AxionPad Native — en direct
      </div>
      <div className="flex items-end gap-4 justify-center">
        {channels.map((ch, i) => (
          <div key={ch.name} className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium" style={{ color: ch.color }}>
              {ch.val}%
            </span>
            <div
              className="relative w-7 rounded-full border"
              style={{ height: 120, background: "var(--color-bg-soft)", borderColor: "var(--color-border)" }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
                style={{ height: `${ch.val}%`, background: `${ch.color}40`, borderTop: `2px solid ${ch.color}` }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 shadow-md"
                style={{
                  bottom: `calc(${ch.val}% - 10px)`,
                  borderColor: ch.color,
                  background: "var(--color-bg-card)",
                  boxShadow: `0 2px 8px ${ch.color}35`,
                }}
              />
            </div>
            <span className="text-lg">{ch.app}</span>
            <span className="text-[10px] text-center w-12 leading-tight" style={{ color: "var(--color-text-mute)" }}>{ch.name}</span>
            <div
              className="w-5 h-5 rounded-full border text-[10px] flex items-center justify-center font-bold"
              style={{ borderColor: `${ch.color}45`, color: "var(--color-text-mute)" }}
            >
              {i + 1}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-center mt-4" style={{ color: "var(--color-text-mute)" }}>Mappé sur les 4 potentiomètres</p>
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
    <div className="rounded-2xl overflow-hidden border shadow-xl" style={{ borderColor: "var(--color-border)", background: "#1a1a2e" }}>
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-border)", background: "var(--color-bg-soft)" }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#c9c4bd" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#c9c4bd" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#c9c4bd" }} />
        </div>
        <span className="text-xs font-mono" style={{ color: "var(--color-text-mute)" }}>AXIONPAD / code.py</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
          <span className="text-[10px]" style={{ color: "var(--color-text-mute)" }}>modifié</span>
        </div>
      </div>

      <div className="p-4 font-mono text-xs leading-6 overflow-x-auto" style={{ background: "#14141f" }}>
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="w-6 shrink-0 text-right mr-4 select-none" style={{ color: "rgba(255,255,255,0.2)" }}>{i + 1}</span>
            <span>
              {"  ".repeat(line.indent)}
              {line.tokens.map((tok, j) => (
                <span key={j} style={{ color: tok.c }}>{tok.t}</span>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div
        className="px-4 py-3 border-t flex items-center gap-2"
        style={{ borderColor: "var(--color-border)", background: "var(--color-bg-soft)" }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#7aab82" }} />
        <span className="text-xs" style={{ color: "var(--color-text-mute)" }}>Sauvegardé — mise à jour instantanée</span>
      </div>
    </div>
  );
}
