const request = require('supertest')

jest.mock('../../supabase', () => require('../mocks/supabase').supabaseMock)

const { supabaseMock, mockAdmin } = require('../mocks/supabase')
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

describe('POST /api/equipements (admin)', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app)
      .post('/api/equipements')
      .send({ nom: 'Aileron', prix_supplement: 600 })

    expect(res.status).toBe(401)
  })

  it('rejette si non-admin (403)', async () => {
    const { mockUser } = require('../mocks/supabase')
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const res = await request(app)
      .post('/api/equipements')
      .set('Authorization', 'Bearer user-token')
      .send({ nom: 'Aileron', prix_supplement: 600 })

    expect(res.status).toBe(403)
  })

  it('rejette sans nom (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })

    const res = await request(app)
      .post('/api/equipements')
      .set('Authorization', 'Bearer admin-token')
      .send({ prix_supplement: 600 })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/nom/)
  })

  it('rejette un prix négatif (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })

    const res = await request(app)
      .post('/api/equipements')
      .set('Authorization', 'Bearer admin-token')
      .send({ nom: 'Aileron', prix_supplement: -100 })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Prix invalide/)
  })

  it('crée un équipement et retourne 201', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery(mockEquipement))

    const res = await request(app)
      .post('/api/equipements')
      .set('Authorization', 'Bearer admin-token')
      .send({ nom: 'GPS', categorie: 'Confort', prix_supplement: 500 })

    expect(res.status).toBe(201)
    expect(res.body.nom).toBe('GPS')
  })
})

describe('PUT /api/equipements/:id (admin)', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app)
      .put(`/api/equipements/${mockEquipement.id}`)
      .send({ nom: 'GPS Pro', prix_supplement: 700 })

    expect(res.status).toBe(401)
  })

  it('met à jour un équipement et retourne 200', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const updated = { ...mockEquipement, nom: 'GPS Pro', prix_supplement: 700 }
    supabaseMock.from.mockReturnValue(makeQuery(updated))

    const res = await request(app)
      .put(`/api/equipements/${mockEquipement.id}`)
      .set('Authorization', 'Bearer admin-token')
      .send({ nom: 'GPS Pro', categorie: 'Confort', prix_supplement: 700 })

    expect(res.status).toBe(200)
    expect(res.body.nom).toBe('GPS Pro')
  })
})

describe('DELETE /api/equipements/:id (admin)', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app).delete(`/api/equipements/${mockEquipement.id}`)

    expect(res.status).toBe(401)
  })

  it('supprime l\'équipement et retourne success (200)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery(null))

    const res = await request(app)
      .delete(`/api/equipements/${mockEquipement.id}`)
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
