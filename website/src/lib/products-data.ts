import rawData from "../data/products.json";

export interface ProductChoice {
  value: string;
  label: string;
  priceAdd?: number; // cents
  color?: string;
  available?: boolean;
  badge?: string;
}

export interface ProductOption {
  id: string;
  label: string;
  type: "select" | "color" | "radio" | "lidEngraving";
  choices: ProductChoice[];
  /** Option `lidEngraving` : clé dans `selections` pour le texte gravé (mode `text`). */
  textFieldId?: string;
  /** Longueur max du texte gravé (après normalisation). Défaut 16. */
  textMaxLength?: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductVariantFull {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price: number;        // cents — use formatPrice() to display
  comparePrice?: number; // cents
  category: string;
  badge?: string;
  stock: number;        // 0 = out of stock
  inStock: boolean;     // derived: stock > 0 && !comingSoon
  comingSoon?: boolean; // true = En développement, no purchase
  imagePath: string;    // drop file at public/ + imagePath
  description: string;
  longDescription: string;
  options: ProductOption[];
  specs: ProductSpec[];
  includes: string[];
}

/** Converts cents to a display string: 7999 → "79.99 €" */
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2) + " €";
}

/** Formats a priceAdd delta: +800 → "+8.00 €", -800 → "−8.00 €" */
export function formatPriceAdd(cents: number): string {
  const abs = Math.abs(cents);
  const display = (abs / 100).toFixed(2) + " €";
  return cents >= 0 ? `+${display}` : `−${display}`;
}

/** Texte gravé couvercle : trim + espaces consécutifs. */
export function normalizeLidEngravingText(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

/**
 * Lettres (toutes langues), chiffres, espace, tiret, apostrophe typographique ou ASCII.
 * Pas d’émojis ni ponctuation « spéciale » (évite abus en fabrication).
 */
export function isValidLidEngravingText(text: string, maxLen: number): boolean {
  const n = normalizeLidEngravingText(text);
  if (n.length === 0 || n.length > maxLen) return false;
  return /^[\p{L}\d \-'\u2019]+$/u.test(n);
}

/** Segment libellé panier / Stripe pour une option gravure couvercle (null si « sans »). */
export function formatLidVariantSegment(
  opt: ProductOption,
  selections: Record<string, string>,
): string | null {
  if (opt.type !== "lidEngraving") return null;
  const mode = selections[opt.id];
  if (!mode || mode === "none") return null;
  if (mode === "text" && opt.textFieldId) {
    const t = normalizeLidEngravingText(selections[opt.textFieldId] ?? "");
    return t ? `Couvercle : « ${t} »` : null;
  }
  const choice = opt.choices.find(c => c.value === mode);
  return choice ? `Couvercle : ${choice.label}` : `Couvercle : ${mode}`;
}

/** Description courte pour métadonnées Stripe (gravure creuse). */
export function buildCheckoutEngravingDescription(
  product: ProductVariantFull,
  selections: Record<string, string> | undefined,
): string | undefined {
  if (!selections) return undefined;
  const parts: string[] = [];
  for (const opt of product.options) {
    if (opt.type !== "lidEngraving") continue;
    const mode = selections[opt.id];
    if (!mode || mode === "none") continue;
    const textKey = opt.textFieldId ?? "lid_engraving_text";
    const maxLen = opt.textMaxLength ?? 16;
    if (mode === "text") {
      const t = normalizeLidEngravingText(selections[textKey] ?? "");
      if (isValidLidEngravingText(t, maxLen)) {
        parts.push(`Gravure en creux sur couvercle — texte : ${t}`);
      }
    } else {
      const c = opt.choices.find(x => x.value === mode);
      parts.push(`Gravure en creux sur couvercle — ${c?.label ?? mode}`);
    }
  }
  if (parts.length === 0) return undefined;
  return parts.join(". ").slice(0, 450);
}

type RawProduct = Omit<ProductVariantFull, "inStock">;

const PRODUCTS: Record<string, ProductVariantFull> = Object.fromEntries(
  (rawData.products as unknown as RawProduct[]).map(p => [
    p.slug,
    { ...p, inStock: p.stock > 0 && !p.comingSoon },
  ])
);

export function getProduct(slug: string): ProductVariantFull | null {
  return PRODUCTS[slug] ?? null;
}

export function getAllProducts(): ProductVariantFull[] {
  return Object.values(PRODUCTS);
}

/**
 * Prix unitaire (centimes) à partir des choix d’options — null si valeur manquante ou indisponible.
 * Utilisé côté checkout pour ignorer le prix client.
 */
export function computeUnitPriceFromSelections(
  product: ProductVariantFull,
  selections: Record<string, string> | null | undefined,
): number | null {
  if (product.options.length === 0) return product.price;
  if (!selections) return null;
  let total = product.price;
  for (const opt of product.options) {
    const val = selections[opt.id];
    if (val == null || val === "") return null;
    const choice = opt.choices.find(c => c.value === val);
    if (!choice || choice.available === false) return null;
    if (opt.type === "lidEngraving" && val === "text") {
      const textKey = opt.textFieldId ?? "lid_engraving_text";
      const maxLen = opt.textMaxLength ?? 16;
      const text = normalizeLidEngravingText(selections[textKey] ?? "");
      if (!isValidLidEngravingText(text, maxLen)) return null;
    }
    total += choice.priceAdd ?? 0;
  }
  return total;
}
