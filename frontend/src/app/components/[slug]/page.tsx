import Link from "next/link";
import { notFound } from "next/navigation";
import { getComponent, COMPONENTS } from "@/lib/components-data";

export function generateStaticParams() {
  return Object.keys(COMPONENTS).map(slug => ({ slug }));
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const component = getComponent(slug);
  if (!component) notFound();

  return (
    <main className="min-h-screen bg-black pt-20">
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-600 mb-12">
          <Link href="/" className="hover:text-zinc-400 transition-colors">Accueil</Link>
          <span>›</span>
          <Link href="/#hero" className="hover:text-zinc-400 transition-colors">Axion Pad</Link>
          <span>›</span>
          <span className="text-zinc-300">{component.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Visuel */}
          <div
            className="aspect-square rounded-3xl flex items-center justify-center text-8xl"
            style={{ background: `radial-gradient(circle at 40% 40%, ${component.color}33, #09090b)`, border: `1px solid ${component.color}30` }}
          >
            {slug === "pcb"      && "🔌"}
            {slug === "switches" && "⌨️"}
            {slug === "body"     && "📦"}
            {slug === "top"      && "🪟"}
            {slug === "bottom"   && "🔩"}
          </div>

          {/* Infos */}
          <div>
            <div
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: `${component.color}20`, color: component.color }}
            >
              Composant
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{component.name}</h1>
            <p className="text-zinc-500 mb-6">{component.subtitle}</p>
            <p className="text-zinc-300 leading-relaxed mb-10">{component.description}</p>

            {/* Specs */}
            <div className="space-y-3 mb-10">
              {component.specs.map(s => (
                <div key={s.label} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-500 text-sm">{s.label}</span>
                  <span className="text-zinc-200 text-sm font-medium">{s.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Link
                href="/shop"
                className="px-6 py-3 rounded-full text-white font-semibold transition-all hover:scale-105"
                style={{ background: component.color }}
              >
                Commander l'Axion Pad
              </Link>
              <Link
                href="/"
                className="px-6 py-3 rounded-full border border-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                ← Vue 3D
              </Link>
            </div>
          </div>
        </div>

        {/* Autres composants */}
        <div className="mt-24">
          <h2 className="text-zinc-600 text-sm uppercase tracking-widest mb-6">Autres composants</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(COMPONENTS)
              .filter(c => c.slug !== slug)
              .map(c => (
                <Link
                  key={c.slug}
                  href={`/components/${c.slug}`}
                  className="p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="text-xs text-zinc-600 mb-1 group-hover:text-zinc-400 transition-colors uppercase tracking-wide">
                    {c.slug}
                  </div>
                  <div className="text-white text-sm font-medium">{c.name}</div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}
