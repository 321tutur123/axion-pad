import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getAllProducts } from "@/lib/products-data";
import ProductConfigurator from "./ProductConfigurator";
import ProductImage from "@/components/ProductImage";
import ReviewSection from "@/components/ReviewSection";
import ProductCard from "@/components/ProductCard";

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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const emoji = productEmoji(slug);
  const related = getAllProducts()
    .filter(p => p.slug !== slug && p.category === product.category)
    .slice(0, 4);

  return (
    <main style={{ minHeight: "100vh", background: "transparent", paddingTop: "80px" }}>
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-10" style={{ color: "var(--color-text-mute)" }}>
          <Link href="/" className="transition-colors hover:underline" style={{ color: "var(--color-text-mute)" }}>Accueil</Link>
          <span>›</span>
          <Link href="/shop" className="transition-colors hover:underline" style={{ color: "var(--color-text-mute)" }}>Boutique</Link>
          <span>›</span>
          <span style={{ color: "var(--color-text)" }}>{product.name}</span>
        </nav>

        {/* Hero produit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start mb-24">

          {/* Visuel */}
          <div className="lg:sticky lg:top-24">
            <div
              className="relative aspect-square overflow-hidden"
              style={{
                borderRadius: "24px",
                background: "var(--color-accent-lt)",
                border: "0.5px solid var(--color-border)",
                boxShadow: "0 2px 40px rgba(45,52,54,0.08)",
              }}
            >
              <ProductImage
                src={product.imagePath}
                alt={product.name}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-8"
                priority
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center text-9xl">
                    {emoji}
                  </div>
                }
              />
            </div>
            {/* Ombre portée décorative */}
            <div
              className="mx-auto mt-2 h-4 rounded-full"
              style={{
                width: "70%",
                background: "rgba(180,120,60,0.12)",
                filter: "blur(16px)",
              }}
            />
            {!product.inStock && (
              <p
                className="mt-4 text-center text-xs py-2.5 rounded-xl"
                style={{
                  color: "var(--color-text-mute)",
                  border: "0.5px solid var(--color-border)",
                  background: "var(--color-bg-card)",
                }}
              >
                Rupture de stock — disponible sur commande
              </p>
            )}
          </div>

          {/* Info + configurateur */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {product.badge && (
                <span className="badge">{product.badge}</span>
              )}
              <span className="badge">🇫🇷 Fabriqué en France</span>
              <span
                className="text-xs uppercase tracking-wider capitalize"
                style={{ color: "var(--color-text-mute)" }}
              >
                {product.category.replace("-", " ")}
              </span>
            </div>

            <h1
              className="font-semibold mb-2 leading-tight"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "var(--color-text)", letterSpacing: "-0.02em" }}
            >
              {product.name}
            </h1>
            <p className="text-lg mb-8" style={{ color: "var(--color-text-mute)" }}>{product.tagline}</p>

            <p
              className="leading-relaxed mb-8"
              style={{ fontSize: "0.9375rem", color: "var(--color-text)", lineHeight: 1.7 }}
            >
              {product.longDescription}
            </p>

            <ProductConfigurator product={product} />
          </div>
        </div>

        {/* Specs + contenu boîte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-24">
          <div>
            <h2
              className="font-semibold text-base mb-4 flex items-center gap-2"
              style={{ color: "var(--color-text)" }}
            >
              <span
                className="w-1 h-4 rounded-full inline-block"
                style={{ background: "var(--color-accent)" }}
              />
              Caractéristiques
            </h2>
            <div className="space-y-0">
              {product.specs.map(s => (
                <div
                  key={s.label}
                  className="flex justify-between py-3 last:border-0"
                  style={{ borderBottom: "0.5px solid var(--color-border)" }}
                >
                  <span className="text-sm" style={{ color: "var(--color-text-mute)" }}>{s.label}</span>
                  <span
                    className="text-sm font-medium text-right max-w-[55%]"
                    style={{ color: "var(--color-text)" }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2
              className="font-semibold text-base mb-4 flex items-center gap-2"
              style={{ color: "var(--color-text)" }}
            >
              <span
                className="w-1 h-4 rounded-full inline-block"
                style={{ background: "var(--color-accent)" }}
              />
              Contenu de la boîte
            </h2>
            <ul className="space-y-3">
              {product.includes.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "var(--color-text)" }}>
                  <span className="mt-0.5 shrink-0" style={{ color: "var(--color-accent)" }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Avis */}
        <ReviewSection productSlug={slug} />

        {/* Produits similaires */}
        {related.length > 0 && (
          <div>
            <h2
              className="text-xs uppercase tracking-widest mb-5"
              style={{ color: "var(--color-text-mute)" }}
            >
              Produits similaires
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map(p => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
