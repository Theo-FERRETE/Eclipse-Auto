import './MentionsLegales.css'

export default function MentionsLegales() {
  return (
    <main className="mentions">
      <div className="mentions-hero">
        <div className="container">
          <div className="tag">Légal</div>
          <h1 className="mentions-title">Mentions légales</h1>
        </div>
      </div>

      <div className="divider"></div>

      <div className="container mentions-content">

        <div className="mentions-block">
          <h2 className="mentions-section">1. Présentation du site</h2>
          <p>Le site <strong>Eclipse Auto</strong> est un projet éducatif réalisé dans le cadre du titre professionnel <strong>Développeur Web et Web Mobile (DWWM)</strong>. Il s'agit d'une application fictive de concession automobile en ligne. Aucune transaction commerciale réelle n'est effectuée sur ce site.</p>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">2. Éditeur du site</h2>
          <div className="mentions-table">
            <div className="mentions-row">
              <span className="mentions-key">Nom</span>
              <span className="mentions-val">Théo Ferreté</span>
            </div>
            <div className="mentions-row">
              <span className="mentions-key">Statut</span>
              <span className="mentions-val">Étudiant — Titre DWWM</span>
            </div>
            <div className="mentions-row">
              <span className="mentions-key">Email</span>
              <span className="mentions-val">theo.ferrete@gmail.com</span>
            </div>
            <div className="mentions-row">
              <span className="mentions-key">Site portfolio</span>
              <span className="mentions-val">theo-ferrete.fr</span>
            </div>
          </div>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">3. Hébergement</h2>
          <div className="mentions-table">
            <div className="mentions-row">
              <span className="mentions-key">Hébergeur</span>
              <span className="mentions-val">VPS personnel</span>
            </div>
            <div className="mentions-row">
              <span className="mentions-key">Serveur web</span>
              <span className="mentions-val">Nginx</span>
            </div>
            <div className="mentions-row">
              <span className="mentions-key">Base de données</span>
              <span className="mentions-val">Supabase (PostgreSQL)</span>
            </div>
          </div>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">4. Propriété intellectuelle</h2>
          <p>Les images utilisées sur ce site proviennent de <strong>Unsplash</strong> et sont soumises à leur licence respective. Le code source du projet est disponible sur <strong>GitHub</strong> à titre éducatif.</p>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">5. Données personnelles</h2>
          <p>Les données collectées (nom, prénom, email) sont uniquement utilisées dans le cadre de la démonstration du projet. Elles sont stockées de manière sécurisée via <strong>Supabase</strong> et ne sont transmises à aucun tiers. Conformément au RGPD, vous pouvez demander la suppression de vos données à tout moment en contactant l'éditeur.</p>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">6. Cookies</h2>
          <p>Ce site utilise des cookies de session uniquement pour gérer l'authentification des utilisateurs. Aucun cookie publicitaire ou de tracking n'est utilisé.</p>
        </div>

        <div className="mentions-block">
          <h2 className="mentions-section">7. Avertissement</h2>
          <p>Eclipse Auto est un projet <strong>fictif et éducatif</strong>. Les véhicules présentés, les prix affichés et les informations de contact ne correspondent à aucune entité commerciale réelle. Aucun achat, paiement ou transaction n'est possible sur ce site.</p>
        </div>

      </div>
    </main>
  )
}