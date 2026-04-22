"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, Product } from "@/lib/api";
import { useCart } from "@/store/cart";
import ScrollReveal from "@/components/animations/ScrollReveal";
import { getAllProducts } from "@/lib/products-data";

const STATIC_PRODUCTS: Product[] = getAllProducts().map(p => ({
  _id: p.slug,
  name: p.name,
  slug: p.slug,
  category: p.category,
  price: p.basePrice,
  comparePrice: p.comparePrice,
  description: p.description,
  inStock: p.inStock,
  rating: p.rating,
}));

const CATEGORIES = [
  { value:"", label:"Tous les produits" },
  { value:"macro-pads", label:"Macro Pads" },
  { value:"kits", label:"Kits DIY" },
  { value:"accessories", label:"Accessoires" },
];

const SORTS = [
  { value:"newest", label:"Plus récents" },
  { value:"price_asc", label:"Prix croissant" },
  { value:"price_desc", label:"Prix décroissant" },
  { value:"rating", label:"Mieux notés" },
];

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(value) ? "text-yellow-400" : "text-zinc-700"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const add = useCart(s => s.add);
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const rating = product.rating ?? { average: product.rating_average ?? 0, count: product.rating_count ?? 0 };

  const handleAdd = async () => {
    setAdding(true);
    try { await add(product._id || product.id!, 1); setDone(true); setTimeout(() => setDone(false), 2000); }
    catch { /* API down — still show feedback */ setDone(true); setTimeout(() => setDone(false), 2000); }
    finally { setAdding(false); }
  };

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-violet-500/40 transition-all">
      <Link href={`/shop/${product.slug}`}>
        <div className="h-44 bg-gradient-to-br from-violet-900/20 to-zinc-900 flex items-center justify-center text-5xl">
          📦
        </div>
      </Link>
      <div className="p-4">
        <div className="text-xs text-zinc-500 mb-1 capitalize">{product.category?.replace("-", " ")}</div>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors mb-1 line-clamp-1">{product.name}</h3>
        </Link>
        {rating.count > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <Stars value={rating.average} />
            <span className="text-xs text-zinc-500">{rating.average} ({rating.count})</span>
          </div>
        )}
        <p className="text-zinc-500 text-xs line-clamp-2 mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{product.price.toFixed(2)} €</span>
            {product.comparePrice && <span className="text-xs text-zinc-600 line-through">{product.comparePrice.toFixed(2)} €</span>}
          </div>
          {product.inStock === false || product.stock === 0
            ? <span className="text-xs text-zinc-600">Rupture</span>
            : (
              <button
                onClick={handleAdd}
                disabled={adding}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${done ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"}`}
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
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priceMax, setPriceMax] = useState(200);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const PER_PAGE = 9;

  useEffect(() => {
    api.products.getAll()
      .then(r => setProducts(r.products?.length ? r.products : STATIC_PRODUCTS))
      .catch(() => setProducts(STATIC_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  const applyFilters = useCallback(() => {
    let list = [...products];
    if (category) list = list.filter(p => p.category === category);
    if (inStock) list = list.filter(p => p.inStock !== false && p.stock !== 0);
    if (priceMax < 200) list = list.filter(p => p.price <= priceMax);
    if (search) { const q = search.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)); }
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "rating") list.sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0));
    setFiltered(list);
    setPage(1);
  }, [products, category, inStock, priceMax, search, sort]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <main className="min-h-screen bg-black pt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <ScrollReveal>
          <h1 className="text-3xl font-bold text-white mb-1">Boutique</h1>
          <p className="text-zinc-500 mb-8">{filtered.length} produit{filtered.length !== 1 ? "s" : ""}</p>
        </ScrollReveal>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filtres */}
          <aside className="w-full md:w-56 shrink-0 space-y-6">
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Catégories</div>
              <div className="space-y-1">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === c.value ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
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
                onChange={e => setPriceMax(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="accent-violet-500" />
              En stock seulement
            </label>

            <button
              onClick={() => { setCategory(""); setPriceMax(200); setInStock(false); setSearch(""); setSort("newest"); }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </aside>

          {/* Grille */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="search" placeholder="Rechercher…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 text-sm"
              />
              <select
                value={sort} onChange={e => setSort(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-sm focus:outline-none focus:border-violet-500"
              >
                {SORTS.map(s => <option key={s.value} value={s.value} className="bg-zinc-900">{s.label}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/5 bg-white/5 h-64 animate-pulse" />
                ))}
              </div>
            ) : pageItems.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">
                <div className="text-5xl mb-4">🔍</div>
                <p>Aucun produit trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageItems.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {[...Array(pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`w-8 h-8 rounded-full text-sm transition-colors ${page === i + 1 ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-white"}`}
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
