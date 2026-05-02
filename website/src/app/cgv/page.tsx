import Link from "next/link";

export const metadata = {
  title: "Conditions Générales de Vente — Axion Pad",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-white font-semibold text-lg mb-4 pb-3 border-b border-white/10">{title}</h2>
      <div className="text-zinc-400 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function CgvPage() {
  return (
    <main className="min-h-screen bg-black pt-20">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <nav className="flex items-center gap-2 text-sm text-zinc-600 mb-10">
          <Link href="/" className="hover:text-zinc-400 transition-colors">Accueil</Link>
          <span>›</span>
          <span className="text-zinc-300">CGV</span>
        </nav>

        <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales de Vente</h1>
        <p className="text-zinc-500 text-sm mb-12">
          Les présentes CGV régissent les ventes réalisées sur axionpad.com entre Axion Pad
          (vendeur) et tout acheteur (client).
        </p>

        <Section title="1. Objet">
          <p>
            Les présentes Conditions Générales de Vente s'appliquent à toutes les ventes de produits
            effectuées par Axion Pad via le site internet axionpad.com.
          </p>
          <p>
            Toute commande implique l'acceptation pleine et entière des présentes CGV.
            Ces conditions prévalent sur tout autre document.
          </p>
        </Section>

        <Section title="2. Produits">
          <p>
            Les produits proposés à la vente sont décrits avec la plus grande exactitude possible.
            Les photographies sont non contractuelles. En cas d'erreur ou d'omission, la responsabilité
            d'Axion Pad ne saurait être engagée.
          </p>
          <p>
            Les boîtiers imprimés en 3D sont fabriqués à la commande. Les délais de fabrication
            s'ajoutent aux délais de livraison.
          </p>
        </Section>

        <Section title="3. Prix">
          <p>
            Les prix sont exprimés en euros TTC. Axion Pad se réserve le droit de modifier ses prix
            à tout moment, sans préavis, mais les produits seront facturés sur la base des tarifs
            en vigueur au moment de la validation de la commande.
          </p>
          <p>
            Les frais de livraison sont indiqués au moment du paiement et varient selon le mode
            de livraison choisi. La livraison est offerte pour toute commande supérieure ou égale à 100 €.
          </p>
        </Section>

        <Section title="4. Commande">
          <p>
            La commande est considérée comme définitive après confirmation du paiement.
            Un email de confirmation est envoyé à l'adresse fournie lors de la commande.
          </p>
          <p>
            Axion Pad se réserve le droit d'annuler toute commande en cas d'indisponibilité du
            produit, d'anomalie sur la commande ou de suspicion de fraude. Le client sera remboursé
            intégralement dans ce cas.
          </p>
        </Section>

        <Section title="5. Paiement">
          <p>
            Le paiement s'effectue en ligne par carte bancaire (Visa, Mastercard, CB) via notre
            prestataire de paiement sécurisé Stripe. Les données bancaires ne transitent pas par
            nos serveurs.
          </p>
          <p>
            En cas d'échec du paiement, la commande est automatiquement annulée.
          </p>
        </Section>

        <Section title="6. Livraison">
          <p>
            Les commandes sont expédiées vers la France métropolitaine, la Belgique, la Suisse,
            le Luxembourg et les principaux pays d'Europe de l'Ouest.
          </p>
          <p>
            Les délais indicatifs sont :<br />
            — Standard (La Poste) : 5 à 7 jours ouvrés après expédition<br />
            — Express (Chronopost) : 1 à 2 jours ouvrés après expédition<br />
            — Point relais (Mondial Relay) : 3 à 5 jours ouvrés
          </p>
          <p>
            Les délais de livraison incluent un délai de fabrication de 3 à 5 jours ouvrés pour les
            produits fabriqués à la commande (boîtiers imprimés en 3D, kits DIY).
          </p>
          <p>
            En cas de retard de livraison dû à un transporteur, Axion Pad ne peut être tenu responsable.
          </p>
        </Section>

        <Section title="7. Droit de rétractation">
          <p>
            Conformément à l'article L221-18 du Code de la consommation, le client dispose d'un délai
            de <strong className="text-zinc-200">14 jours calendaires</strong> à compter de la réception
            de sa commande pour exercer son droit de rétractation, sans avoir à justifier de motif.
          </p>
          <p>
            <strong className="text-zinc-200">Exception :</strong> le droit de rétractation ne s'applique
            pas aux produits clairement personnalisés ou fabriqués sur mesure (couleur ou matériau de boîtier
            personnalisé hors catalogue standard), conformément à l'article L221-28 du Code de la consommation.
          </p>
          <p>
            Pour exercer ce droit, le client doit notifier sa décision par email à{" "}
            <a href="mailto:contact@axionpad.com" className="text-violet-400 hover:text-violet-300">
              contact@axionpad.com
            </a>{" "}
            avant l'expiration du délai.
          </p>
        </Section>

        <Section title="8. Retours et remboursements">
          <p>
            Les produits retournés doivent être dans leur état d'origine, complets et dans leur emballage
            d'origine. Les frais de retour sont à la charge du client, sauf en cas de produit défectueux
            ou d'erreur de notre part.
          </p>
          <p>
            Le remboursement est effectué dans un délai de 14 jours suivant la réception du retour,
            par le même moyen de paiement que celui utilisé lors de la commande.
          </p>
        </Section>

        <Section title="9. Garantie légale">
          <p>
            Conformément aux articles L217-4 et suivants du Code de la consommation, les produits
            bénéficient de la garantie légale de conformité de{" "}
            <strong className="text-zinc-200">2 ans</strong> à compter de la livraison.
          </p>
          <p>
            En cas de défaut de conformité, le client peut choisir entre la réparation ou le
            remplacement du produit, sous réserve des conditions de coût prévues par l'article L217-9.
          </p>
        </Section>

        <Section title="10. Service client">
          <p>
            Pour toute question ou réclamation :{" "}
            <a href="mailto:contact@axionpad.com" className="text-violet-400 hover:text-violet-300">
              contact@axionpad.com
            </a>
          </p>
        </Section>

        <Section title="11. Droit applicable et litiges">
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige, et à défaut de
            résolution amiable, les tribunaux français compétents seront saisis.
          </p>
          <p>
            Le client peut également recourir à la médiation en ligne via la plateforme européenne
            de règlement des litiges :{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300"
            >
              ec.europa.eu/consumers/odr
            </a>.
          </p>
        </Section>

        <p className="text-xs text-zinc-700 pt-8 border-t border-white/5">
          Dernière mise à jour : avril 2026
        </p>

      </div>
    </main>
  );
}
