"use client";

import { useState, useMemo } from "react";
import {
  type ProductVariantFull,
  type ProductOption,
  formatPrice,
  formatPriceAdd,
  normalizeLidEngravingText,
  isValidLidEngravingText,
  formatLidVariantSegment,
} from "@/lib/products-data";
import { useCart } from "@/store/cart";
import { api, type CartItem } from "@/lib/api";

export default function ProductConfigurator({ product }: { product: ProductVariantFull }) {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    product.options.forEach(opt => {
      const first = opt.choices.find(c => c.available !== false) ?? opt.choices[0];
      defaults[opt.id] = first.value;
      if (opt.type === "lidEngraving" && opt.textFieldId) {
        defaults[opt.textFieldId] = "";
      }
    });
    return defaults;
  });
  const [qty,    setQty]    = useState(1);
  const [adding, setAdding] = useState(false);
  const [done,   setDone]   = useState(false);

  const computedTotal = useMemo(() => {
    return product.options.reduce((sum, opt) => {
      const choice = opt.choices.find(c => c.value === selections[opt.id]);
      return sum + (choice?.priceAdd ?? 0);
    }, product.price);
  }, [product, selections]);

  const variantLabel = useMemo(() => {
    return product.options
      .map(opt => {
        if (opt.type === "lidEngraving") {
          const seg = formatLidVariantSegment(opt, selections);
          return seg ?? "";
        }
        const choice = opt.choices.find(c => c.value === selections[opt.id]);
        return choice?.label ?? selections[opt.id] ?? "";
      })
      .filter(Boolean)
      .join(" · ");
  }, [product, selections]);

  const lidEngravingInvalid = useMemo(() => {
    for (const opt of product.options) {
      if (opt.type !== "lidEngraving") continue;
      if (selections[opt.id] !== "text") continue;
      const max = opt.textMaxLength ?? 16;
      const t = normalizeLidEngravingText(selections[opt.textFieldId ?? ""] ?? "");
      if (!isValidLidEngravingText(t, max)) return true;
    }
    return false;
  }, [product.options, selections]);

  /** Identifie une même variante pour fusionner les quantités dans le panier. */
  const selectionSignature = useMemo(
    () =>
      product.options
        .map(o => {
          if (o.type === "lidEngraving" && o.textFieldId) {
            const text = normalizeLidEngravingText(selections[o.textFieldId] ?? "");
            return `${selections[o.id] ?? "\0"}\u001e${text}`;
          }
          return selections[o.id] ?? "\0";
        })
        .join("\u001f"),
    [product.options, selections],
  );

  const handleAddToCart = async () => {
    if (!product.inStock || adding || lidEngravingInvalid) return;
    setAdding(true);
    try {
      await api.cart.add(product.slug, qty);
    } catch {
      /* panier API distant optionnel */
    }

    const sel: Record<string, string> = { ...selections };
    for (const opt of product.options) {
      if (opt.type === "lidEngraving" && opt.textFieldId) {
        sel[opt.textFieldId] = normalizeLidEngravingText(sel[opt.textFieldId] ?? "");
      }
    }
    const unitEuros = computedTotal / 100;
    useCart.setState(state => {
      const idx = state.items.findIndex(i => {
        if (i.productId !== product.slug) return false;
        const sig = product.options
          .map(o => {
            if (o.type === "lidEngraving" && o.textFieldId) {
              const text = normalizeLidEngravingText(i.selections?.[o.textFieldId] ?? "");
              return `${i.selections?.[o.id] ?? "\0"}\u001e${text}`;
            }
            return i.selections?.[o.id] ?? "\0";
          })
          .join("\u001f");
        return sig === selectionSignature;
      });
      if (idx >= 0) {
        const next = [...state.items];
        const cur = next[idx];
        next[idx] = {
          ...cur,
          quantity: (cur.quantity || 1) + qty,
          price: unitEuros,
          variantLabel,
          selections: sel,
        };
        return { items: next };
      }
      const item: CartItem = {
        _id: `local-${Date.now()}`,
        productId: product.slug,
        name: product.name,
        price: unitEuros,
        quantity: qty,
        variantLabel,
        selections: sel,
      };
      return { items: [...state.items, item] };
    });

    setDone(true);
    setAdding(false);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <div className="space-y-6">
      {product.options.map(opt =>
        opt.type === "lidEngraving" ? (
          <LidEngravingPicker
            key={opt.id}
            option={opt}
            mode={selections[opt.id] ?? "none"}
            textValue={selections[opt.textFieldId ?? "lid_engraving_text"] ?? ""}
            onModeChange={val =>
              setSelections(prev => ({ ...prev, [opt.id]: val }))
            }
            onTextChange={text =>
              setSelections(prev => ({
                ...prev,
                [opt.textFieldId ?? "lid_engraving_text"]: text,
              }))
            }
          />
        ) : (
          <OptionPicker
            key={opt.id}
            option={opt}
            selected={selections[opt.id]}
            onChange={val => setSelections(prev => ({ ...prev, [opt.id]: val }))}
          />
        ),
      )}

      <div className="pt-6" style={{ borderTop: "0.5px solid var(--color-border)" }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p
              className="text-xs mb-1 uppercase tracking-wider"
              style={{ color: "var(--color-text-mute)" }}
            >
              Prix total
            </p>
            <p className="text-4xl font-semibold" style={{ color: "var(--color-text)" }}>
              {formatPrice(computedTotal)}
            </p>
            {product.comparePrice && computedTotal === product.price && (
              <p className="text-sm line-through mt-0.5" style={{ color: "var(--color-text-mute)" }}>
                {formatPrice(product.comparePrice)}
              </p>
            )}
          </div>

          <div
            className="flex items-center gap-1 rounded-full px-1 py-0.5"
            style={{ border: "0.5px solid var(--color-border)" }}
          >
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xl leading-none transition-colors"
              style={{ color: "var(--color-text-mute)" }}
            >
              −
            </button>
            <span className="text-sm font-medium w-5 text-center select-none" style={{ color: "var(--color-text)" }}>
              {qty}
            </span>
            <button
              onClick={() => setQty(q => Math.min(10, q + 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xl leading-none transition-colors"
              style={{ color: "var(--color-text-mute)" }}
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.comingSoon || !product.inStock || adding || lidEngravingInvalid}
          className="w-full py-4 font-semibold text-base transition-all rounded-full"
          style={{
            background: product.comingSoon || !product.inStock
              ? "var(--color-border)"
              : done
              ? "#16a34a"
              : "var(--color-accent)",
            color: product.comingSoon || !product.inStock ? "var(--color-text-mute)" : "#fff",
            cursor: product.comingSoon || !product.inStock ? "not-allowed" : "pointer",
            opacity: adding ? 0.7 : 1,
          }}
        >
          {product.comingSoon
            ? "Bientôt disponible"
            : !product.inStock
            ? "Rupture de stock"
            : lidEngravingInvalid
            ? "Indique un texte gravé valide"
            : done
            ? "✓ Ajouté au panier"
            : adding
            ? "Ajout en cours…"
            : qty > 1
            ? `Ajouter ${qty} × au panier — ${formatPrice(computedTotal * qty)}`
            : `Ajouter au panier — ${formatPrice(computedTotal)}`}
        </button>

        <p className="text-center text-xs mt-3" style={{ color: "var(--color-text-mute)" }}>
          Livraison gratuite dès 100 € · Expédition 3–5 jours ouvrés
        </p>
      </div>
    </div>
  );
}

function LidEngravingPicker({
  option,
  mode,
  textValue,
  onModeChange,
  onTextChange,
}: {
  option: ProductOption;
  mode: string;
  textValue: string;
  onModeChange: (val: string) => void;
  onTextChange: (text: string) => void;
}) {
  if (option.type !== "lidEngraving") return null;
  const maxLen = option.textMaxLength ?? 16;
  const textOk = mode !== "text" || isValidLidEngravingText(normalizeLidEngravingText(textValue), maxLen);

  return (
    <div>
      <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
        {option.label}
      </p>
      <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--color-text-mute)" }}>
        Gravure mécanique en creux sur le couvercle (pas d’impression couleur). Texte court ou logo ;
        pour un logo perso, envoi d’un fichier vectoriel (SVG / DXF) après commande.
      </p>
      <div className="space-y-2">
        {option.choices.map(choice => {
          const isSelected = mode === choice.value;
          const isDisabled = choice.available === false;
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => !isDisabled && onModeChange(choice.value)}
              disabled={isDisabled}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all text-left"
              style={{
                border: isSelected ? `1.5px solid var(--color-accent)` : "0.5px solid var(--color-border)",
                background: isSelected ? "var(--color-accent-lt)" : "var(--color-bg-card)",
                color: isDisabled ? "var(--color-text-mute)" : "var(--color-text)",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                  style={{ borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)" }}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
                  )}
                </div>
                <span className="min-w-0">{choice.label}</span>
                {choice.badge && (
                  <span className="badge shrink-0 text-xs">{choice.badge}</span>
                )}
              </div>
              {choice.priceAdd !== undefined && choice.priceAdd !== 0 && (
                <span
                  className="text-xs shrink-0 ml-3"
                  style={{ color: isSelected ? "var(--color-accent)" : "var(--color-text-mute)" }}
                >
                  {formatPriceAdd(choice.priceAdd)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {mode === "text" && (
        <div className="mt-4">
          <label
            className="text-xs font-medium block mb-1.5"
            style={{ color: "var(--color-text)" }}
            htmlFor={`lid-text-${option.id}`}
          >
            Texte à graver
          </label>
          <input
            id={`lid-text-${option.id}`}
            type="text"
            value={textValue}
            onChange={e => onTextChange(e.target.value.slice(0, maxLen))}
            maxLength={maxLen}
            placeholder="Ex. Axion Studio"
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-shadow"
            style={{
              background: "var(--color-bg-card)",
              border: `0.5px solid ${textOk ? "var(--color-border)" : "#c45c5c"}`,
              color: "var(--color-text)",
              boxShadow: textOk ? "none" : "0 0 0 1px rgba(196, 92, 92, 0.25)",
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex justify-between mt-1.5 gap-2">
            <span className="text-xs" style={{ color: "var(--color-text-mute)" }}>
              Lettres, chiffres, espaces, tiret ou apostrophe — {maxLen} caractères max.
            </span>
            <span className="text-xs tabular-nums shrink-0" style={{ color: "var(--color-text-mute)" }}>
              {normalizeLidEngravingText(textValue).length}/{maxLen}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function OptionPicker({ option, selected, onChange }: {
  option: ProductOption;
  selected: string;
  onChange: (val: string) => void;
}) {
  if (option.type === "lidEngraving") return null;

  if (option.type === "color") {
    const selectedChoice = option.choices.find(c => c.value === selected);
    return (
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text)" }}>
          {option.label}
          {selectedChoice && (
            <span className="font-normal ml-1.5" style={{ color: "var(--color-text-mute)" }}>
              — {selectedChoice.label}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {option.choices.map(choice => (
            <button
              key={choice.value}
              onClick={() => choice.available !== false && onChange(choice.value)}
              title={choice.label}
              className="w-8 h-8 rounded-full transition-all focus:outline-none"
              style={{
                background: choice.color ?? "#555",
                outline: selected === choice.value ? `2px solid var(--color-accent)` : "none",
                outlineOffset: "2px",
                transform: selected === choice.value ? "scale(1.1)" : "scale(1)",
                opacity: choice.available === false ? 0.25 : 1,
                cursor: choice.available === false ? "not-allowed" : "pointer",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (option.type === "select") {
    return (
      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: "var(--color-text)" }}>
          {option.label}
        </label>
        <div className="relative">
          <select
            value={selected}
            onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none appearance-none cursor-pointer pr-8"
            style={{
              background: "var(--color-bg-card)",
              border: "0.5px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {option.choices.map(c => (
              <option key={c.value} value={c.value} disabled={c.available === false}>
                {c.label}
                {c.badge ? ` [${c.badge}]` : ""}
                {c.priceAdd ? ` (${formatPriceAdd(c.priceAdd)})` : ""}
              </option>
            ))}
          </select>
          <div
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "var(--color-text-mute)" }}
          >
            ▾
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>{option.label}</p>
      <div className="space-y-2">
        {option.choices.map(choice => {
          const isSelected = selected === choice.value;
          const isDisabled = choice.available === false;
          return (
            <button
              key={choice.value}
              onClick={() => !isDisabled && onChange(choice.value)}
              disabled={isDisabled}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all text-left"
              style={{
                border: isSelected ? `1.5px solid var(--color-accent)` : "0.5px solid var(--color-border)",
                background: isSelected ? "var(--color-accent-lt)" : "var(--color-bg-card)",
                color: isDisabled ? "var(--color-text-mute)" : "var(--color-text)",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                  style={{ borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)" }}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
                  )}
                </div>
                <span className="truncate">{choice.label}</span>
                {choice.badge && (
                  <span className="badge shrink-0 text-xs">{choice.badge}</span>
                )}
              </div>
              {choice.priceAdd !== undefined && choice.priceAdd !== 0 && (
                <span
                  className="text-xs shrink-0 ml-3"
                  style={{ color: isSelected ? "var(--color-accent)" : "var(--color-text-mute)" }}
                >
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
