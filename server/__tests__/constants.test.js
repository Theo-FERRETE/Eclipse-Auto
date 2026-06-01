const { VEHICLE_STATUSES, RESERVATION_STATUSES, FUEL_TYPES, TRANSMISSIONS } = require('../constants')

describe('VEHICLE_STATUSES', () => {
  it('est un tableau non vide', () => {
    expect(Array.isArray(VEHICLE_STATUSES)).toBe(true)
    expect(VEHICLE_STATUSES.length).toBeGreaterThan(0)
  })

  it('contient available, reserved, sold', () => {
    expect(VEHICLE_STATUSES).toContain('available')
    expect(VEHICLE_STATUSES).toContain('reserved')
    expect(VEHICLE_STATUSES).toContain('sold')
  })

  it('ne contient que des strings', () => {
    VEHICLE_STATUSES.forEach(s => expect(typeof s).toBe('string'))
  })
})

describe('RESERVATION_STATUSES', () => {
  it('contient pending, confirmed, cancelled', () => {
    expect(RESERVATION_STATUSES).toContain('pending')
    expect(RESERVATION_STATUSES).toContain('confirmed')
    expect(RESERVATION_STATUSES).toContain('cancelled')
  })

  it('ne contient que des strings', () => {
    RESERVATION_STATUSES.forEach(s => expect(typeof s).toBe('string'))
  })
})

describe('FUEL_TYPES', () => {
  it('contient au moins essence et électrique', () => {
    expect(FUEL_TYPES.some(f => f.toLowerCase().includes('essence'))).toBe(true)
    expect(FUEL_TYPES.some(f => f.toLowerCase().includes('lectrique'))).toBe(true)
  })
})

describe('TRANSMISSIONS', () => {
  it('contient automatique et manuelle', () => {
    expect(TRANSMISSIONS.some(t => t.toLowerCase().includes('automatique'))).toBe(true)
    expect(TRANSMISSIONS.some(t => t.toLowerCase().includes('manuelle'))).toBe(true)
  })
})
