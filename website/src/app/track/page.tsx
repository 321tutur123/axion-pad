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
  const map: Record<string, { label: string; style: React.CSSProperties }> = {
    pending:   { label: "En attente",     style: { background: "rgba(212,187,140,0.2)", color: "#7d6849", borderColor: "rgba(184,118,92,0.25)" } },
    confirmed: { label: "En préparation", style: { background: "rgba(139,157,195,0.18)", color: "#4d5670", borderColor: "rgba(139,157,195,0.35)" } },
    shipped:   { label: "Expédiée",       style: { background: "rgba(184,118,92,0.15)", color: "#8b5a47", borderColor: "rgba(184,118,92,0.28)" } },
    delivered: { label: "Livrée",         style: { background: "rgba(107,146,116,0.18)", color: "#4a634f", borderColor: "rgba(107,146,116,0.3)" } },
    cancelled: { label: "Annulée",        style: { background: "rgba(200,120,120,0.15)", color: "#8b4545", borderColor: "rgba(200,120,120,0.25)" } },
  };
  const s = map[status] ?? {
    label: status,
    style: { background: "var(--color-bg-soft)", color: "var(--color-text-mute)", borderColor: "var(--color-border)" },
  };
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full border"
      style={s.style}
    >
      {s.label}
    </span>
  );
}

const panelStyle: React.CSSProperties = {
  background: "var(--color-bg-card)",
  borderColor: "var(--color-border)",
  borderWidth: 1,
  borderStyle: "solid",
  boxShadow: "0 2px 16px rgba(58,54,51,0.05)",
};

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24" style={{ background: "transparent" }} />}>
      <TrackContent />
    </Suspense>
  );
}

function TrackContent() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

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
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") {
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

  const current = order ? stepIndex(String(order.status) as OrderStatus) : -1;
  const trackingNum = order ? (typeof order.tracking_number === "string" ? order.tracking_number : "") : "";

  const inputCls =
    "w-full px-4 py-3 rounded-xl text-sm font-mono transition-colors focus:outline-none focus:ring-1";
  const inputStyle: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
  };

  return (
    <main className="min-h-screen pt-24 pb-16" style={{ background: "transparent" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">

        <div className="mb-10">
          <h1 className="text-3xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>Suivi de commande</h1>
          <p className="text-[15px]" style={{ color: "var(--color-text-mute)" }}>
            Indiquez le numéro de commande et l’e-mail utilisé lors de l’achat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-mute)" }}>
              Numéro de commande
            </label>
            <input
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="AXN-…"
              className={inputCls}
              style={{ ...inputStyle, fontFamily: "ui-monospace, monospace" }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-mute)" }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jean@exemple.fr"
              className={inputCls}
              style={{ ...inputStyle, fontFamily: "var(--font-main)" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !orderNumber.trim() || !email.trim()}
            className="w-full py-3.5 rounded-full font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed btn-accent"
          >
            {loading ? "Recherche…" : "Suivre ma commande →"}
          </button>
        </form>

        {error && (
          <div
            className="p-4 rounded-xl border text-sm mb-8"
            style={{
              borderColor: "rgba(200,100,100,0.25)",
              background: "rgba(200,100,100,0.08)",
              color: "#8b3a3a",
            }}
          >
            {error}
          </div>
        )}

        {order && (
          <div className="space-y-4">

            <div className="p-5 rounded-2xl" style={panelStyle}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-mute)" }}>Commande</p>
                  <p className="font-mono text-xl font-bold" style={{ color: "var(--color-accent)" }}>
                    {String(order.order_number ?? "")}
                  </p>
                </div>
                <StatusBadge status={String(order.status ?? "")} />
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-mute)" }}>
                Passée le{" "}
                {new Date(order.created_at as string).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
                {" · "}
                <span className="font-medium" style={{ color: "var(--color-text)" }}>
                  {typeof order.total === "number" ? order.total.toFixed(2) : ""} €
                </span>
              </p>
            </div>

            {String(order.status) !== "cancelled" ? (
              <div className="p-5 rounded-2xl" style={panelStyle}>
                <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider" style={{ color: "var(--color-text)" }}>
                  Progression
                </h3>
                <div>
                  {STEPS.map((step, i) => {
                    const done = i < current;
                    const active = i === current;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 transition-all border"
                            style={
                              done
                                ? { background: "rgba(107,146,116,0.2)", color: "#4a634f", borderColor: "rgba(107,146,116,0.35)" }
                                : active
                                  ? { background: "var(--color-accent-muted)", color: "var(--color-accent)", borderColor: "rgba(184,118,92,0.4)", boxShadow: "0 0 0 2px rgba(184,118,92,0.15)" }
                                  : { background: "var(--color-bg-soft)", color: "var(--color-text-mute)", borderColor: "var(--color-border)" }
                            }
                          >
                            {done ? "✓" : step.icon}
                          </div>
                          {i < STEPS.length - 1 && (
                            <div
                              className="w-0.5 h-8 my-1 rounded-full"
                              style={{ background: done ? "rgba(107,146,116,0.35)" : "var(--color-border)" }}
                            />
                          )}
                        </div>
                        <div className="pt-1.5 pb-2 flex-1">
                          <p
                            className="font-medium text-sm"
                            style={{
                              color: done ? "#4a634f" : active ? "var(--color-text)" : "var(--color-text-mute)",
                            }}
                          >
                            {step.label}
                          </p>
                          {active && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-mute)" }}>{step.desc}</p>
                          )}
                          {step.key === "shipped" && trackingNum && (done || active) ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs" style={{ color: "var(--color-text-mute)" }}>N° suivi :</span>
                              <span
                                className="font-mono text-xs px-2 py-0.5 rounded border"
                                style={{
                                  background: "var(--color-accent-lt)",
                                  color: "var(--color-accent)",
                                  borderColor: "rgba(184,118,92,0.25)",
                                }}
                              >
                                {trackingNum}
                              </span>
                              <a
                                href={`https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(trackingNum)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline transition-opacity hover:opacity-80"
                                style={{ color: "var(--color-accent)" }}
                              >
                                Suivre sur La Poste →
                              </a>
                            </div>
                          ) : null}
                          {step.key === "shipped" && typeof order.shipped_at === "string" && (done || active) ? (
                            <p className="text-xs mt-1" style={{ color: "var(--color-text-mute)" }}>
                              Expédié le {new Date(order.shipped_at).toLocaleDateString("fr-FR")}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                className="p-6 rounded-2xl border text-center"
                style={{
                  borderColor: "rgba(200,100,100,0.25)",
                  background: "rgba(200,100,100,0.06)",
                }}
              >
                <div className="text-4xl mb-3">❌</div>
                <p className="font-semibold mb-1" style={{ color: "#8b3a3a" }}>Commande annulée</p>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-mute)" }}>Une question ? Contactez-nous.</p>
                <Link href="/shop" className="inline-block text-sm underline" style={{ color: "var(--color-accent)" }}>
                  Retour à la boutique
                </Link>
              </div>
            )}

            {Array.isArray(order.items) && order.items.length > 0 && (
              <div className="p-5 rounded-2xl" style={panelStyle}>
                <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--color-text-mute)" }}>
                  Articles
                </h3>
                <div className="space-y-3">
                  {(order.items as Array<Record<string, unknown>>).map(item => (
                    <div key={String(item.id ?? item.product_name)} className="flex justify-between items-baseline text-sm">
                      <div>
                        <span style={{ color: "var(--color-text)" }}>{String(item.product_name ?? "")}</span>
                        {typeof item.variant_name === "string" && item.variant_name ? (
                          <span className="ml-1.5 text-xs" style={{ color: "var(--color-text-mute)" }}>
                            — {item.variant_name}
                          </span>
                        ) : null}
                        <span className="ml-2 text-xs" style={{ color: "var(--color-text-mute)" }}>×{Number(item.quantity)}</span>
                      </div>
                      <span className="ml-4 shrink-0" style={{ color: "var(--color-text-mute)" }}>
                        {Number(item.subtotal ?? (Number(item.price) * Number(item.quantity))).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-4 pt-3 flex justify-between text-sm font-semibold border-t"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  <span>Total payé</span>
                  <span>{typeof order.total === "number" ? order.total.toFixed(2) : ""} €</span>
                </div>
              </div>
            )}

            <p className="text-center text-xs pt-2" style={{ color: "var(--color-text-mute)" }}>
              Une question ?{" "}
              <a href="mailto:contact@axionpad.com" className="underline transition-opacity hover:opacity-80" style={{ color: "var(--color-accent)" }}>
                contact@axionpad.com
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
