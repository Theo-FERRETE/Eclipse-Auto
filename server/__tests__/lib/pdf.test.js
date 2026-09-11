const { buildInvoicePdf, buildReservationPdf } = require('../../lib/pdf')

const mockVehicle = { brand: 'Ferrari', model: 'Roma Spider', year: 2024, price: 248000 }

describe('buildInvoicePdf', () => {
  it('génère un Buffer PDF valide', async () => {
    const buffer = await buildInvoicePdf({
      id: 'vente-uuid-001',
      date: new Date('2026-09-11'),
      clientName: 'Théo',
      vehicle: mockVehicle,
      equipements: [{ nom: 'GPS', prix_supplement: 500 }],
      prixFinal: 248500,
      modePaiement: 'carte',
    })

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('fonctionne sans équipements', async () => {
    const buffer = await buildInvoicePdf({
      id: 'vente-uuid-002',
      date: new Date('2026-09-11'),
      clientName: 'Théo',
      vehicle: mockVehicle,
      equipements: [],
      prixFinal: 248000,
      modePaiement: 'especes',
    })

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-')
  })
})

describe('buildReservationPdf', () => {
  it('génère un Buffer PDF valide avec un créneau', async () => {
    const buffer = await buildReservationPdf({
      id: 'resa-uuid-001',
      date: new Date('2026-09-11'),
      clientName: 'Théo',
      vehicle: mockVehicle,
      rdvDate: '2026-09-15T10:00:00',
      rdvDateFin: '2026-09-18T10:00:00',
    })

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('fonctionne sans dates de rendez-vous', async () => {
    const buffer = await buildReservationPdf({
      id: 'resa-uuid-002',
      date: new Date('2026-09-11'),
      clientName: 'Théo',
      vehicle: mockVehicle,
      rdvDate: null,
      rdvDateFin: null,
    })

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-')
  })
})
