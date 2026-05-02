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
          className="text-xl leading-none select-none transition-colors"
          style={{
            color: n <= (hovered || rating) ? "#facc15" : "rgba(255,255,255,0.18)",
            cursor: interactive ? "pointer" : "default",
          }}
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
    <section
      id="reviews"
      className="mt-16 pt-10"
      style={{ borderTop: "0.5px solid var(--color-border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Avis clients
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <Stars rating={Math.round(avg)} />
              <span className="text-sm" style={{ color: "var(--color-text-mute)" }}>
                {avg.toFixed(1)}&nbsp;/ 5 &nbsp;·&nbsp; {reviews.length} avis
              </span>
            </div>
          )}
        </div>
        {!submitted && !formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="shrink-0 px-4 py-2 rounded-full text-sm transition-colors"
            style={{
              border: "0.5px solid rgba(232, 98, 42, 0.35)",
              color: "var(--color-accent)",
              background: "transparent",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-accent-lt)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            + Laisser un avis
          </button>
        )}
        {submitted && (
          <span className="text-sm shrink-0" style={{ color: "#4ade80" }}>
            ✓ Avis publié — merci !
          </span>
        )}
      </div>

      {/* Formulaire */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-5 rounded-2xl space-y-4"
          style={{
            border: "0.5px solid var(--color-border)",
            background: "var(--color-bg-card)",
            backdropFilter: "blur(12px)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Votre avis
          </p>

          <div>
            <p className="text-xs mb-1.5" style={{ color: "var(--color-text-mute)" }}>Note *</p>
            <Stars rating={rating} interactive onChange={setRating} />
          </div>

          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-text-mute)" }}>
              Prénom / Pseudo *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              placeholder="Jean D."
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>

          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--color-text-mute)" }}>
              Commentaire
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Partagez votre expérience…"
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>

          {formError && (
            <p className="text-xs" style={{ color: "#f87171" }}>{formError}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-full text-white text-sm font-medium transition-colors"
              style={{
                background: "var(--color-accent)",
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = "var(--color-accent-hover)"; }}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--color-accent)")}
            >
              {submitting ? "Envoi…" : "Publier"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-5 py-2 rounded-full text-sm transition-colors"
              style={{
                border: "0.5px solid var(--color-border)",
                color: "var(--color-text-mute)",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-mute)")}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
          />
        </div>
      ) : reviews.length === 0 ? (
        <p
          className="text-sm py-10 text-center"
          style={{ color: "var(--color-text-mute)" }}
        >
          Aucun avis pour l'instant — soyez le premier !
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div
              key={review.id}
              className="p-4 rounded-xl"
              style={{
                border: "0.5px solid var(--color-border)",
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <div className="flex items-start justify-between mb-2 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text)" }}
                    >
                      {review.customer_name}
                    </span>
                    {review.verified === 1 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(74, 222, 128, 0.15)",
                          color: "#4ade80",
                          border: "0.5px solid rgba(74, 222, 128, 0.25)",
                        }}
                      >
                        Achat vérifié
                      </span>
                    )}
                  </div>
                  <Stars rating={review.rating} />
                </div>
                <time
                  className="text-xs shrink-0"
                  style={{ color: "var(--color-text-mute)" }}
                >
                  {new Date(review.created_at * 1000).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </time>
              </div>
              {review.comment && (
                <p
                  className="text-sm leading-relaxed mt-2"
                  style={{ color: "var(--color-text-mute)" }}
                >
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
