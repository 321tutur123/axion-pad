"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getAllProducts, formatPrice, type ProductVariantFull } from "@/lib/products-data";
import { useCart } from "@/store/cart";
import ScrollReveal from "@/components/animations/ScrollReveal";
import ProductImage from "@/components/ProductImage";

const CATEGORIES = [
  { value: "",             label: "Tous les produits" },
  { value: "macro-pads",  label: "Macro Pads" },
  { value: "kits",        label: "Kits DIY" },
  { value: "accessories", label: "Accessoires" },
];

const SORTS = [
  { value: "default",    label: "Par défaut" },
  { value: "price_asc",  label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

function ProductCard({ product }: { product: ProductVariantFull }) {
  const add = useCart(s => s.add);
  const [adding, setAdding] = useState(false);
  const [done,   setDone]   = useState(false);

  const handleAddToCart = async () => {
    if (!product.inStock || adding) return;
    setAdding(true);
    try {
      await add(product.slug, 1);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card overflow-hidden group">
      <Link href={`/shop/${product.slug}`}>
        <div
          className="relative h-44 flex items-center justify-center overflow-hidden"
          style={{ background: "var(--color-accent-lt)" }}
        >
          <ProductImage
            src={product.imagePath}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-4"
            fallback={<span className="text-5xl">📦</span>}
          />
        </div>
      </Link>

      <div className="p-4">
        <div className="text-xs mb-1 capitalize" style={{ color: "var(--color-text-mute)" }}>
          {product.category.replace("-", " ")}
        </div>
        <Link href={`/shop/${product.slug}`}>
          <h3
            className="font-medium mb-2 line-clamp-1 transition-colors"
            style={{ color: "var(--color-text)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-accent)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text)")}
          >
            {product.name}
          </h3>
        </Link>
        <p className="text-xs line-clamp-2 mb-3" style={{ color: "var(--color-text-mute)", lineHeight: 1.6 }}>
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: "var(--color-text)" }}>{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <span className="text-xs line-through" style={{ color: "var(--color-text-mute)" }}>
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {product.comingSoon
            ? <span className="text-xs italic" style={{ color: "var(--color-text-mute)" }}>En développement</span>
            : !product.inStock
            ? <span className="text-xs" style={{ color: "var(--color-text-mute)" }}>Rupture</span>
            : (
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-accent"
                style={{
                  padding: "6px 14px",
                  fontSize: "0.75rem",
                  background: done ? "#16a34a" : "var(--color-accent)",
                }}
              >
                {done ? "✓ Ajouté" : adding ? "…" : "Ajouter"}
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [priceMax, setPriceMax] = useState(200);
  const [inStock,  setInStock]  = useState(false);
  const [sort,     setSort]     = useState("default");
  const [page,     setPage]     = useState(1);
  const PER_PAGE = 9;

  const filtered = useMemo(() => {
    let list = getAllProducts();
    if (category)       list = list.filter(p => p.category === category);
    if (inStock)        list = list.filter(p => p.inStock);
    if (priceMax < 200) list = list.filter(p => p.price <= priceMax * 100);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (sort === "price_asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [search, category, priceMax, inStock, sort]);

  const pages     = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const resetPage = () => setPage(1);

  return (
    <main style={{ minHeight: "100vh", background: "transparent", paddingTop: "80px" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">

        <ScrollReveal>
          <div className="mb-2">
            <span className="badge">🇫🇷 Fabriqué en France</span>
          </div>
          <h1
            className="font-semibold mt-3 mb-1"
            style={{ fontSize: "28px", color: "var(--color-text)", letterSpacing: "-0.01em" }}
          >
            Boutique
          </h1>
          <p className="mb-8" style={{ color: "var(--color-text-mute)", fontSize: "0.875rem" }}>
            {filtered.length} produit{filtered.length !== 1 ? "s" : ""}
          </p>
        </ScrollReveal>

        <div className="flex flex-col md:flex-row gap-8">

          {/* Filtres */}
          <aside className="w-full md:w-56 shrink-0 space-y-6">
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--color-text-mute)" }}
              >
                Catégories
              </div>
              <div className="space-y-1">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => { setCategory(c.value); resetPage(); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      background: category === c.value ? "var(--color-accent)" : "transparent",
                      color: category === c.value ? "#fff" : "var(--color-text-mute)",
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--color-text-mute)" }}
              >
                Prix max — {priceMax} €
              </div>
              <input
                type="range" min={0} max={200} step={5} value={priceMax}
                onChange={e => { setPriceMax(Number(e.target.value)); resetPage(); }}
                className="w-full"
                style={{ accentColor: "var(--color-accent)" }}
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--color-text-mute)" }}>
              <input
                type="checkbox" checked={inStock}
                onChange={e => { setInStock(e.target.checked); resetPage(); }}
                style={{ accentColor: "var(--color-accent)" }}
              />
              En stock seulement
            </label>

            <button
              onClick={() => { setCategory(""); setPriceMax(200); setInStock(false); setSearch(""); setSort("default"); setPage(1); }}
              className="text-xs transition-colors"
              style={{ color: "var(--color-text-mute)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-accent)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-mute)")}
            >
              Réinitialiser les filtres
            </button>
          </aside>

          {/* Grille */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="search" placeholder="Rechercher…" value={search}
                onChange={e => { setSearch(e.target.value); resetPage(); }}
                className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  background: "var(--color-bg-card)",
                  border: "0.5px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
              <select
                value={sort} onChange={e => { setSort(e.target.value); resetPage(); }}
                className="px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  background: "var(--color-bg-card)",
                  border: "0.5px solid var(--color-border)",
                  color: "var(--color-text-mute)",
                }}
              >
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {pageItems.length === 0 ? (
              <div className="text-center py-20" style={{ color: "var(--color-text-mute)" }}>
                <div className="text-5xl mb-4">🔍</div>
                <p>Aucun produit trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageItems.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: pages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="w-8 h-8 rounded-full text-sm transition-colors"
                    style={{
                      background: page === i + 1 ? "var(--color-accent)" : "transparent",
                      color: page === i + 1 ? "#fff" : "var(--color-text-mute)",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
