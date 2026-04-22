"use client";

import { useState, useMemo } from "react";
import { type ProductVariantFull, type ProductOption, formatPrice, formatPriceAdd } from "@/lib/products-data";
import { useCart } from "@/store/cart";
import { api, type CartItem } from "@/lib/api";

export default function ProductConfigurator({ product }: { product: ProductVariantFull }) {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    product.options.forEach(opt => {
      const first = opt.choices.find(c => c.available !== false) ?? opt.choices[0];
      defaults[opt.id] = first.value;
    });
    return defaults;
  });
  const [qty,    setQty]    = useState(1);
  const [adding, setAdding] = useState(false);
  const [done,   setDone]   = useState(false);

  // Total in cents — safe to pass directly to Stripe as unit_amount
  const computedTotal = useMemo(() => {
    return product.options.reduce((sum, opt) => {
      const choice = opt.choices.find(c => c.value === selections[opt.id]);
      return sum + (choice?.priceAdd ?? 0);
    }, product.price);
  }, [product, selections]);

  const variantLabel = useMemo(() => {
    return product.options.map(opt => {
      const choice = opt.choices.find(c => c.value === selections[opt.id]);
      return choice?.label ?? selections[opt.id];
    }).join(" · ");
  }, [product, selections]);

  const handleAddToCart = async () => {
    if (!product.inStock || adding) return;
    setAdding(true);
    try {
      // TODO: Stripe checkout — replace api.cart.add with:
      // await fetch("/api/checkout", { method: "POST", body: JSON.stringify({
      //   line_items: [{ price_data: { unit_amount: computedTotal, currency: "eur",
      //     product_data: { name: product.name } }, quantity: qty }]
      // }) })
      await api.cart.add(product.slug, qty);
    } catch {
      const item: CartItem = {
        _id: `local-${Date.now()}`,
        productId: product.slug,
        name: product.name,
        price: computedTotal / 100, // cart stores euros for display
        quantity: qty,
        variantLabel,
      };
      useCart.setState(state => ({ items: [...state.items, item] }));
    }
    setDone(true);
    setAdding(false);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <div className="space-y-6">
      {product.options.map(opt => (
        <OptionPicker
          key={opt.id}
          option={opt}
          selected={selections[opt.id]}
          onChange={val => setSelections(prev => ({ ...prev, [opt.id]: val }))}
        />
      ))}

      <div className="pt-6 border-t border-white/10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs text-zinc-600 mb-1 uppercase tracking-wider">Prix total</p>
            <p className="text-4xl font-bold text-white">{formatPrice(computedTotal)}</p>
            {product.comparePrice && computedTotal === product.price && (
              <p className="text-zinc-600 text-sm line-through mt-0.5">{formatPrice(product.comparePrice)}</p>
            )}
          </div>

          <div className="flex items-center gap-1 border border-white/10 rounded-full px-1 py-0.5">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full text-zinc-400 hover:text-white transition-colors flex items-center justify-center text-xl leading-none"
            >
              −
            </button>
            <span className="text-white text-sm font-medium w-5 text-center select-none">{qty}</span>
            <button
              onClick={() => setQty(q => Math.min(10, q + 1))}
              className="w-8 h-8 rounded-full text-zinc-400 hover:text-white transition-colors flex items-center justify-center text-xl leading-none"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!product.inStock || adding}
          className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
            !product.inStock
              ? "bg-white/5 text-zinc-600 cursor-not-allowed"
              : done
              ? "bg-green-600 text-white scale-[0.99]"
              : adding
              ? "bg-violet-700 text-white/60 cursor-wait"
              : "bg-violet-600 hover:bg-violet-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-900/30"
          }`}
        >
          {!product.inStock
            ? "Rupture de stock"
            : done
            ? "✓ Ajouté au panier"
            : adding
            ? "Ajout en cours…"
            : qty > 1
            ? `Ajouter ${qty} × au panier — ${formatPrice(computedTotal * qty)}`
            : `Ajouter au panier — ${formatPrice(computedTotal)}`}
        </button>

        <p className="text-center text-xs text-zinc-700 mt-3">
          Livraison gratuite dès 100 € · Expédition 3–5 jours ouvrés
        </p>
      </div>
    </div>
  );
}

function OptionPicker({ option, selected, onChange }: {
  option: ProductOption;
  selected: string;
  onChange: (val: string) => void;
}) {
  if (option.type === "color") {
    const selectedChoice = option.choices.find(c => c.value === selected);
    return (
      <div>
        <p className="text-sm font-medium text-zinc-300 mb-3">
          {option.label}
          {selectedChoice && (
            <span className="font-normal text-zinc-500 ml-1.5">— {selectedChoice.label}</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {option.choices.map(choice => (
            <button
              key={choice.value}
              onClick={() => choice.available !== false && onChange(choice.value)}
              title={choice.label}
              className={`w-8 h-8 rounded-full transition-all focus:outline-none ${
                selected === choice.value
                  ? "ring-2 ring-violet-400 ring-offset-2 ring-offset-black scale-110"
                  : "hover:scale-105 ring-1 ring-white/10"
              } ${choice.available === false ? "opacity-25 cursor-not-allowed" : "cursor-pointer"}`}
              style={{ background: choice.color ?? "#555" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (option.type === "select") {
    return (
      <div>
        <label className="text-sm font-medium text-zinc-300 mb-2 block">{option.label}</label>
        <div className="relative">
          <select
            value={selected}
            onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer pr-8"
          >
            {option.choices.map(c => (
              <option key={c.value} value={c.value} disabled={c.available === false} className="bg-zinc-900">
                {c.label}
                {c.badge ? ` [${c.badge}]` : ""}
                {c.priceAdd ? ` (${formatPriceAdd(c.priceAdd)})` : ""}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">▾</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-zinc-300 mb-2">{option.label}</p>
      <div className="space-y-2">
        {option.choices.map(choice => {
          const isSelected = selected === choice.value;
          const isDisabled = choice.available === false;
          return (
            <button
              key={choice.value}
              onClick={() => !isDisabled && onChange(choice.value)}
              disabled={isDisabled}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all text-left ${
                isSelected
                  ? "border-violet-500 bg-violet-500/10 text-white"
                  : isDisabled
                  ? "border-white/5 text-zinc-700 cursor-not-allowed bg-white/[0.01]"
                  : "border-white/10 text-zinc-300 hover:border-white/20 hover:bg-white/5 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "border-violet-400" : "border-zinc-600"
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                </div>
                <span className="truncate">{choice.label}</span>
                {choice.badge && (
                  <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">
                    {choice.badge}
                  </span>
                )}
              </div>
              {choice.priceAdd !== undefined && choice.priceAdd !== 0 && (
                <span className={`text-xs shrink-0 ml-3 ${isSelected ? "text-violet-300" : "text-zinc-500"}`}>
                  {formatPriceAdd(choice.priceAdd)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
