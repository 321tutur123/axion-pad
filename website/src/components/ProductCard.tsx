"use client";

import Link from "next/link";
import { formatPrice, ProductVariantFull } from "@/lib/products-data";

interface Props {
  product: ProductVariantFull;
}

export default function ProductCard({ product }: Props) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="card p-4 group"
    >
      <div className="text-2xl mb-2">{productEmoji(product.slug)}</div>
      <div
        className="text-sm font-medium leading-tight mb-1 transition-colors"
        style={{ color: "var(--color-text)" }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) =>
          (e.currentTarget.style.color = "var(--color-accent)")
        }
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) =>
          (e.currentTarget.style.color = "var(--color-text)")
        }
      >
        {product.name}
      </div>
      <div className="text-xs" style={{ color: "var(--color-text-mute)" }}>
        {formatPrice(product.price)}
      </div>
    </Link>
  );
}

function productEmoji(slug: string): string {
  if (slug.includes("cable"))   return "🔌";
  if (slug.includes("keycap"))  return "⌨️";
  if (slug.includes("support")) return "🖥️";
  if (slug.includes("pcb"))     return "🔬";
  if (slug.includes("kit"))     return "🔧";
  return "⌨️";
}