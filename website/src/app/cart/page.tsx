"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart, getShipping, FREE_SHIPPING_THRESHOLD } from "@/store/cart";
import CheckoutButton from "@/components/CheckoutButton";

export default function CartPage() {
  const { items, coupon, loading, fetch, update, remove, clear, applyCoupon, removeCoupon, subtotal, count } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); fetch(); }, [fetch]);

  const sub = subtotal();
  const shipping = getShipping(sub);
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, sub - discount + shipping);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponError("");
    try {
      await applyCoupon(couponInput.trim());
      setCouponInput("");
    } catch (e: any) {
      // demo fallback
      if (couponInput.toUpperCase() === "AXION10") {
        await applyCoupon("AXION10").catch(() => null);
        setCouponInput("");
      } else {
        setCouponError(e.message || "Code invalide");
      }
    } finally { setCouponLoading(false); }
  };

  if (!mounted || loading) {
    return (
      <main className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-black pt-20 flex flex-col items-center justify-center text-center px-6">
        <div className="text-7xl mb-6 opacity-30">🛒</div>
        <h1 className="text-2xl font-bold text-white mb-3">Votre panier est vide</h1>
        <p className="text-zinc-500 mb-8 max-w-sm">Découvrez nos produits et commencez votre setup !</p>
        <Link href="/shop" className="px-8 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all">
          Découvrir la boutique →
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pt-20">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">
            Mon Panier <span className="text-zinc-500 font-normal text-lg">({count()} article{count() > 1 ? "s" : ""})</span>
          </h1>
          <button onClick={clear} className="text-xs text-zinc-600 hover:text-red-400 transition-colors">Vider le panier</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item._id || item.id} className="flex gap-4 p-4 rounded-2xl border border-white/10 bg-white/5">
                <div className="w-16 h-16 rounded-xl bg-violet-900/30 flex items-center justify-center text-2xl shrink-0">📦</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{item.name}</div>
                  {item.variantLabel && <div className="text-xs text-zinc-500 mt-0.5">{item.variantLabel}</div>}
                  <div className="text-sm text-zinc-400 mt-1">{item.price.toFixed(2)} €</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border border-white/10 rounded-full px-1">
                    <button onClick={() => update(item._id || item.id!, (item.quantity || 1) - 1)} className="w-6 h-6 text-zinc-400 hover:text-white transition-colors text-sm">−</button>
                    <span className="w-6 text-center text-sm text-white">{item.quantity || 1}</span>
                    <button onClick={() => update(item._id || item.id!, (item.quantity || 1) + 1)} className="w-6 h-6 text-zinc-400 hover:text-white transition-colors text-sm">+</button>
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-white">
                    {((item.price || 0) * (item.quantity || 1)).toFixed(2)} €
                  </div>
                  <button onClick={() => remove(item._id || item.id!)} className="text-zinc-600 hover:text-red-400 transition-colors ml-1">✕</button>
                </div>
              </div>
            ))}

            <Link href="/shop" className="inline-block mt-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">← Continuer mes achats</Link>
          </div>

          {/* Résumé */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 h-fit space-y-4">
            <h2 className="font-bold text-white text-lg">Résumé</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Sous-total</span><span>{sub.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Livraison</span>
                <span>{shipping === 0 ? <span className="text-green-400">Gratuite</span> : `${shipping.toFixed(2)} €`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon <strong>{coupon!.code}</strong></span>
                  <span>−{discount.toFixed(2)} €</span>
                </div>
              )}
            </div>

            {shipping > 0 && (
              <p className="text-xs text-zinc-600">
                💡 Plus que <strong className="text-zinc-400">{(FREE_SHIPPING_THRESHOLD - sub).toFixed(2)} €</strong> pour la livraison gratuite
              </p>
            )}

            <div className="border-t border-white/10 pt-4 flex justify-between font-bold text-white">
              <span>Total</span><span>{total.toFixed(2)} €</span>
            </div>

            {/* Coupon */}
            <div className="space-y-1">
              {coupon ? (
                <div className="flex items-center justify-between text-xs text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
                  <span>Code <strong>{coupon.code}</strong> appliqué</span>
                  <button onClick={removeCoupon} className="text-zinc-400 hover:text-white transition-colors">✕</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={couponInput} onChange={e => { setCouponInput(e.target.value); setCouponError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="Code promo"
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                    />
                    <button
                      onClick={handleApplyCoupon} disabled={couponLoading}
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-zinc-300 transition-colors"
                    >
                      {couponLoading ? "…" : "Appliquer"}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-400">{couponError}</p>}
                </>
              )}
            </div>

            <CheckoutButton className="block w-full py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-center transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100" />
            <p className="text-center text-xs text-zinc-600">🔒 Paiement 100% sécurisé</p>
          </div>
        </div>
      </div>
    </main>
  );
}
