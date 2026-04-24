"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getAllProducts, formatPrice, type ProductVariantFull } from "@/lib/products-data";
import { useCart } from "@/store/cart";
import ScrollReveal from "@/components/animations/ScrollReveal";
import ProductImage from "@/components/ProductImage";

const CATEGORIES = [
  { value: "",            label: "Tous les produits" },
  { value: "macro-pads", label: "Macro Pads" },
  { value: "kits",       label: "Kits DIY" },
  { value: "accessories",label: "Accessoires" },
];

const SORTS = [
  { value: "default",    label: "Par défaut" },
  { value: "price_asc",  label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

function ProductCard({ product }: { product: ProductVariantFull }) {
  const add = useCart(s => s.add);
  const [adding, setAdding] = useState(false);
  const [done, setDone]     = useState(false);

  const handleAddToCart = async () => {
    if (!product.inStock || adding) return;
    setAdding(true);
    try {
      // TODO: wire up Stripe — pass product.price (cents) to checkout session
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
    <div className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-violet-500/40 transition-all">
      <Link href={`/shop/${product.slug}`}>
        <div className="relative h-44 bg-gradient-to-br from-violet-900/20 to-zinc-900 flex items-center justify-center overflow-hidden">
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
        <div className="text-xs text-zinc-500 mb-1 capitalize">{product.category.replace("-", " ")}</div>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors mb-2 line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-zinc-500 text-xs line-clamp-2 mb-3">{product.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <span className="text-xs text-zinc-600 line-through">{formatPrice(product.comparePrice)}</span>
            )}
          </div>

          {product.comingSoon
            ? <span className="text-xs text-zinc-500 italic">En développement</span>
            : !product.inStock
            ? <span className="text-xs text-zinc-600">Rupture</span>
            : (
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  done ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"
                }`}
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
    <main className="min-h-screen bg-black pt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <ScrollReveal>
          <h1 className="text-3xl font-bold text-white mb-1">Boutique</h1>
          <p className="text-zinc-500 mb-8">{filtered.length} produit{filtered.length !== 1 ? "s" : ""}</p>
        </ScrollReveal>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters */}
          <aside className="w-full md:w-56 shrink-0 space-y-6">
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Catégories</div>
              <div className="space-y-1">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => { setCategory(c.value); resetPage(); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === c.value
                        ? "bg-violet-600 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Prix max — {priceMax} €
              </div>
              <input
                type="range" min={0} max={200} step={5} value={priceMax}
                onChange={e => { setPriceMax(Number(e.target.value)); resetPage(); }}
                className="w-full accent-violet-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox" checked={inStock}
                onChange={e => { setInStock(e.target.checked); resetPage(); }}
                className="accent-violet-500"
              />
              En stock seulement
            </label>

            <button
              onClick={() => { setCategory(""); setPriceMax(200); setInStock(false); setSearch(""); setSort("default"); setPage(1); }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="search" placeholder="Rechercher…" value={search}
                onChange={e => { setSearch(e.target.value); resetPage(); }}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 text-sm"
              />
              <select
                value={sort} onChange={e => { setSort(e.target.value); resetPage(); }}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-sm focus:outline-none focus:border-violet-500"
              >
                {SORTS.map(s => <option key={s.value} value={s.value} className="bg-zinc-900">{s.label}</option>)}
              </select>
            </div>

            {pageItems.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">
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
                    className={`w-8 h-8 rounded-full text-sm transition-colors ${
                      page === i + 1 ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-white"
                    }`}
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
