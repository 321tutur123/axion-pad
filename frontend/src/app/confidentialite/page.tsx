import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité — Axion Pad",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-white font-semibold text-lg mb-4 pb-3 border-b border-white/10">{title}</h2>
      <div className="text-zinc-400 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-black pt-20">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <nav className="flex items-center gap-2 text-sm text-zinc-600 mb-10">
          <Link href="/" className="hover:text-zinc-400 transition-colors">Accueil</Link>
          <span>›</span>
          <span className="text-zinc-300">Politique de confidentialité</span>
        </nav>

        <h1 className="text-3xl font-bold text-white mb-2">Politique de confidentialité</h1>
        <p className="text-zinc-500 text-sm mb-12">
          Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679)
          et à la loi Informatique et Libertés.
        </p>

        <Section title="1. Responsable du traitement">
          <p>
            <strong className="text-zinc-200">Arthur Delacour — Axion Pad</strong><br />
            Email :{" "}
            <a href="mailto:contact@axionpad.com" className="text-violet-400 hover:text-violet-300">
              contact@axionpad.com
            </a><br />
            Adresse : <span className="text-zinc-500">[À COMPLÉTER]</span>
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>Lors d'une commande, nous collectons :</p>
          <ul className="list-none space-y-1 ml-2">
            {[
              "Nom et prénom",
              "Adresse email",
              "Adresse postale de livraison",
              "Numéro de téléphone (optionnel)",
              "Informations de paiement (traitées exclusivement par Stripe — non stockées sur nos serveurs)",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5 shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p>
            Lors de la navigation, nous pouvons collecter des données techniques (adresse IP,
            navigateur, pages visitées) à des fins de statistiques anonymes de fréquentation.
          </p>
        </Section>

        <Section title="3. Finalités du traitement">
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-zinc-400 font-medium">Finalité</th>
                  <th className="text-left p-3 text-zinc-400 font-medium">Base légale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Traitement et expédition des commandes", "Exécution du contrat"],
                  ["Envoi de l'email de confirmation", "Exécution du contrat"],
                  ["Gestion du service client", "Intérêt légitime"],
                  ["Prévention de la fraude", "Intérêt légitime"],
                  ["Statistiques de navigation anonymes", "Intérêt légitime"],
                  ["Envoi d'emails marketing (opt-in)", "Consentement"],
                ].map(([fin, base], i) => (
                  <tr key={fin} className={`border-b border-white/5 ${i % 2 === 1 ? "bg-white/[0.01]" : ""}`}>
                    <td className="p-3 text-zinc-300">{fin}</td>
                    <td className="p-3 text-zinc-500">{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="4. Durée de conservation">
          <ul className="list-none space-y-1 ml-2">
            {[
              "Données de commande : 10 ans (obligation comptable et légale)",
              "Données de compte client : jusqu'à la suppression du compte + 3 ans",
              "Données de contact (email) : 3 ans à compter du dernier contact",
              "Cookies techniques : session uniquement (supprimés à la fermeture du navigateur)",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5 shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="5. Destinataires des données">
          <p>Vos données sont transmises aux sous-traitants suivants :</p>
          <ul className="list-none space-y-2 ml-2">
            {[
              { name: "Stripe Inc.", role: "Traitement des paiements", country: "USA (clauses contractuelles types UE)" },
              { name: "Vercel Inc.", role: "Hébergement du site", country: "USA (clauses contractuelles types UE)" },
              { name: "La Poste / transporteurs", role: "Livraison des commandes", country: "France" },
            ].map(d => (
              <li key={d.name} className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5 shrink-0">·</span>
                <span>
                  <strong className="text-zinc-300">{d.name}</strong>{" "}
                  <span className="text-zinc-500">— {d.role} ({d.country})</span>
                </span>
              </li>
            ))}
          </ul>
          <p>Vos données ne sont jamais vendues à des tiers.</p>
        </Section>

        <Section title="6. Vos droits (RGPD)">
          <p>Vous disposez des droits suivants sur vos données :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { right: "Accès", desc: "Obtenir une copie de vos données" },
              { right: "Rectification", desc: "Corriger des données inexactes" },
              { right: "Effacement", desc: "Demander la suppression de vos données" },
              { right: "Portabilité", desc: "Recevoir vos données dans un format structuré" },
              { right: "Opposition", desc: "S'opposer au traitement pour motif légitime" },
              { right: "Limitation", desc: "Limiter l'utilisation de vos données" },
            ].map(r => (
              <div key={r.right} className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="text-zinc-200 font-medium text-xs mb-1">{r.right}</div>
                <div className="text-zinc-500 text-xs">{r.desc}</div>
              </div>
            ))}
          </div>
          <p>
            Pour exercer ces droits, contactez-nous :{" "}
            <a href="mailto:contact@axionpad.com" className="text-violet-400 hover:text-violet-300">
              contact@axionpad.com
            </a>.
            Nous répondrons dans un délai maximum de 30 jours.
          </p>
          <p>
            Vous avez également le droit de déposer une réclamation auprès de la{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300"
            >
              CNIL
            </a>.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            Ce site utilise uniquement des cookies techniques strictement nécessaires au fonctionnement :
          </p>
          <ul className="list-none space-y-1 ml-2">
            {[
              "Cookie de session (authentification)",
              "Cookie de panier (état du panier d'achat)",
            ].map(c => (
              <li key={c} className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5 shrink-0">·</span>
                {c}
              </li>
            ))}
          </ul>
          <p>
            Ces cookies ne nécessitent pas de consentement car ils sont essentiels au fonctionnement
            du service. Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
            protéger vos données : connexions HTTPS/TLS, mots de passe hachés (bcrypt),
            accès aux données restreint au personnel autorisé.
          </p>
        </Section>

        <p className="text-xs text-zinc-700 pt-8 border-t border-white/5">
          Dernière mise à jour : avril 2026
        </p>

      </div>
    </main>
  );
}
