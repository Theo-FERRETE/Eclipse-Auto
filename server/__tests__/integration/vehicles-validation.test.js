const request = require('supertest')

jest.mock('../../supabase', () => require('../mocks/supabase').supabaseMock)

const { supabaseMock, mockAdmin, mockVehicle } = require('../mocks/supabase')
const app = require('../../app')

function makeQuery(data, count = null) {
  const result = count !== null ? { data, error: null, count } : { data, error: null }
  const q = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue({ data, error: null }),
    then: (fn) => Promise.resolve(result).then(fn),
    [Symbol.toStringTag]: 'Promise',
  }
  return q
}

beforeEach(() => jest.clearAllMocks())

describe('GET /api/vehicles — validation statut', () => {
  it('rejette un statut invalide (400)', async () => {
    const res = await request(app).get('/api/vehicles?status=INVALID')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/statut invalide/i)
  })

  it('accepte les statuts valides : available', async () => {
    supabaseMock.from.mockReturnValue(makeQuery([mockVehicle], 1))

    const res = await request(app).get('/api/vehicles?status=available')

    expect(res.status).toBe(200)
  })

  it('accepte les statuts valides : reserved', async () => {
    supabaseMock.from.mockReturnValue(makeQuery([], 0))

    const res = await request(app).get('/api/vehicles?status=reserved')

    expect(res.status).toBe(200)
  })

  it('accepte les statuts valides : sold', async () => {
    supabaseMock.from.mockReturnValue(makeQuery([], 0))

    const res = await request(app).get('/api/vehicles?status=sold')

    expect(res.status).toBe(200)
  })
})

describe('POST /api/vehicles — cas succès avec champs complets', () => {
  it('crée un véhicule avec tous les champs optionnels', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery(mockVehicle))

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', 'Bearer admin-token')
      .send({
        brand: 'Toyota', model: 'Corolla', year: 2022,
        price: 25000, fuel_type: 'essence', transmission: 'automatique',
        mileage: 15000, power: 120, description: 'Très bon état',
        status: 'available',
      })

    expect(res.status).toBe(201)
  })
})

describe('GET /api/vehicles/:id — erreur Supabase', () => {
  it('retourne 404 si Supabase renvoie une erreur', async () => {
    const q = makeQuery(null)
    q.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app).get('/api/vehicles/uuid-inexistant')

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})
