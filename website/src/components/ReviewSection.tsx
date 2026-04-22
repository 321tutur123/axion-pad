"use client";

import { useEffect, useState } from "react";

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  verified: number;
  created_at: number;
}

function Stars({
  rating,
  interactive = false,
  onChange,
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          role={interactive ? "button" : undefined}
          onClick={() => interactive && onChange?.(n)}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`text-xl leading-none select-none transition-colors ${
            n <= (hovered || rating) ? "text-yellow-400" : "text-zinc-700"
          } ${interactive ? "cursor-pointer" : "cursor-default"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewSection({ productSlug }: { productSlug: string }) {
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [formOpen,   setFormOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const [name,      setName]      = useState("");
  const [rating,    setRating]    = useState(0);
  const [comment,   setComment]   = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch(`/api/reviews?productId=${productSlug}`)
      .then(r => r.json())
      .then((d: { reviews?: Review[] }) => setReviews(d.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productSlug]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim())  { setFormError("Votre nom est requis."); return; }
    if (rating === 0)  { setFormError("Veuillez choisir une note."); return; }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productSlug, customerName: name, rating, comment }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      setFormOpen(false);
      setReviews(prev => [{
        id: crypto.randomUUID(),
        product_id: productSlug,
        customer_name: name,
        rating,
        comment,
        verified: 0,
        created_at: Math.floor(Date.now() / 1000),
      }, ...prev]);
    } catch {
      setFormError("Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="mt-16 pt-10 border-t border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Avis clients</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <Stars rating={Math.round(avg)} />
              <span className="text-zinc-400 text-sm">
                {avg.toFixed(1)}&nbsp;/ 5 &nbsp;·&nbsp; {reviews.length} avis
              </span>
            </div>
          )}
        </div>
        {!submitted && !formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="shrink-0 px-4 py-2 rounded-full border border-violet-500/40 text-violet-300 text-sm hover:bg-violet-500/10 transition-colors"
          >
            + Laisser un avis
          </button>
        )}
        {submitted && (
          <span className="text-green-400 text-sm shrink-0">✓ Avis publié — merci !</span>
        )}
      </div>

      {/* Review form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4"
        >
          <p className="text-white font-semibold text-sm">Votre avis</p>

          <div>
            <p className="text-xs text-zinc-400 mb-1.5">Note *</p>
            <Stars rating={rating} interactive onChange={setRating} />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Prénom / Pseudo *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              placeholder="Jean D."
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Commentaire</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Partagez votre expérience…"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {formError && <p className="text-xs text-red-400">{formError}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {submitting ? "Envoi…" : "Publier"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-5 py-2 rounded-full border border-white/10 text-zinc-400 text-sm hover:text-white transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-zinc-600 text-sm py-10 text-center">
          Aucun avis pour l'instant — soyez le premier !
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
              <div className="flex items-start justify-between mb-2 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-medium">{review.customer_name}</span>
                    {review.verified === 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">
                        Achat vérifié
                      </span>
                    )}
                  </div>
                  <Stars rating={review.rating} />
                </div>
                <time className="text-xs text-zinc-600 shrink-0">
                  {new Date(review.created_at * 1000).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </time>
              </div>
              {review.comment && (
                <p className="text-zinc-300 text-sm leading-relaxed mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
