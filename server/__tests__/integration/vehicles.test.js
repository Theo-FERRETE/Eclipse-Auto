const request = require('supertest')

jest.mock('../../supabase', () => require('../mocks/supabase').supabaseMock)

const { supabaseMock, mockUser, mockAdmin, mockVehicle } = require('../mocks/supabase')
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

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/vehicles', () => {
  it('retourne la liste paginée des véhicules', async () => {
    supabaseMock.from.mockReturnValue(makeQuery([mockVehicle], 1))

    const res = await request(app).get('/api/vehicles')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('total')
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('respecte le paramètre limit (plafonné à 100)', async () => {
    supabaseMock.from.mockReturnValue(makeQuery([mockVehicle], 1))

    const res = await request(app).get('/api/vehicles?limit=200')

    expect(res.status).toBe(200)
    expect(res.body.limit).toBe(100)
  })

  it('valide le paramètre status (400 si invalide, 200 pour available/reserved/sold)', async () => {
    const invalide = await request(app).get('/api/vehicles?status=INVALID')
    expect(invalide.status).toBe(400)
    expect(invalide.body.error).toMatch(/statut invalide/i)

    for (const status of ['available', 'reserved', 'sold']) {
      supabaseMock.from.mockReturnValue(makeQuery([], 0))
      const res = await request(app).get(`/api/vehicles?status=${status}`)
      expect(res.status).toBe(200)
    }
  })
})

describe('GET /api/vehicles/:id', () => {
  it('retourne un véhicule existant', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(mockVehicle))

    const res = await request(app).get(`/api/vehicles/${mockVehicle.id}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(mockVehicle.id)
  })

  it('retourne 404 si véhicule inexistant', async () => {
    const q = makeQuery(null)
    q.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app).get('/api/vehicles/id-inexistant')

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})

describe('GET /api/vehicles/by-slug/:slug', () => {
  it('retourne un véhicule par son slug (200), 404 si aucun ne correspond', async () => {
    supabaseMock.from.mockReturnValue(makeQuery([mockVehicle]))

    const trouve = await request(app).get('/api/vehicles/by-slug/toyota-corolla')
    expect(trouve.status).toBe(200)
    expect(trouve.body.brand).toBe('Toyota')

    const absent = await request(app).get('/api/vehicles/by-slug/slug-inexistant')
    expect(absent.status).toBe(404)
    expect(absent.body).toHaveProperty('error')
  })
})

describe('POST /api/vehicles (admin)', () => {
  it('rejette sans token (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app)
      .post('/api/vehicles')
      .send({ brand: 'Toyota', model: 'Corolla', year: 2022, price: 25000 })

    expect(res.status).toBe(401)
  })

  it('rejette si non-admin (403)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const q = makeQuery({ role: 'client' })
    q.single = jest.fn().mockResolvedValue({ data: { role: 'client' }, error: null })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', 'Bearer user-token')
      .send({ brand: 'Toyota', model: 'Corolla', year: 2022, price: 25000 })

    expect(res.status).toBe(403)
  })

  it('rejette si les champs obligatoires sont manquants (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', 'Bearer admin-token')
      .send({ brand: 'Toyota' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/manquants/)
  })

  it('valide année et prix (400 si année ou prix invalide)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const q = makeQuery({ role: 'admin' })
    q.single = jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
    supabaseMock.from.mockReturnValue(q)

    const anneeInvalide = await request(app)
      .post('/api/vehicles')
      .set('Authorization', 'Bearer admin-token')
      .send({ brand: 'Toyota', model: 'Corolla', year: 1800, price: 25000, fuel_type: 'essence', transmission: 'auto' })
    expect(anneeInvalide.status).toBe(400)
    expect(anneeInvalide.body.error).toMatch(/Année invalide/)

    const prixInvalide = await request(app)
      .post('/api/vehicles')
      .set('Authorization', 'Bearer admin-token')
      .send({ brand: 'Toyota', model: 'Corolla', year: 2022, price: -500, fuel_type: 'essence', transmission: 'auto' })
    expect(prixInvalide.status).toBe(400)
    expect(prixInvalide.body.error).toMatch(/Prix invalide/)
  })

  it('crée un véhicule et retourne 201', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery(mockVehicle))

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', 'Bearer admin-token')
      .send({
        brand: 'Toyota', model: 'Corolla', year: 2022,
        price: 25000, fuel_type: 'essence', transmission: 'automatique',
        mileage: 15000, power: 120, description: 'Très bon état',
      })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
  })
})

describe('PUT /api/vehicles/:id (admin)', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app)
      .put(`/api/vehicles/${mockVehicle.id}`)
      .send({ brand: 'Honda', model: 'Civic', year: 2023, price: 30000 })

    expect(res.status).toBe(401)
  })

  it('met à jour un véhicule et retourne 200', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const updated = { ...mockVehicle, model: 'Civic' }
    supabaseMock.from.mockReturnValue(makeQuery(updated))

    const res = await request(app)
      .put(`/api/vehicles/${mockVehicle.id}`)
      .set('Authorization', 'Bearer admin-token')
      .send({ brand: 'Honda', model: 'Civic', year: 2023, price: 30000, fuel_type: 'essence', transmission: 'automatique' })

    expect(res.status).toBe(200)
    expect(res.body.model).toBe('Civic')
  })

  it('un PUT partiel n\'écrase pas les champs absents du corps', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const q = makeQuery({ ...mockVehicle, status: 'sold' })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .put(`/api/vehicles/${mockVehicle.id}`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'sold' })

    expect(res.status).toBe(200)

    // Seul status doit partir en base : sans ce garde-fou, parseInt(undefined)
    // envoyait year: null, price: null, images: [] et détruisait la fiche.
    expect(q.update).toHaveBeenCalledWith({ status: 'sold' })
  })

  it('rejette un PUT sans aucun champ modifiable (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })

    const res = await request(app)
      .put(`/api/vehicles/${mockVehicle.id}`)
      .set('Authorization', 'Bearer admin-token')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Aucun champ/)
  })

  it('rejette un statut de véhicule invalide (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })

    const res = await request(app)
      .put(`/api/vehicles/${mockVehicle.id}`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'offert' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Statut invalide/)
  })
})

describe('DELETE /api/vehicles/:id (admin)', () => {
  it('rejette sans auth (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app).delete(`/api/vehicles/${mockVehicle.id}`)

    expect(res.status).toBe(401)
  })

  it('supprime le véhicule et retourne success (200)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery(null))

    const res = await request(app)
      .delete(`/api/vehicles/${mockVehicle.id}`)
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
