"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart, getShipping, FREE_SHIPPING_THRESHOLD } from "@/store/cart";
import CheckoutButton from "@/components/CheckoutButton";
import { getProduct, getAllProducts } from "@/lib/products-data";

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

  const shippingProgress = Math.min(100, (sub / FREE_SHIPPING_THRESHOLD) * 100);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - sub);

  const cartProductIds = new Set(items.map(i => i.productId));
  const crossSell = getAllProducts()
    .filter(p => p.inStock && !cartProductIds.has(p.slug))
    .slice(0, 2);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponError("");
    try {
      await applyCoupon(couponInput.trim());
      setCouponInput("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (couponInput.toUpperCase() === "AXION10") {
        await applyCoupon("AXION10").catch(() => null);
        setCouponInput("");
      } else {
        setCouponError(msg || "Code invalide");
      }
    } finally { setCouponLoading(false); }
  };

  const cardLine =
    "rounded-2xl border p-4 transition-shadow";
  const cardStyle = {
    borderColor: "var(--color-border)",
    background: "var(--color-bg-card)",
    boxShadow: "0 2px 16px rgba(0,0,0,0.28)",
  } as const;

  if (!mounted || loading) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center" style={{ background: "transparent" }}>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
        />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-6" style={{ background: "transparent" }}>
        <div className="text-7xl mb-6 opacity-35">🛒</div>
        <h1 className="text-2xl font-semibold mb-3" style={{ color: "var(--color-text)" }}>Votre panier est vide</h1>
        <p className="mb-8 max-w-sm" style={{ color: "var(--color-text-mute)" }}>Découvrez nos produits et commencez votre setup.</p>
        <Link href="/shop" className="btn-accent px-8 py-3">
          Découvrir la boutique →
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16" style={{ background: "transparent" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Mon panier{" "}
            <span className="font-normal text-lg" style={{ color: "var(--color-text-mute)" }}>
              ({count()} article{count() > 1 ? "s" : ""})
            </span>
          </h1>
          <button
            type="button"
            onClick={clear}
            className="text-xs transition-colors hover:opacity-80"
            style={{ color: "var(--color-text-mute)" }}
          >
            Vider le panier
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => {
              const product = getProduct(item.productId);
              const stock = product?.stock ?? Infinity;
              const qty = item.quantity || 1;
              const isLowStock = stock < 5 && stock > 0 && stock !== Infinity;

              return (
                <div key={item._id || item.id} className={`flex gap-4 ${cardLine}`} style={cardStyle}>
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "var(--color-accent-lt)" }}
                  >
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" style={{ color: "var(--color-text)" }}>{item.name}</div>
                    {item.variantLabel && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-text-mute)" }}>{item.variantLabel}</div>
                    )}
                    <div className="text-sm mt-1" style={{ color: "var(--color-text-mute)" }}>{item.price.toFixed(2)} €</div>
                    {isLowStock && (
                      <div
                        className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium rounded-full px-2 py-0.5 border"
                        style={{
                          color: "var(--color-accent)",
                          background: "var(--color-accent-muted)",
                          borderColor: "rgba(184,118,92,0.25)",
                        }}
                      >
                        Plus que {stock} en stock
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-1 rounded-full px-1 border"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <button
                        type="button"
                        onClick={() => update(item._id || item.id!, qty - 1)}
                        className="w-6 h-6 transition-colors text-sm"
                        style={{ color: "var(--color-text-mute)" }}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm" style={{ color: "var(--color-text)" }}>{qty}</span>
                      <button
                        type="button"
                        onClick={() => update(item._id || item.id!, qty + 1)}
                        disabled={qty >= stock}
                        className="w-6 h-6 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ color: "var(--color-text-mute)" }}
                      >
                        +
                      </button>
                    </div>
                    <div className="w-16 text-right text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      {((item.price || 0) * qty).toFixed(2)} €
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item._id || item.id!)}
                      className="ml-1 transition-colors hover:opacity-70"
                      style={{ color: "var(--color-text-mute)" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}

            <Link
              href="/shop"
              className="inline-block mt-2 text-sm transition-colors hover:underline"
              style={{ color: "var(--color-text-mute)" }}
            >
              ← Continuer mes achats
            </Link>

            {crossSell.length > 0 && (
              <div className="mt-8 pt-8 border-t" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--color-text-mute)" }}>
                  Complétez votre setup
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {crossSell.map(p => (
                    <Link
                      key={p.slug}
                      href={`/shop/${p.slug}`}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${cardLine}`}
                      style={{
                        ...cardStyle,
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                        style={{ background: "var(--color-accent-lt)" }}
                      >
                        📦
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium leading-tight truncate transition-colors" style={{ color: "var(--color-text)" }}>
                          {p.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--color-text-mute)" }}>
                          {(p.price / 100).toFixed(2)} €
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`${cardLine} p-6 h-fit space-y-4`} style={cardStyle}>
            <h2 className="font-semibold text-lg" style={{ color: "var(--color-text)" }}>Résumé</h2>

            <div className="space-y-1.5">
              {shipping > 0 ? (
                <>
                  <div className="flex justify-between text-xs" style={{ color: "var(--color-text-mute)" }}>
                    <span>
                      Plus que <strong style={{ color: "var(--color-text)" }}>{remaining.toFixed(2)} €</strong> pour la livraison gratuite
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-soft)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${shippingProgress}%`, background: "var(--color-accent)" }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs" style={{ color: "#5a7d62" }}>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(90,125,98,0.15)" }}>
                    <div className="h-full w-full rounded-full" style={{ background: "#6b9274" }} />
                  </div>
                  <span className="shrink-0 font-medium">Livraison offerte</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm" style={{ color: "var(--color-text-mute)" }}>
              <div className="flex justify-between"><span>Sous-total</span><span>{sub.toFixed(2)} €</span></div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span>
                  {shipping === 0 ? <span style={{ color: "#5a7d62" }}>Gratuite</span> : `${shipping.toFixed(2)} €`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between" style={{ color: "#5a7d62" }}>
                  <span>Coupon <strong>{coupon!.code}</strong></span>
                  <span>−{discount.toFixed(2)} €</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4 flex justify-between font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              <span>Total</span><span>{total.toFixed(2)} €</span>
            </div>

            <div className="space-y-1">
              {coupon ? (
                <div
                  className="flex items-center justify-between text-xs rounded-lg px-3 py-2 border"
                  style={{ color: "#5a7d62", background: "rgba(90,125,98,0.08)", borderColor: "rgba(90,125,98,0.2)" }}
                >
                  <span>Code <strong>{coupon.code}</strong> appliqué</span>
                  <button type="button" onClick={removeCoupon} style={{ color: "var(--color-text-mute)" }}>✕</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value); setCouponError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="Code promo"
                      className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 transition-shadow"
                      style={{
                        background: "var(--color-bg-soft)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="px-3 py-2 rounded-lg text-sm transition-colors border"
                      style={{
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                        background: "var(--color-bg-card-alt)",
                      }}
                    >
                      {couponLoading ? "…" : "Appliquer"}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-600">{couponError}</p>}
                </>
              )}
            </div>

            <div
              className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 border"
              style={{
                color: "var(--color-accent)",
                background: "var(--color-accent-muted)",
                borderColor: "rgba(184,118,92,0.22)",
              }}
            >
              Stock limité — commandez vite
            </div>

            <CheckoutButton className="btn-accent block w-full py-3.5 text-center disabled:opacity-60 disabled:cursor-not-allowed" />
            <p className="text-center text-xs" style={{ color: "var(--color-text-mute)" }}>Paiement sécurisé (Stripe)</p>
          </div>
        </div>
      </div>
    </main>
  );
}
