// Configuration i18next. Deux langues, ressources embarquées dans le bundle : le site
// public tient en ~400 chaînes, un chargement HTTP séparé coûterait plus qu'il ne
// rapporte. Le back-office admin reste en français et n'utilise pas ces clés.

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

export const SUPPORTED_LANGUAGES = ['fr', 'en']

// Clé du choix mémorisé. Les tests la pré-remplissent pour figer la langue (voir
// __tests__/setup.js), sinon la détection navigateur rendrait leurs assertions instables.
export const LANG_STORAGE_KEY = 'eclipse-lang'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: 'fr',
    // Sans ça, un navigateur en 'fr-FR' ou 'en-US' ne trouverait pas sa langue et
    // retomberait sur le fallback.
    load: 'languageOnly',
    detection: {
      // Le choix explicite de l'utilisateur prime sur la langue du navigateur.
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      // React échappe déjà tout ce qu'il rend : un second échappement afficherait
      // des &#39; à l'écran.
      escapeValue: false,
    },
  })

// L'attribut lang du <html> sert aux lecteurs d'écran, à la césure et à la traduction
// automatique ; la meta description est lue par les moteurs de recherche. Ni l'un ni
// l'autre n'est géré par React, qui ne rend que #root.
function syncDocument() {
  document.documentElement.lang = i18n.resolvedLanguage
  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.setAttribute('content', i18n.t('meta.description'))
}

i18n.on('languageChanged', syncDocument)
syncDocument()

export default i18n
