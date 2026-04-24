"use client";

import { useEffect, useState, useCallback } from "react";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface ShippingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  postal_code?: string;
  state?: string;
  country?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  customer_email: string;
  customer_name: string;
  amount_total: number;
  currency: string;
  shipping_name: string;
  shipping_address: string; // JSON string
  items: string;            // JSON string
  tracking_number: string;
  created_at: number;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function safeJSON<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const SESSION_KEY = "axionpad_admin_key";

/* ── Status badge ───────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    confirmed: { cls: "bg-blue-500/15 text-blue-400 border-blue-500/20",   label: "Confirmée" },
    shipped:   { cls: "bg-green-500/15 text-green-400 border-green-500/20", label: "Expédiée"  },
    cancelled: { cls: "bg-red-500/15 text-red-400 border-red-500/20",       label: "Annulée"   },
    pending:   { cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",    label: "En attente" },
  };
  const { cls, label } = map[status] ?? { cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20", label: status };
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

/* ── Packing slip printer ───────────────────────────────────────────────── */

function printPackingSlip(order: Order) {
  const address = safeJSON<ShippingAddress>(order.shipping_address, {});
  const items   = safeJSON<OrderItem[]>(order.items, []);
  const date    = fmtDate(order.created_at);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bon de préparation — ${order.order_number}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:48px;color:#111;background:#fff;font-size:14px}
  .logo{font-size:30px;font-weight:800;letter-spacing:-1.5px}
  .sub{font-size:12px;color:#71717a;margin-top:2px}
  hr{border:none;border-top:1px solid #e4e4e7;margin:24px 0}
  .row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
  .order-num{font-size:13px;color:#52525b}
  .date{font-size:13px;color:#52525b}
  .ship-box{border:2.5px solid #111;border-radius:10px;padding:24px 28px;max-width:340px;margin:28px 0}
  .ship-label{font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#71717a;margin-bottom:14px}
  .ship-name{font-size:22px;font-weight:700;margin-bottom:6px}
  .ship-line{font-size:15px;line-height:1.7;color:#27272a}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{text-align:left;padding:8px 0;border-bottom:1px solid #e4e4e7;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:600}
  th.r,td.r{text-align:right}
  td{padding:11px 0;border-bottom:1px solid #f4f4f5;font-size:14px}
  .total td{font-weight:700;font-size:15px;border-bottom:none;border-top:2px solid #111;padding-top:14px}
  .track{margin-top:28px;font-size:12px;color:#52525b;padding:10px 14px;border:1px dashed #d4d4d8;border-radius:6px;display:inline-block}
  .footer{margin-top:48px;font-size:11px;color:#a1a1aa;text-align:center}
  @media print{body{padding:32px}@page{margin:16mm}}
</style>
</head>
<body>
  <div class="logo">AxionPad</div>
  <div class="sub">axionpad.com — bonjour@axionpad.com</div>
  <hr>
  <div class="row">
    <span class="order-num">Commande <strong>${order.order_number}</strong></span>
    <span class="date">${date}</span>
  </div>

  <div class="ship-box">
    <div class="ship-label">Destinataire</div>
    <div class="ship-name">${escHtml(order.shipping_name || order.customer_name)}</div>
    ${address.line1 ? `<div class="ship-line">${escHtml(address.line1)}</div>` : ""}
    ${address.line2 ? `<div class="ship-line">${escHtml(address.line2)}</div>` : ""}
    <div class="ship-line">${escHtml([address.postal_code, address.city].filter(Boolean).join(" "))}</div>
    ${address.state ? `<div class="ship-line">${escHtml(address.state)}</div>` : ""}
    <div class="ship-line">${escHtml(address.country ?? "")}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:50%">Article</th>
        <th class="r" style="width:10%">Qté</th>
        <th class="r" style="width:18%">Prix unit.</th>
        <th class="r" style="width:22%">Sous-total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(i => `
      <tr>
        <td>${escHtml(i.name)}</td>
        <td class="r">${i.quantity}</td>
        <td class="r">${i.unit_price.toFixed(2)} €</td>
        <td class="r">${i.subtotal.toFixed(2)} €</td>
      </tr>`).join("")}
      <tr class="total">
        <td colspan="3">Total payé</td>
        <td class="r">${(order.amount_total / 100).toFixed(2)} ${order.currency.toUpperCase()}</td>
      </tr>
    </tbody>
  </table>

  ${order.tracking_number ? `<div class="track">N° de suivi : <strong>${escHtml(order.tracking_number)}</strong></div>` : ""}

  <p class="footer">Merci pour votre commande AxionPad ! Pour toute question : bonjour@axionpad.com</p>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function escHtml(str: string | undefined): string {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Order detail modal ─────────────────────────────────────────────────── */

interface ModalProps {
  order: Order;
  adminKey: string;
  onUpdate: (id: string, patch: Partial<Order>) => void;
  onClose: () => void;
}

function OrderModal({ order, adminKey, onUpdate, onClose }: ModalProps) {
  const address = safeJSON<ShippingAddress>(order.shipping_address, {});
  const items   = safeJSON<OrderItem[]>(order.items, []);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [saving, setSaving]     = useState(false);
  const isShipped = order.status === "shipped";

  const markShipped = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ status: "shipped", tracking_number: tracking }),
      });
      onUpdate(order.id, { status: "shipped", tracking_number: tracking });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[11px] font-mono text-zinc-500 mb-1">{order.order_number}</p>
            <h2 className="text-white font-bold text-lg leading-tight">
              {order.customer_name || order.customer_email}
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">{fmtDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl leading-none w-7 h-7 flex items-center justify-center">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">

          {/* Shipping address */}
          <section>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3">Adresse de livraison</p>
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
              <p className="text-white font-semibold text-base leading-tight">{order.shipping_name || order.customer_name}</p>
              {address.line1     && <p className="text-zinc-300 text-sm mt-1">{address.line1}</p>}
              {address.line2     && <p className="text-zinc-400 text-sm">{address.line2}</p>}
              <p className="text-zinc-300 text-sm">
                {[address.postal_code, address.city].filter(Boolean).join(" ")}
              </p>
              {address.state     && <p className="text-zinc-400 text-sm">{address.state}</p>}
              {address.country   && <p className="text-zinc-500 text-sm">{address.country}</p>}
            </div>
          </section>

          {/* Items */}
          <section>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3">Articles commandés</p>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] text-zinc-600 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Article</th>
                    <th className="text-center px-4 py-3 font-medium w-12">Qté</th>
                    <th className="text-right px-4 py-3 font-medium">P.U.</th>
                    <th className="text-right px-4 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 text-white">{item.name}</td>
                      <td className="px-4 py-3 text-zinc-400 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-zinc-400 text-right">{item.unit_price.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-white text-right font-medium">{item.subtotal.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10">
                    <td colSpan={3} className="px-4 py-3 text-zinc-400 text-sm font-semibold">Total payé</td>
                    <td className="px-4 py-3 text-right text-white font-bold">
                      {(order.amount_total / 100).toFixed(2)} {order.currency.toUpperCase()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Contact */}
          <section className="text-sm text-zinc-400">
            <span className="text-zinc-600">Email : </span>{order.customer_email}
          </section>

          {/* Mark as shipped */}
          {!isShipped && (
            <section>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3">Marquer comme expédiée</p>
              <div className="flex gap-2">
                <input
                  value={tracking}
                  onChange={e => setTracking(e.target.value)}
                  placeholder="N° de suivi (optionnel)"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500 placeholder-zinc-600"
                />
                <button
                  onClick={markShipped}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {saving ? "…" : "Expédiée ✓"}
                </button>
              </div>
            </section>
          )}

          {isShipped && order.tracking_number && (
            <section className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <span>✓</span>
              <span>Suivi : <strong>{order.tracking_number}</strong></span>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={() => printPackingSlip(order)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-zinc-300 hover:text-white hover:border-white/30 text-sm transition-colors"
          >
            <span>🖨</span> Imprimer le bon de préparation
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */

export default function AdminOrdersPage() {
  const [adminKey,   setAdminKey]   = useState<string | null>(null);
  const [keyInput,   setKeyInput]   = useState("");
  const [authError,  setAuthError]  = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selected,     setSelected]     = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search,       setSearch]       = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setAdminKey(stored);
  }, []);

  const fetchOrders = useCallback(async (key: string) => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/admin/orders", { headers: { "x-admin-key": key } });
      if (res.status === 401) { sessionStorage.removeItem(SESSION_KEY); setAdminKey(null); return; }
      const data = await res.json() as { orders?: Order[] };
      setOrders(data.orders ?? []);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (adminKey) fetchOrders(adminKey);
  }, [adminKey, fetchOrders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch("/api/admin/orders", { headers: { "x-admin-key": keyInput.trim() } });
      if (res.status === 401) { setAuthError("Mot de passe incorrect."); return; }
      sessionStorage.setItem(SESSION_KEY, keyInput.trim());
      setAdminKey(keyInput.trim());
    } catch {
      setAuthError("Erreur réseau.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOrderUpdate = (id: string, patch: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
    setSelected(prev => prev?.id === id ? { ...prev, ...patch } : prev);
  };

  /* ── Login screen ─────────────────────────────────────────────────────── */
  if (!adminKey) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div className="mb-6">
            <p className="text-2xl font-bold text-white">AxionPad</p>
            <p className="text-zinc-500 text-sm mt-1">Espace administration</p>
          </div>
          <input
            type="password"
            value={keyInput}
            onChange={e => { setKeyInput(e.target.value); setAuthError(""); }}
            placeholder="Mot de passe admin"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 placeholder-zinc-600"
          />
          {authError && <p className="text-sm text-red-400">{authError}</p>}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors disabled:opacity-60"
          >
            {authLoading ? "Connexion…" : "Accéder"}
          </button>
        </form>
      </main>
    );
  }

  /* ── Filtered list ────────────────────────────────────────────────────── */
  const filtered = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totals = {
    all:       orders.length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    shipped:   orders.filter(o => o.status === "shipped").length,
  };

  /* ── Orders table ─────────────────────────────────────────────────────── */
  return (
    <>
      <main className="min-h-screen bg-zinc-950 px-6 py-8">
        <div className="max-w-6xl mx-auto">

          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Commandes</h1>
              <p className="text-zinc-500 text-sm mt-0.5">{orders.length} au total</p>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAdminKey(null); setOrders([]); }}
              className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              Déconnexion
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
              {(["all", "confirmed", "shipped"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-violet-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {s === "all" ? `Tout (${totals.all})` : s === "confirmed" ? `Confirmées (${totals.confirmed})` : `Expédiées (${totals.shipped})`}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher nom, email, n° commande…"
              className="flex-1 min-w-48 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 placeholder-zinc-600"
            />
            <button
              onClick={() => adminKey && fetchOrders(adminKey)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white text-sm transition-colors"
              title="Rafraîchir"
            >
              ↻
            </button>
          </div>

          {/* Table */}
          {loadingOrders ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-zinc-600 text-center py-24 text-sm">Aucune commande trouvée.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] text-zinc-500 uppercase tracking-wider">
                    <th className="text-left px-5 py-3.5 font-medium">Date</th>
                    <th className="text-left px-5 py-3.5 font-medium">Commande</th>
                    <th className="text-left px-5 py-3.5 font-medium">Client</th>
                    <th className="text-left px-5 py-3.5 font-medium hidden md:table-cell">Email</th>
                    <th className="text-right px-5 py-3.5 font-medium">Montant</th>
                    <th className="text-left px-5 py-3.5 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelected(order)}
                      className={`cursor-pointer transition-colors hover:bg-white/[0.04] ${i !== 0 ? "border-t border-white/5" : ""}`}
                    >
                      <td className="px-5 py-4 text-zinc-500 whitespace-nowrap text-xs">{fmtDate(order.created_at)}</td>
                      <td className="px-5 py-4 text-zinc-300 font-mono text-xs">{order.order_number}</td>
                      <td className="px-5 py-4 text-white font-medium">{order.customer_name || "—"}</td>
                      <td className="px-5 py-4 text-zinc-500 hidden md:table-cell">{order.customer_email}</td>
                      <td className="px-5 py-4 text-right text-white font-semibold whitespace-nowrap">
                        {(order.amount_total / 100).toFixed(2)} €
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selected && adminKey && (
        <OrderModal
          order={selected}
          adminKey={adminKey}
          onUpdate={handleOrderUpdate}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
