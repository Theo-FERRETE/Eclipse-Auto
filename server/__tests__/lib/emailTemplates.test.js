const { buildConfirmationEmail, buildVenteConfirmationEmail, escapeHtml } = require('../../lib/emailTemplates')

const mockVehicle = {
  brand: 'Ferrari',
  model: 'Roma Spider',
  year: 2024,
  price: 248000,
}

// ─── escapeHtml ────────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('échappe les 5 caractères spéciaux HTML', () => {
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('>')).toBe('&gt;')
    expect(escapeHtml('"')).toBe('&quot;')
    expect(escapeHtml("'")).toBe('&#039;')
  })

  it('échappe une chaîne contenant du HTML injecté (XSS)', () => {
    const result = escapeHtml('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('convertit les non-string en string avant d\'échapper', () => {
    expect(escapeHtml(42)).toBe('42')
    expect(escapeHtml(null)).toBe('null')
  })
})

// ─── buildConfirmationEmail ────────────────────────────────────────────────────

describe('buildConfirmationEmail', () => {
  it('contient le prénom du client et les infos du véhicule', () => {
    const html = buildConfirmationEmail('Théo', mockVehicle, null)
    expect(html).toContain('Théo')
    expect(html).toContain('Ferrari')
    expect(html).toContain('Roma Spider')
    expect(html).toContain('2024')
    expect(html).toContain('248')
  })

  it('affiche "Prix sur demande" quand price est absent ou nul', () => {
    expect(buildConfirmationEmail('Client', { ...mockVehicle, price: null }, null)).toContain('Prix sur demande')
    expect(buildConfirmationEmail('Client', { ...mockVehicle, price: 0 }, null)).toContain('Prix sur demande')
  })

  it('inclut la ligne rendez-vous seulement si rdv_date est fournie', () => {
    const avecRdv = buildConfirmationEmail('Client', mockVehicle, '2026-06-15T10:00:00')
    const sansRdv = buildConfirmationEmail('Client', mockVehicle, null)
    expect(avecRdv).toContain('Rendez-vous')
    expect(sansRdv).not.toContain('Rendez-vous')
  })

  it('échappe les données injectées (prénom, marque, modèle) pour prévenir le XSS', () => {
    const html = buildConfirmationEmail('<script>alert(1)</script>', { ...mockVehicle, brand: '<img onerror=alert(1)>' }, null)
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img onerror=alert(1)>')
    expect(html).toContain('&lt;script&gt;')
  })
})

// ─── buildVenteConfirmationEmail ───────────────────────────────────────────────

describe('buildVenteConfirmationEmail', () => {
  const mockEquipements = [
    { nom: 'GPS', prix_supplement: 500 },
    { nom: 'Toit ouvrant', prix_supplement: 1200 },
  ]

  it('contient le prénom du client, le véhicule, les options et le prix final', () => {
    const html = buildVenteConfirmationEmail('Théo', mockVehicle, mockEquipements, 249700, 'carte')
    expect(html).toContain('Théo')
    expect(html).toContain('Ferrari')
    expect(html).toContain('Roma Spider')
    expect(html).toContain('GPS')
    expect(html).toContain('Toit ouvrant')
    expect(html).toContain('249')
    expect(html).toContain('Carte bancaire')
  })

  it('n\'affiche pas le bloc options quand la vente n\'en a aucune', () => {
    const html = buildVenteConfirmationEmail('Théo', mockVehicle, [], 248000, 'especes')
    expect(html).not.toContain('Options')
    expect(html).toContain('Espèces')
  })

  it('échappe les données injectées (prénom, marque, nom d\'équipement) pour prévenir le XSS', () => {
    const html = buildVenteConfirmationEmail(
      '<script>alert(1)</script>',
      { ...mockVehicle, brand: '<img onerror=alert(1)>' },
      [{ nom: '<b>xss</b>', prix_supplement: 100 }],
      248100,
      'carte'
    )
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img onerror=alert(1)>')
    expect(html).not.toContain('<b>xss</b>')
    expect(html).toContain('&lt;script&gt;')
  })
})
