const request = require('supertest')

jest.mock('../../supabase', () => require('../mocks/supabase').supabaseMock)

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
    head: jest.fn().mockReturnThis(),
    then: (fn) => Promise.resolve(result).then(fn),
    [Symbol.toStringTag]: 'Promise',
  }
  return q
}

beforeEach(() => jest.clearAllMocks())

describe('GET /api/admin/stats', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app).get('/api/admin/stats')

    expect(res.status).toBe(401)
  })

  it('rejette un utilisateur non-admin (403)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const q = makeQuery({ role: 'client' })
    q.single = jest.fn().mockResolvedValue({ data: { role: 'client' }, error: null })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/clients', () => {
  it('rejette sans token (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app).get('/api/admin/clients')

    expect(res.status).toBe(401)
  })

  it('rejette un client ordinaire (403)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const q = makeQuery({ role: 'client' })
    q.single = jest.fn().mockResolvedValue({ data: { role: 'client' }, error: null })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .get('/api/admin/clients')
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/admin/clients/:id', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app).delete('/api/admin/clients/some-user-id')

    expect(res.status).toBe(401)
  })

  it('supprime un client et retourne success (200)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.auth.admin.deleteUser.mockResolvedValue({ error: null })

    const res = await request(app)
      .delete('/api/admin/clients/some-user-id')
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

describe('GET /api/admin/stats — cas succès', () => {
  it('retourne les statistiques du dashboard (200)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const statsQuery = makeQuery(null, 10)
    supabaseMock.from.mockReturnValue(statsQuery)

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('vehicles')
    expect(res.body).toHaveProperty('reservations')
    expect(res.body).toHaveProperty('clients')
    expect(res.body.vehicles).toHaveProperty('total')
  })
})

describe('GET /api/admin/clients — cas succès', () => {
  it('retourne la liste des clients paginée (200)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const mockClient = { id: 'client-uuid-001', email: 'client@test.com', role: 'client' }
    supabaseMock.from.mockReturnValue(makeQuery([mockClient], 1))

    const res = await request(app)
      .get('/api/admin/clients')
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('total')
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})
