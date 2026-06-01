const request = require('supertest')

jest.mock('../../supabase', () => require('../mocks/supabase').supabaseMock)
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({}) })),
}))

const { supabaseMock, mockUser, mockAdmin } = require('../mocks/supabase')
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

describe('GET /api/reservations/all — validation statut', () => {
  it('rejette un statut invalide (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })

    const res = await request(app)
      .get('/api/reservations/all?status=INCONNU')
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/statut invalide/i)
  })

  it('accepte le statut pending', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery([], 0))

    const res = await request(app)
      .get('/api/reservations/all?status=pending')
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(200)
  })

  it('accepte le statut confirmed', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery([], 0))

    const res = await request(app)
      .get('/api/reservations/all?status=confirmed')
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(200)
  })

  it('accepte le statut cancelled', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery([], 0))

    const res = await request(app)
      .get('/api/reservations/all?status=cancelled')
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/reservations/:id/cancel — cas d\'erreur', () => {
  it('retourne 404 si la réservation n\'existe pas', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const q = makeQuery(null)
    q.single = jest.fn().mockResolvedValue({ data: null, error: null })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .patch('/api/reservations/resa-uuid-001/cancel')
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(404)
  })

  it('retourne 403 si la réservation n\'appartient pas à l\'utilisateur', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const q = makeQuery(null)
    q.single = jest.fn().mockResolvedValue({
      data: { client_id: 'autre-user-id', status: 'pending' },
      error: null,
    })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .patch('/api/reservations/resa-uuid-001/cancel')
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(403)
  })
})

describe('POST /api/reservations — validation', () => {
  it('rejette si vehicle_id manquant (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', 'Bearer user-token')
      .send({})

    expect(res.status).toBe(400)
  })
})
