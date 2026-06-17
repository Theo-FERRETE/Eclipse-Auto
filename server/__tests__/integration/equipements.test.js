const request = require('supertest')

jest.mock('../../supabase', () => require('../mocks/supabase').supabaseMock)

const { supabaseMock, mockAdmin, mockVehicle } = require('../mocks/supabase')
const app = require('../../app')

const mockEquipement = {
  id: 'equip-uuid-1',
  nom: 'GPS',
  categorie: 'Confort',
  prix_supplement: 500,
}

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

describe('GET /api/equipements', () => {
  it('retourne la liste des équipements', async () => {
    supabaseMock.from.mockReturnValue(makeQuery([mockEquipement]))

    const res = await request(app).get('/api/equipements')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].nom).toBe('GPS')
  })
})

describe('GET /api/vehicles/:id/equipements', () => {
  it('retourne le véhicule, ses équipements et le prix total', async () => {
    const vehicleQuery = makeQuery(mockVehicle)
    const liensQuery = makeQuery([{ equipements: mockEquipement }])
    supabaseMock.from
      .mockReturnValueOnce(vehicleQuery)
      .mockReturnValueOnce(liensQuery)

    const res = await request(app).get(`/api/vehicles/${mockVehicle.id}/equipements`)

    expect(res.status).toBe(200)
    expect(res.body.prix_base).toBe(mockVehicle.price)
    expect(res.body.prix_total).toBe(mockVehicle.price + mockEquipement.prix_supplement)
    expect(res.body.equipements).toHaveLength(1)
  })

  it('retourne 404 si véhicule inexistant', async () => {
    const q = makeQuery(null)
    q.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app).get('/api/vehicles/id-inexistant/equipements')

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})

describe('PUT /api/vehicles/:id/equipements (admin)', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app)
      .put(`/api/vehicles/${mockVehicle.id}/equipements`)
      .send({ equipement_ids: [mockEquipement.id] })

    expect(res.status).toBe(401)
  })

  it('rejette si equipement_ids n\'est pas un tableau (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })

    const res = await request(app)
      .put(`/api/vehicles/${mockVehicle.id}/equipements`)
      .set('Authorization', 'Bearer admin-token')
      .send({ equipement_ids: 'not-an-array' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/tableau/)
  })

  it('met à jour les équipements et redirige vers le détail (303)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery(null))

    const res = await request(app)
      .put(`/api/vehicles/${mockVehicle.id}/equipements`)
      .set('Authorization', 'Bearer admin-token')
      .send({ equipement_ids: [mockEquipement.id] })

    expect(res.status).toBe(303)
    expect(res.headers.location).toBe(`/api/vehicles/${mockVehicle.id}/equipements`)
  })

  it('accepte un tableau vide (retire tous les équipements)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery(null))

    const res = await request(app)
      .put(`/api/vehicles/${mockVehicle.id}/equipements`)
      .set('Authorization', 'Bearer admin-token')
      .send({ equipement_ids: [] })

    expect(res.status).toBe(303)
  })
})
