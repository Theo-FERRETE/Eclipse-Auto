import '@testing-library/jest-dom'

// Fige la langue des tests en français. Sans ça, le détecteur i18next lirait
// navigator.language — 'en-US' sous jsdom — et les assertions sur les textes français
// casseraient pour une raison sans rapport avec ce qu'elles vérifient.
//
// La clé est écrite en dur plutôt qu'importée de lib/i18n : importer ce module en tête
// de fichier l'initialiserait avant que la valeur soit posée. Elle doit rester alignée
// sur LANG_STORAGE_KEY (client/src/lib/i18n.js).
localStorage.setItem('eclipse-lang', 'fr')

// Import dynamique, donc après le setItem ci-dessus. Les composants testés n'importent
// pas tous lib/i18n : sans ce chargement, useTranslation afficherait les clés brutes.
await import('@/lib/i18n')
