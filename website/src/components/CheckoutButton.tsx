"use client";

import { useState } from "react";
import { useCart } from "@/store/cart";

interface Props {
  className?: string;
  label?: string;
}

export default function CheckoutButton({ className, label = "Payer avec Stripe →" }: Props) {
  const items = useCart(s => s.items);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({
            productId:    i.productId,
            name:         i.name,
            price:        Math.round((i.price ?? 0) * 100), // euros → cents
            quantity:     i.quantity ?? 1,
            variantLabel: i.variantLabel,
          })),
        }),
      });

      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Erreur inattendue");

      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleCheckout}
        disabled={loading || items.length === 0}
        className={className}
      >
        {loading ? "Redirection vers Stripe…" : label}
      </button>
      {error && (
        <p className="text-center text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}
