import { describe, it, expect } from 'vitest'
import { toSlug, formatPrice, optimizeImageUrl } from '@/lib/utils'

describe('toSlug', () => {
  it('génère un slug en minuscules, sans accents ni espaces', () => {
    expect(toSlug('Toyota', 'Corolla')).toBe('toyota-corolla')
    expect(toSlug('Citroën', 'C3')).toBe('citroen-c3')
    expect(toSlug('Aston Martin', 'DB11')).toBe('aston-martin-db11')
  })

  it('supprime les caractères spéciaux', () => {
    expect(toSlug('BMW', 'M3 (2023)')).toBe('bmw-m3-2023')
  })
})

describe('formatPrice', () => {
  it('formate un prix avec le symbole € et le séparateur de milliers', () => {
    expect(formatPrice(25000)).toMatch(/€/)
    expect(formatPrice(1000000)).toMatch(/000/)
  })

  it('retourne "Prix sur demande" si price est null ou undefined', () => {
    expect(formatPrice(null)).toBe('Prix sur demande')
    expect(formatPrice(undefined)).toBe('Prix sur demande')
  })

  it('formate 0 comme un prix normal (pas "Prix sur demande")', () => {
    expect(formatPrice(0)).toMatch(/€/)
    expect(formatPrice(0)).not.toBe('Prix sur demande')
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
