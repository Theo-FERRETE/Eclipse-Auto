// Bascule FR / EN. Deux langues seulement : un simple couple de boutons est plus direct
// qu'un menu déroulant, et le choix est mémorisé par le détecteur i18next (localStorage).

import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <div className="lang-switch" role="group" aria-label={t('lang.switchLabel')}>
      {SUPPORTED_LANGUAGES.map((lng, i) => {
        const isCurrent = i18n.resolvedLanguage === lng
        return (
          <span key={lng}>
            {i > 0 && <span className="lang-switch-sep" aria-hidden="true">/</span>}
            <button
              type="button"
              className={`lang-switch-btn${isCurrent ? ' active' : ''}`}
              onClick={() => i18n.changeLanguage(lng)}
              // La langue courante reste cliquable mais n'est plus une action utile :
              // aria-current l'annonce au lieu de la désactiver, ce qui la sortirait
              // de la navigation au clavier.
              aria-current={isCurrent ? 'true' : undefined}
              // « FR » seul ne dit rien à un lecteur d'écran : l'aria-label donne le
              // nom complet, dans la langue concernée.
              aria-label={t(`lang.${lng}Full`)}
              lang={lng}
            >
              {t(`lang.${lng}`)}
            </button>
          </span>
        )
      })}
    </div>
  )
}
