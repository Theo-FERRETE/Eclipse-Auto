const { buildConfirmationEmail, escapeHtml } = require('../../lib/emailTemplates')

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

  it('retourne la chaîne inchangée si aucun caractère spécial', () => {
    expect(escapeHtml('Ferrari Roma Spider 2024')).toBe('Ferrari Roma Spider 2024')
  })
})

// ─── buildConfirmationEmail ────────────────────────────────────────────────────

describe('buildConfirmationEmail', () => {
  it('contient le prénom du client', () => {
    const html = buildConfirmationEmail('Théo', mockVehicle, null)
    expect(html).toContain('Théo')
  })

  it('contient la marque, le modèle et l\'année du véhicule', () => {
    const html = buildConfirmationEmail('Client', mockVehicle, null)
    expect(html).toContain('Ferrari')
    expect(html).toContain('Roma Spider')
    expect(html).toContain('2024')
  })

  it('affiche le prix formaté en euros', () => {
    const html = buildConfirmationEmail('Client', mockVehicle, null)
    expect(html).toContain('248')
  })

  it('affiche "Prix sur demande" quand price est null', () => {
    const vehicleSansPrix = { ...mockVehicle, price: null }
    const html = buildConfirmationEmail('Client', vehicleSansPrix, null)
    expect(html).toContain('Prix sur demande')
  })

  it('affiche "Prix sur demande" quand price est 0', () => {
    const vehiclePrixZero = { ...mockVehicle, price: 0 }
    const html = buildConfirmationEmail('Client', vehiclePrixZero, null)
    expect(html).toContain('Prix sur demande')
  })

  it('inclut la ligne rendez-vous quand rdv_date est fournie', () => {
    const html = buildConfirmationEmail('Client', mockVehicle, '2026-06-15T10:00:00')
    expect(html).toContain('Rendez-vous')
    expect(html).toContain('2026')
  })

  it('n\'inclut pas de ligne rendez-vous quand rdv_date est null', () => {
    const html = buildConfirmationEmail('Client', mockVehicle, null)
    expect(html).not.toContain('Rendez-vous')
  })

  it('échappe le prénom pour prévenir les injections XSS', () => {
    const html = buildConfirmationEmail('<script>alert(1)</script>', mockVehicle, null)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('échappe la marque et le modèle pour prévenir les injections XSS', () => {
    const vehicleXss = { ...mockVehicle, brand: '<img onerror=alert(1)>', model: '"test"' }
    const html = buildConfirmationEmail('Client', vehicleXss, null)
    expect(html).not.toContain('<img onerror=alert(1)>')
    expect(html).toContain('&lt;img onerror=alert(1)&gt;')
  })

  it('retourne un document HTML valide avec DOCTYPE', () => {
    const html = buildConfirmationEmail('Client', mockVehicle, null)
    expect(html).toMatch(/^<!DOCTYPE html>/)
    expect(html).toContain('<html')
    expect(html).toContain('</html>')
  })

  it('contient la marque Eclipse Auto', () => {
    const html = buildConfirmationEmail('Client', mockVehicle, null)
    expect(html).toContain('ECLIPSE')
    expect(html).toContain('AUTO')
  })
})
