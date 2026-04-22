import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getAllProducts } from "@/lib/products-data";
import ProductConfigurator from "./ProductConfigurator";

export function generateStaticParams() {
  return getAllProducts().map(p => ({ slug: p.slug }));
}

function productEmoji(slug: string): string {
  if (slug.includes("cable"))   return "🔌";
  if (slug.includes("keycap"))  return "⌨️";
  if (slug.includes("support")) return "🖥️";
  if (slug.includes("pcb"))     return "🔬";
  if (slug.includes("kit"))     return "🔧";
  return "⌨️";
}

function Stars({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <svg key={i} className={`w-4 h-4 ${i <= Math.round(value) ? "text-yellow-400" : "text-zinc-700"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      <span className="text-sm text-zinc-400">{value} <span className="text-zinc-600">({count} avis)</span></span>
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const emoji = productEmoji(slug);
  const related = getAllProducts()
    .filter(p => p.slug !== slug && p.category === product.category)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-black pt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-600 mb-10">
          <Link href="/" className="hover:text-zinc-400 transition-colors">Accueil</Link>
          <span>›</span>
          <Link href="/shop" className="hover:text-zinc-400 transition-colors">Boutique</Link>
          <span>›</span>
          <span className="text-zinc-300">{product.name}</span>
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start mb-24">

          {/* Visuel */}
          <div className="lg:sticky lg:top-24">
            <div className="aspect-square rounded-3xl flex items-center justify-center text-9xl bg-gradient-to-br from-violet-900/30 via-violet-950/20 to-zinc-950 border border-white/5 shadow-2xl shadow-violet-950/30">
              {emoji}
            </div>
            {!product.inStock && (
              <p className="mt-4 text-center text-xs text-zinc-600 border border-white/5 rounded-xl py-2.5 bg-white/[0.02]">
                Rupture de stock — disponible sur commande
              </p>
            )}
          </div>

          {/* Info + configurateur */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {product.badge && (
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">
                  {product.badge}
                </span>
              )}
              <span className="text-xs text-zinc-600 uppercase tracking-wider capitalize">
                {product.category.replace("-", " ")}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2 leading-tight">{product.name}</h1>
            <p className="text-zinc-400 text-lg mb-5">{product.tagline}</p>

            {product.rating.count > 0 && (
              <div className="mb-6">
                <Stars value={product.rating.average} count={product.rating.count} />
              </div>
            )}

            <p className="text-zinc-300 leading-relaxed text-[15px] mb-8">{product.longDescription}</p>

            <ProductConfigurator product={product} />
          </div>
        </div>

        {/* Specs + contenu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-24">
          <div>
            <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-violet-500 inline-block" />
              Caractéristiques
            </h2>
            <div className="space-y-0">
              {product.specs.map(s => (
                <div key={s.label} className="flex justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="text-zinc-500 text-sm">{s.label}</span>
                  <span className="text-zinc-200 text-sm font-medium text-right max-w-[55%]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-violet-500 inline-block" />
              Contenu de la boîte
            </h2>
            <ul className="space-y-3">
              {product.includes.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                  <span className="text-violet-400 mt-0.5 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Produits similaires */}
        {related.length > 0 && (
          <div>
            <h2 className="text-zinc-600 text-xs uppercase tracking-widest mb-5">Produits similaires</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map(p => (
                <Link
                  key={p.slug}
                  href={`/shop/${p.slug}`}
                  className="p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/10 hover:border-violet-500/20 transition-all group"
                >
                  <div className="text-2xl mb-2">{productEmoji(p.slug)}</div>
                  <div className="text-white text-sm font-medium group-hover:text-violet-300 transition-colors leading-tight mb-1">
                    {p.name}
                  </div>
                  <div className="text-zinc-500 text-xs">{p.basePrice.toFixed(2)} €</div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
