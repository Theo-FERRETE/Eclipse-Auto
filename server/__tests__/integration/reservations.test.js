const request = require('supertest')

jest.mock('../../supabase', () => require('../mocks/supabase').supabaseMock)

const { supabaseMock, mockUser, mockAdmin } = require('../mocks/supabase')
const app = require('../../app')

const mockReservation = {
  id: 'resa-uuid-001',
  client_id: mockUser.id,
  vehicle_id: 'vehicle-uuid-789',
  status: 'pending',
  message: null,
  created_at: new Date().toISOString(),
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

beforeEach(() => jest.clearAllMocks())

describe('GET /api/reservations', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app).get('/api/reservations')

    expect(res.status).toBe(401)
  })

  it('retourne les réservations de l\'utilisateur connecté', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery([mockReservation]))

    const res = await request(app)
      .get('/api/reservations')
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('GET /api/reservations/all (admin)', () => {
  it('rejette un utilisateur non-admin (403)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const q = makeQuery({ role: 'client' })
    q.single = jest.fn().mockResolvedValue({ data: { role: 'client' }, error: null })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .get('/api/reservations/all')
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(403)
  })
})

describe('POST /api/reservations', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app)
      .post('/api/reservations')
      .send({ vehicle_id: 'vehicle-uuid-789' })

    expect(res.status).toBe(401)
  })

  it('rejette sans vehicle_id (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', 'Bearer user-token')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/vehicle_id/)
  })
})

describe('PATCH /api/reservations/:id/status (admin)', () => {
  it('rejette un statut invalide (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const q = makeQuery({ role: 'admin' })
    q.single = jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .patch(`/api/reservations/${mockReservation.id}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'invalid_status' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Statut invalide/)
  })
})
