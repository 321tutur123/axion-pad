"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";

export default function CheckoutPage() {
  const { items } = useCart();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(i => ({
              productId:    i.productId,
              name:         i.name,
              price:        Math.round((i.price ?? 0) * 100),
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
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-black pt-20 flex flex-col items-center justify-center text-center px-6">
        <p className="text-red-400 mb-6">{error}</p>
        <button
          onClick={() => router.replace("/cart")}
          className="px-8 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all"
        >
          Retour au panier
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pt-20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-zinc-400">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Redirection vers Stripe…</p>
      </div>
    </main>
  );
}
