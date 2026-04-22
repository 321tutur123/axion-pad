"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

const STEPS = [
  { key: "pending",   label: "Commande reçue",   icon: "📬", desc: "Ta commande a été enregistrée avec succès." },
  { key: "confirmed", label: "En préparation",    icon: "🔧", desc: "Ton Axion Pad est en cours d'assemblage." },
  { key: "shipped",   label: "Expédiée",          icon: "📦", desc: "Ton colis est en route !" },
  { key: "delivered", label: "Livrée",            icon: "✅", desc: "Commande bien reçue. Profite bien !" },
];

function stepIndex(status: OrderStatus) {
  return STEPS.findIndex(s => s.key === status);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: "En attente",     cls: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" },
    confirmed: { label: "En préparation", cls: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
    shipped:   { label: "Expédiée",       cls: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
    delivered: { label: "Livrée",         cls: "bg-green-500/10 text-green-300 border-green-500/20" },
    cancelled: { label: "Annulée",        cls: "bg-red-500/10 text-red-300 border-red-500/20" },
  };
  const s = map[status] ?? { label: status, cls: "bg-white/5 text-zinc-400 border-white/10" };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black pt-20" />}>
      <TrackContent />
    </Suspense>
  );
}

function TrackContent() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  // Pre-fill from URL params (link in confirmation email)
  useEffect(() => {
    const o = params.get("order");
    const e = params.get("email");
    if (o) setOrderNumber(o);
    if (e) setEmail(e);
    if (o && e) search(o, e);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(num: string, mail: string) {
    setLoading(true);
    setError("");
    setOrder(null);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(
        `/api/track?order=${encodeURIComponent(num.trim())}&email=${encodeURIComponent(mail.trim())}`,
        { signal: ctrl.signal }
      );
      if (res.status === 404) { setError("Commande introuvable. Vérifiez le numéro et l'email."); return; }
      if (res.status === 403) { setError("Accès refusé. L'email ne correspond pas à cette commande."); return; }
      if (!res.ok) { setError("Erreur serveur, réessayez dans quelques instants."); return; }
      const data = await res.json();
      setOrder(data.order);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Le serveur ne répond pas. Réessayez plus tard.");
      } else {
        setError("Impossible de joindre le serveur.");
      }
    } finally {
      clearTimeout(t);
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;
    search(orderNumber, email);
  };

  const current = order ? stepIndex(order.status as OrderStatus) : -1;

  return (
    <main className="min-h-screen bg-black pt-20">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Suivi de commande</h1>
          <p className="text-zinc-500 text-[15px]">
            Entre ton numéro de commande et l'adresse email utilisée lors de l'achat.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">
              Numéro de commande
            </label>
            <input
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="cs_live_xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500 font-mono text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">
              Email de commande
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jean@exemple.fr"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-700 focus:outline-none focus:border-violet-500 text-sm transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !orderNumber.trim() || !email.trim()}
            className="w-full py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Recherche…" : "Suivre ma commande →"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm mb-8">
            {error}
          </div>
        )}

        {/* Result */}
        {order && (
          <div className="space-y-4">

            {/* Header card */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Commande</p>
                  <p className="font-mono text-violet-400 text-xl font-bold">{order.order_number}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-zinc-500 text-sm">
                Passée le{" "}
                {new Date(order.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
                {" · "}
                <span className="text-zinc-300 font-medium">{order.total?.toFixed(2)} €</span>
              </p>
            </div>

            {/* Timeline */}
            {order.status !== "cancelled" ? (
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
                <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Progression</h3>
                <div>
                  {STEPS.map((step, i) => {
                    const done    = i < current;
                    const active  = i === current;
                    const pending = i > current;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 transition-all ${
                            done    ? "bg-green-500/20 text-green-400" :
                            active  ? "bg-violet-500/20 text-violet-300 ring-2 ring-violet-500/40" :
                                      "bg-white/5 text-zinc-700"
                          }`}>
                            {done ? "✓" : step.icon}
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 my-1 rounded-full ${done ? "bg-green-500/30" : "bg-white/5"}`} />
                          )}
                        </div>
                        <div className="pt-1.5 pb-2 flex-1">
                          <p className={`font-medium text-sm ${done ? "text-green-400" : active ? "text-white" : "text-zinc-600"}`}>
                            {step.label}
                          </p>
                          {active && (
                            <p className="text-zinc-400 text-xs mt-0.5">{step.desc}</p>
                          )}
                          {step.key === "shipped" && order.tracking_number && (done || active) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-zinc-500">N° suivi :</span>
                              <span className="font-mono text-xs text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">
                                {order.tracking_number}
                              </span>
                              <a
                                href={`https://www.laposte.fr/outils/suivre-vos-envois?code=${order.tracking_number}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-violet-400 hover:text-violet-300 underline transition-colors"
                              >
                                Suivre sur La Poste →
                              </a>
                            </div>
                          )}
                          {step.key === "shipped" && order.shipped_at && (done || active) && (
                            <p className="text-zinc-600 text-xs mt-1">
                              Expédié le {new Date(order.shipped_at).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
                <div className="text-4xl mb-3">❌</div>
                <p className="text-red-300 font-semibold mb-1">Commande annulée</p>
                <p className="text-zinc-600 text-sm mb-4">Une question ? Contacte-nous.</p>
                <Link
                  href="/shop"
                  className="inline-block text-sm text-violet-400 hover:text-violet-300 transition-colors underline"
                >
                  Retourner à la boutique
                </Link>
              </div>
            )}

            {/* Items */}
            {order.items?.length > 0 && (
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
                <h3 className="text-zinc-500 text-xs uppercase tracking-wider mb-4">Articles commandés</h3>
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-baseline text-sm">
                      <div>
                        <span className="text-zinc-300">{item.product_name}</span>
                        {item.variant_name && <span className="text-zinc-600 ml-1.5 text-xs">— {item.variant_name}</span>}
                        <span className="text-zinc-700 ml-2 text-xs">×{item.quantity}</span>
                      </div>
                      <span className="text-zinc-400 ml-4 shrink-0">
                        {(item.subtotal || item.price * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-sm font-semibold">
                  <span className="text-zinc-300">Total payé</span>
                  <span className="text-white">{order.total?.toFixed(2)} €</span>
                </div>
              </div>
            )}

            {/* Contact */}
            <p className="text-center text-xs text-zinc-700 pt-2">
              Une question ?{" "}
              <a href="mailto:contact@axionpad.com" className="text-violet-500 hover:text-violet-400 transition-colors">
                contact@axionpad.com
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
