// Les helpers de lib/utils lisent la langue courante dans le singleton i18next plutôt
// que de la recevoir en argument : ces tests vérifient qu'ils la suivent réellement.

import { describe, it, expect, afterEach } from 'vitest'
import i18n from '@/lib/i18n'
import { formatPrice, formatNumber, translateFuel, translateTransmission, translatePaymentMethod } from '@/lib/utils'

afterEach(async () => {
  await i18n.changeLanguage('fr')
})

describe('formatPrice', () => {
  it('utilise le séparateur de milliers de la langue courante', async () => {
    // fr-FR sépare par une espace insécable, en-GB par une virgule.
    expect(formatPrice(25000)).not.toContain(',')

    await i18n.changeLanguage('en')
    expect(formatPrice(25000)).toBe('€ 25,000')
  })

  it('traduit « prix sur demande »', async () => {
    expect(formatPrice(null)).toBe('Prix sur demande')

    await i18n.changeLanguage('en')
    expect(formatPrice(null)).toBe('Price on request')
  })
})

describe('formatNumber', () => {
  it('suit la langue courante', async () => {
    await i18n.changeLanguage('en')
    expect(formatNumber(1500)).toBe('1,500')
  })
})

describe('traduction des valeurs stockées en base', () => {
  it('traduit carburant et transmission sans toucher à la valeur', async () => {
    expect(translateFuel('Essence')).toBe('Essence')
    expect(translateTransmission('Automatique')).toBe('Automatique')

    await i18n.changeLanguage('en')
    expect(translateFuel('Essence')).toBe('Petrol')
    expect(translateFuel('Électrique')).toBe('Electric')
    expect(translateTransmission('Automatique')).toBe('Automatic')
  })

  it('affiche telle quelle une valeur inconnue du dictionnaire', async () => {
    await i18n.changeLanguage('en')
    // Une valeur saisie en base hors des listes connues ne doit pas disparaître.
    expect(translateFuel('GPL')).toBe('Gpl')
  })

  it('traduit le mode de paiement', async () => {
    expect(translatePaymentMethod('carte')).toBe('Carte bancaire')

    await i18n.changeLanguage('en')
    expect(translatePaymentMethod('carte')).toBe('Credit card')
  })
})
