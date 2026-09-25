// Filet contre la dérive entre les deux fichiers de traduction : une clé ajoutée d'un
// côté et oubliée de l'autre s'afficherait en production sous sa forme brute
// ('home.heroTag'), sans rien casser au build ni au lint.

import { describe, it, expect } from 'vitest'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

// Aplatit { a: { b: 'x' } } en ['a.b'].
function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'object' && value !== null ? flatten(value, path) : [path]
  })
}

const frKeys = flatten(fr)
const enKeys = flatten(en)

describe('fichiers de traduction', () => {
  it('expose exactement les mêmes clés en français et en anglais', () => {
    expect(enKeys.filter(k => !frKeys.includes(k))).toEqual([])
    expect(frKeys.filter(k => !enKeys.includes(k))).toEqual([])
  })

  it('ne laisse aucune valeur vide', () => {
    const empty = [...Object.entries({ fr, en })].flatMap(([lang, dict]) =>
      flatten(dict)
        .filter(key => !key.split('.').reduce((o, k) => o[k], dict).trim())
        .map(key => `${lang}:${key}`)
    )
    expect(empty).toEqual([])
  })

  it('utilise les mêmes variables d\'interpolation dans les deux langues', () => {
    // {{vehicle}} présent en français mais absent en anglais afficherait une phrase
    // amputée de son information principale.
    const variables = (dict, key) => {
      const value = key.split('.').reduce((o, k) => o[k], dict)
      return (value.match(/\{\{\w+\}\}/g) || []).sort()
    }

    const mismatched = frKeys.filter(key =>
      variables(fr, key).join() !== variables(en, key).join()
    )
    expect(mismatched).toEqual([])
  })
})
