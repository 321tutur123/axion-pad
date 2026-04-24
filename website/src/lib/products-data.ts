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
  type: "select" | "color" | "radio";
  choices: ProductChoice[];
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
