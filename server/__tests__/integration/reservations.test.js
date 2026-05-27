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

  it('met à jour le statut d\'une réservation (200)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const updated = { ...mockReservation, status: 'confirmed' }
    supabaseMock.from.mockReturnValue(makeQuery(updated))

    const res = await request(app)
      .patch(`/api/reservations/${mockReservation.id}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'confirmed' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('confirmed')
  })
})

describe('GET /api/reservations/all (admin) — cas succès', () => {
  it('retourne toutes les réservations paginées (200)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery([mockReservation], 1))

    const res = await request(app)
      .get('/api/reservations/all')
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('total')
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

describe('POST /api/reservations — cas complets', () => {
  it('retourne 409 si le véhicule n\'est plus disponible', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const vehicleQuery = makeQuery({ status: 'reserved' })
    supabaseMock.from.mockReturnValue(vehicleQuery)

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', 'Bearer user-token')
      .send({ vehicle_id: 'vehicle-uuid-789' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/disponible/)
  })

  it('crée une réservation et retourne 201', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const vehicleQuery = makeQuery({ status: 'available' })
    const insertQuery = makeQuery(mockReservation)
    supabaseMock.from
      .mockReturnValueOnce(vehicleQuery)
      .mockReturnValue(insertQuery)

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', 'Bearer user-token')
      .send({ vehicle_id: 'vehicle-uuid-789' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
  })
})

describe('PATCH /api/reservations/:id/cancel', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app).patch(`/api/reservations/${mockReservation.id}/cancel`)

    expect(res.status).toBe(401)
  })

  it('rejette si la réservation n\'appartient pas à l\'utilisateur (403)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const q = makeQuery({ client_id: 'autre-user-id', status: 'pending' })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .patch(`/api/reservations/${mockReservation.id}/cancel`)
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(403)
  })

  it('rejette si la réservation n\'est pas en attente (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const q = makeQuery({ client_id: mockUser.id, status: 'confirmed' })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .patch(`/api/reservations/${mockReservation.id}/cancel`)
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/annulées/)
  })

  it('annule la réservation avec succès (200)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const selectQuery = makeQuery({ client_id: mockUser.id, status: 'pending' })
    const updateQuery = makeQuery({ ...mockReservation, status: 'cancelled' })
    supabaseMock.from
      .mockReturnValueOnce(selectQuery)
      .mockReturnValue(updateQuery)

    const res = await request(app)
      .patch(`/api/reservations/${mockReservation.id}/cancel`)
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('cancelled')
  })
})
