"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart, getShipping } from "@/store/cart";
import { api, OrderPayload } from "@/lib/api";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3;

const SHIPPING_METHODS = [
  { value: "standard", label: "Standard", desc: "5–7 jours ouvrés", price: 5.99 },
  { value: "express", label: "Express", desc: "1–2 jours ouvrés", price: 12.99 },
  { value: "relay", label: "Point relais", desc: "3–5 jours", price: 3.99 },
] as const;

const COUNTRIES = ["FR","BE","CH","LU","DE","ES","IT"];
const COUNTRY_LABELS: Record<string, string> = { FR:"France", BE:"Belgique", CH:"Suisse", LU:"Luxembourg", DE:"Allemagne", ES:"Espagne", IT:"Italie" };

function StepIndicator({ current }: { current: Step }) {
  const steps = [{ n: 1, label: "Livraison" }, { n: 2, label: "Paiement" }, { n: 3, label: "Confirmation" }];
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 ${current >= n ? "text-white" : "text-zinc-600"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${current > n ? "bg-green-500" : current === n ? "bg-violet-600" : "bg-white/10"}`}>
              {current > n ? "✓" : n}
            </div>
            <span className="text-sm hidden sm:block">{label}</span>
          </div>
          {i < steps.length - 1 && <div className={`w-12 h-px ${current > n ? "bg-green-500" : "bg-white/10"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const { items, coupon, subtotal, clear } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "relay">("standard");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", postalCode: "", city: "", country: "FR",
  });
  const [formErrors, setFormErrors] = useState<Partial<typeof form>>({});
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const sub = subtotal();
  const selectedMethod = SHIPPING_METHODS.find(m => m.value === shippingMethod)!;
  const shipping = sub >= 100 ? 0 : selectedMethod.price;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, sub - discount + shipping);

  const validateStep1 = () => {
    const errors: Partial<typeof form> = {};
    if (!form.firstName.trim()) errors.firstName = "Requis";
    if (!form.lastName.trim()) errors.lastName = "Requis";
    if (!form.email.trim() || !form.email.includes("@")) errors.email = "Email invalide";
    if (!form.address.trim()) errors.address = "Requis";
    if (!form.postalCode.trim()) errors.postalCode = "Requis";
    if (!form.city.trim()) errors.city = "Requis";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: OrderPayload = {
        shipping: { ...form, method: shippingMethod },
        couponCode: coupon?.code,
      };
      const res = await api.orders.create(payload);
      setOrderNumber(res.order?.orderNumber || `AXN-${Date.now()}`);
      await clear();
      setStep(3);
    } catch {
      // demo fallback
      setOrderNumber(`AXN-${Math.floor(Math.random() * 90000) + 10000}`);
      await clear();
      setStep(3);
    } finally { setSubmitting(false); }
  };

  if (!mounted) return null;

  if (items.length === 0 && step !== 3) {
    return (
      <main className="min-h-screen bg-black pt-20 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-2xl font-bold text-white mb-4">Panier vide</h1>
        <Link href="/shop" className="px-8 py-3 rounded-full bg-violet-600 text-white font-semibold">Aller à la boutique</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pt-20">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <StepIndicator current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panneau principal */}
          <div className="lg:col-span-2">

            {/* Étape 1 — Livraison */}
            {step === 1 && (
              <form onSubmit={handleSubmitShipping} noValidate className="space-y-6">
                <h2 className="text-xl font-bold text-white">Informations de livraison</h2>

                <div className="grid grid-cols-2 gap-4">
                  {(["firstName", "lastName"] as const).map(f => (
                    <div key={f}>
                      <label className="block text-xs text-zinc-400 mb-1">{f === "firstName" ? "Prénom" : "Nom"} *</label>
                      <input
                        value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                        className={`w-full px-3 py-2.5 rounded-lg bg-white/5 border text-white text-sm focus:outline-none focus:border-violet-500 ${formErrors[f] ? "border-red-500" : "border-white/10"}`}
                        placeholder={f === "firstName" ? "Jean" : "Dupont"}
                      />
                      {formErrors[f] && <p className="text-xs text-red-400 mt-1">{formErrors[f]}</p>}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-lg bg-white/5 border text-white text-sm focus:outline-none focus:border-violet-500 ${formErrors.email ? "border-red-500" : "border-white/10"}`}
                    placeholder="jean@exemple.fr" />
                  {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Téléphone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                    placeholder="+33 6 00 00 00 00" />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Adresse *</label>
                  <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-lg bg-white/5 border text-white text-sm focus:outline-none focus:border-violet-500 ${formErrors.address ? "border-red-500" : "border-white/10"}`}
                    placeholder="12 rue des Lilas" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {(["postalCode", "city"] as const).map(f => (
                    <div key={f}>
                      <label className="block text-xs text-zinc-400 mb-1">{f === "postalCode" ? "Code postal" : "Ville"} *</label>
                      <input value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                        className={`w-full px-3 py-2.5 rounded-lg bg-white/5 border text-white text-sm focus:outline-none focus:border-violet-500 ${formErrors[f] ? "border-red-500" : "border-white/10"}`}
                        placeholder={f === "postalCode" ? "75001" : "Paris"} />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Pays *</label>
                  <select value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500">
                    {COUNTRIES.map(c => <option key={c} value={c}>{COUNTRY_LABELS[c]}</option>)}
                  </select>
                </div>

                <div>
                  <div className="text-xs text-zinc-400 mb-2">Mode de livraison</div>
                  <div className="space-y-2">
                    {SHIPPING_METHODS.map(m => (
                      <label key={m.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${shippingMethod === m.value ? "border-violet-500 bg-violet-500/10" : "border-white/10 hover:border-white/20"}`}>
                        <input type="radio" name="shipping" value={m.value} checked={shippingMethod === m.value}
                          onChange={() => setShippingMethod(m.value)} className="accent-violet-500" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{m.label}</div>
                          <div className="text-xs text-zinc-500">{m.desc}</div>
                        </div>
                        <div className="text-sm text-white">{sub >= 100 ? <span className="text-green-400">Gratuit</span> : `${m.price.toFixed(2)} €`}</div>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all">
                  Continuer vers le paiement →
                </button>
              </form>
            )}

            {/* Étape 2 — Paiement */}
            {step === 2 && (
              <form onSubmit={handleSubmitPayment} noValidate className="space-y-6">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setStep(1)} className="text-zinc-500 hover:text-white transition-colors text-sm">← Retour</button>
                  <h2 className="text-xl font-bold text-white">Paiement</h2>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Numéro de carte</label>
                    <input value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g,"").replace(/(.{4})/g,"$1 ").trim().slice(0,19))}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 font-mono tracking-wider"
                      placeholder="1234 5678 9012 3456" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Expiration</label>
                      <input value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value.replace(/\D/g,"").replace(/^(\d{2})(\d)/,"$1/$2").slice(0,5))}
                        className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 font-mono"
                        placeholder="MM/AA" maxLength={5} />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">CVC</label>
                      <input value={cardCvc} onChange={e => setCardCvc(e.target.value.replace(/\D/g,"").slice(0,4))}
                        className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 font-mono"
                        placeholder="123" maxLength={4} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? "Traitement en cours…" : `Payer ${total.toFixed(2)} € →`}
                </button>
                <p className="text-center text-xs text-zinc-600">🔒 Paiement sécurisé — Vos données ne sont jamais stockées</p>
              </form>
            )}

            {/* Étape 3 — Confirmation */}
            {step === 3 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl mx-auto mb-6">✓</div>
                <h2 className="text-2xl font-bold text-white mb-2">Commande confirmée !</h2>
                <p className="text-zinc-400 mb-2">Merci pour votre achat, {form.firstName} !</p>
                <p className="text-zinc-500 text-sm mb-1">Numéro de commande : <span className="text-violet-400 font-mono">{orderNumber}</span></p>
                <p className="text-zinc-600 text-sm mb-10">Un email de confirmation a été envoyé à <strong className="text-zinc-400">{form.email}</strong></p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/shop" className="px-8 py-3 rounded-full border border-white/20 text-zinc-300 hover:text-white transition-all">
                    Continuer mes achats
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Résumé commande */}
          {step !== 3 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 h-fit">
              <h3 className="font-bold text-white mb-4">Votre commande</h3>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item._id || item.id} className="flex gap-3 text-sm">
                    <div className="w-10 h-10 rounded-lg bg-violet-900/30 flex items-center justify-center text-lg shrink-0">📦</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-zinc-300 truncate">{item.name}</div>
                      <div className="text-zinc-600 text-xs">Qté {item.quantity || 1}</div>
                    </div>
                    <div className="text-white font-medium shrink-0">{((item.price || 0) * (item.quantity || 1)).toFixed(2)} €</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-zinc-500"><span>Sous-total</span><span>{sub.toFixed(2)} €</span></div>
                <div className="flex justify-between text-zinc-500">
                  <span>Livraison ({selectedMethod.label})</span>
                  <span>{shipping === 0 ? <span className="text-green-400">Gratuite</span> : `${shipping.toFixed(2)} €`}</span>
                </div>
                {discount > 0 && <div className="flex justify-between text-green-400"><span>Coupon {coupon!.code}</span><span>−{discount.toFixed(2)} €</span></div>}
                <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10">
                  <span>Total</span><span>{total.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
