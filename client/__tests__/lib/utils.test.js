import { describe, it, expect } from 'vitest'
import { toSlug, formatPrice, optimizeImageUrl, VEHICLE_STATUS, RESERVATION_STATUS, FUEL_TYPES, TRANSMISSIONS } from '@/lib/utils'

describe('toSlug', () => {
  it('génère un slug en minuscules avec tirets', () => {
    expect(toSlug('Toyota', 'Corolla')).toBe('toyota-corolla')
  })

  it('normalise les accents', () => {
    expect(toSlug('Citroën', 'C3')).toBe('citroen-c3')
  })

  it('remplace les espaces par des tirets', () => {
    expect(toSlug('Aston Martin', 'DB11')).toBe('aston-martin-db11')
  })

  it('supprime les caractères spéciaux', () => {
    expect(toSlug('BMW', 'M3 (2023)')).toBe('bmw-m3-2023')
  })

  it('passe tout en minuscules', () => {
    expect(toSlug('FERRARI', 'ROMA')).toBe('ferrari-roma')
  })
})

describe('formatPrice', () => {
  it('contient le symbole € et les chiffres pour 25000', () => {
    const result = formatPrice(25000)
    expect(result).toMatch(/€/)
    expect(result).toMatch(/25/)
    expect(result).toMatch(/000/)
  })

  it('retourne "Prix sur demande" si price est null', () => {
    expect(formatPrice(null)).toBe('Prix sur demande')
  })

  it('retourne "Prix sur demande" si price est undefined', () => {
    expect(formatPrice(undefined)).toBe('Prix sur demande')
  })

  it('formate 0 en "€ 0"', () => {
    expect(formatPrice(0)).toMatch(/€/)
    expect(formatPrice(0)).toMatch(/0/)
  })

  it('formate un grand nombre avec séparateur de milliers', () => {
    const result = formatPrice(1000000)
    expect(result).toMatch(/€/)
    expect(result).toMatch(/1/)
    expect(result).toMatch(/000/)
  })
})

describe('optimizeImageUrl', () => {
  it('retourne null si url est null', () => {
    expect(optimizeImageUrl(null)).toBeNull()
  })

  it('transforme une URL Supabase Storage en URL de rendu WebP', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/vehicles/img.jpg'
    const result = optimizeImageUrl(url, 400)
    expect(result).toContain('/storage/v1/render/image/public/')
    expect(result).toContain('width=400')
    expect(result).toContain('format=webp')
  })

  it('convertit les images locales /img/ en .webp', () => {
    expect(optimizeImageUrl('/img/car.jpg')).toBe('/img/car.webp')
    expect(optimizeImageUrl('/img/car.png')).toBe('/img/car.webp')
  })

  it('retourne l\'url d\'origine pour les sources inconnues', () => {
    const url = 'https://cdn.example.com/photo.jpg'
    expect(optimizeImageUrl(url)).toBe(url)
  })
})

describe('VEHICLE_STATUS', () => {
  it('contient les 3 statuts disponibles', () => {
    expect(VEHICLE_STATUS).toHaveProperty('available')
    expect(VEHICLE_STATUS).toHaveProperty('reserved')
    expect(VEHICLE_STATUS).toHaveProperty('sold')
  })

  it('chaque statut a un label et un badge', () => {
    Object.values(VEHICLE_STATUS).forEach(s => {
      expect(s).toHaveProperty('label')
      expect(s).toHaveProperty('badge')
    })
  })
})

describe('RESERVATION_STATUS', () => {
  it('contient pending, confirmed, cancelled', () => {
    expect(RESERVATION_STATUS).toHaveProperty('pending')
    expect(RESERVATION_STATUS).toHaveProperty('confirmed')
    expect(RESERVATION_STATUS).toHaveProperty('cancelled')
  })

  it('chaque statut a un label et une class', () => {
    Object.values(RESERVATION_STATUS).forEach(s => {
      expect(s).toHaveProperty('label')
      expect(s).toHaveProperty('class')
    })
  })
})

describe('FUEL_TYPES & TRANSMISSIONS', () => {
  it('FUEL_TYPES contient Essence et Électrique', () => {
    expect(FUEL_TYPES).toContain('Essence')
    expect(FUEL_TYPES).toContain('Électrique')
  })

  it('TRANSMISSIONS contient Automatique et Manuelle', () => {
    expect(TRANSMISSIONS).toContain('Automatique')
    expect(TRANSMISSIONS).toContain('Manuelle')
  })
})
