const request = require('supertest')

jest.mock('../../supabase', () => require('../mocks/supabase').supabaseMock)

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' })
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}))

const { supabaseMock, mockUser, mockAdmin } = require('../mocks/supabase')
const app = require('../../app')

const mockVente = {
  id: 'vente-uuid-001',
  client_id: mockUser.id,
  vehicle_id: 'vehicle-uuid-789',
  reservation_id: null,
  prix_final: 25000,
  mode_paiement: 'carte',
  status: 'pending',
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
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue({ data, error: null }),
    then: (fn) => Promise.resolve(result).then(fn),
    [Symbol.toStringTag]: 'Promise',
  }
  return q
}

beforeEach(() => jest.clearAllMocks())

describe('GET /api/ventes', () => {
  it('rejette sans authentification (401)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No token' } })

    const res = await request(app).get('/api/ventes')

    expect(res.status).toBe(401)
  })

  it('retourne les ventes de l\'utilisateur connecté, équipements aplatis', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const withEquip = {
      ...mockVente,
      vente_equipements: [{ equipements: { id: 'equip-1', nom: 'GPS', prix_supplement: 500 } }],
    }
    supabaseMock.from.mockReturnValue(makeQuery([withEquip]))

    const res = await request(app)
      .get('/api/ventes')
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(200)
    expect(res.body[0].equipements).toEqual([{ id: 'equip-1', nom: 'GPS', prix_supplement: 500 }])
    expect(res.body[0]).not.toHaveProperty('vente_equipements')
  })
})

describe('GET /api/ventes/all (admin)', () => {
  it('rejette un utilisateur non-admin (403)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const q = makeQuery({ role: 'client' })
    q.single = jest.fn().mockResolvedValue({ data: { role: 'client' }, error: null })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .get('/api/ventes/all')
      .set('Authorization', 'Bearer user-token')

    expect(res.status).toBe(403)
  })

  it('valide le paramètre status (400 si invalide)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })

    const res = await request(app)
      .get('/api/ventes/all?status=INCONNU')
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/statut invalide/i)
  })

  it('retourne toutes les ventes paginées avec le nom du client (200)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const ventesQuery = makeQuery([mockVente], 1)
    const profilesQuery = makeQuery([{ id: mockUser.id, first_name: 'Théo', last_name: 'F.' }])
    supabaseMock.from
      .mockReturnValueOnce(ventesQuery)
      .mockReturnValueOnce(profilesQuery)

    const res = await request(app)
      .get('/api/ventes/all')
      .set('Authorization', 'Bearer admin-token')

    expect(res.status).toBe(200)
    expect(res.body.data[0].client_name).toBe('Théo F.')
  })
})

describe('POST /api/ventes', () => {
  it('rejette sans vehicle_id (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const res = await request(app)
      .post('/api/ventes')
      .set('Authorization', 'Bearer user-token')
      .send({ mode_paiement: 'carte' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/vehicle_id/)
  })

  it('rejette un mode_paiement invalide (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const res = await request(app)
      .post('/api/ventes')
      .set('Authorization', 'Bearer user-token')
      .send({ vehicle_id: 'vehicle-uuid-789', mode_paiement: 'bitcoin' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/mode_paiement/)
  })

  it('retourne 409 si le véhicule est déjà vendu', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    supabaseMock.from.mockReturnValue(makeQuery({ id: 'vehicle-uuid-789', price: 25000, status: 'sold' }))

    const res = await request(app)
      .post('/api/ventes')
      .set('Authorization', 'Bearer user-token')
      .send({ vehicle_id: 'vehicle-uuid-789', mode_paiement: 'carte' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/vendu/)
  })

  it('calcule prix_final serveur (véhicule + options), ignore un total envoyé par le client', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const vehicleQuery = makeQuery({ id: 'vehicle-uuid-789', price: 25000, status: 'available' })
    const equipQuery = makeQuery([{ id: 'equip-1', nom: 'GPS', prix_supplement: 500 }, { id: 'equip-2', nom: 'Toit ouvrant', prix_supplement: 1200 }])
    const insertQuery = makeQuery(mockVente)
    const insertSpy = jest.fn().mockReturnValue(insertQuery)
    insertQuery.insert = insertSpy
    const equipLinkQuery = makeQuery(null)

    supabaseMock.from
      .mockReturnValueOnce(vehicleQuery)
      .mockReturnValueOnce(equipQuery)
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(equipLinkQuery)

    const res = await request(app)
      .post('/api/ventes')
      .set('Authorization', 'Bearer user-token')
      .send({
        vehicle_id: 'vehicle-uuid-789',
        equipement_ids: ['equip-1', 'equip-2'],
        mode_paiement: 'carte',
        prix_final: 1, // doit être ignoré : recalculé côté serveur
      })

    expect(res.status).toBe(201)
    expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({
      client_id: mockUser.id,
      prix_final: 26700,
      status: 'pending',
    }))
  })

  it('crée une vente sans options (201)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const vehicleQuery = makeQuery({ id: 'vehicle-uuid-789', price: 25000, status: 'available' })
    const insertQuery = makeQuery(mockVente)

    supabaseMock.from
      .mockReturnValueOnce(vehicleQuery)
      .mockReturnValueOnce(insertQuery)

    const res = await request(app)
      .post('/api/ventes')
      .set('Authorization', 'Bearer user-token')
      .send({ vehicle_id: 'vehicle-uuid-789', mode_paiement: 'especes' })

    expect(res.status).toBe(201)
    expect(res.body.equipements).toEqual([])
  })
})

describe('PATCH /api/ventes/:id/status (admin)', () => {
  it('rejette un statut invalide (400)', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const q = makeQuery({ role: 'admin' })
    q.single = jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .patch(`/api/ventes/${mockVente.id}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'pending' })

    expect(res.status).toBe(400)
  })

  it('retourne 404 si la vente n\'existe pas', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const q = makeQuery(null)
    q.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    supabaseMock.from.mockReturnValue(q)

    const res = await request(app)
      .patch('/api/ventes/id-inexistant/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'confirmed' })

    expect(res.status).toBe(404)
  })

  it('retourne 409 si une autre vente est déjà confirmée pour ce véhicule', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const selectQuery = makeQuery({ client_id: mockUser.id, vehicles: { brand: 'Toyota', model: 'Corolla' } })
    const updateQuery = makeQuery(null)
    updateQuery.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'conflict', code: '23505' } })
    supabaseMock.from
      .mockReturnValueOnce(selectQuery)
      .mockReturnValueOnce(updateQuery)

    const res = await request(app)
      .patch(`/api/ventes/${mockVente.id}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'confirmed' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/déjà une vente confirmée/)
  })

  it('confirme une vente et envoie l\'email d\'achat', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    supabaseMock.auth.admin.getUserById.mockResolvedValue({ data: { user: { email: 'client@test.com' } } })
    const venteWithDetails = {
      client_id: mockUser.id,
      prix_final: 26700,
      mode_paiement: 'carte',
      vehicles: { brand: 'Toyota', model: 'Corolla', year: 2022 },
      vente_equipements: [{ equipements: { nom: 'GPS', prix_supplement: 500 } }],
    }
    const selectQuery = makeQuery(venteWithDetails)
    const updateQuery = makeQuery({ ...mockVente, status: 'confirmed' })
    const profileQuery = makeQuery({ first_name: 'Théo' })
    supabaseMock.from
      .mockReturnValueOnce(selectQuery)
      .mockReturnValueOnce(updateQuery)
      .mockReturnValue(profileQuery)

    const res = await request(app)
      .patch(`/api/ventes/${mockVente.id}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'confirmed' })

    expect(res.status).toBe(200)
    expect(mockSendMail).toHaveBeenCalledTimes(1)
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'client@test.com',
        subject: expect.stringContaining('Toyota Corolla'),
        html: expect.stringContaining('Théo'),
      })
    )
  })

  it('n\'envoie pas d\'email pour une annulation', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null })
    const venteWithDetails = {
      client_id: mockUser.id,
      prix_final: 26700,
      mode_paiement: 'carte',
      vehicles: { brand: 'Toyota', model: 'Corolla', year: 2022 },
      vente_equipements: [],
    }
    supabaseMock.from.mockReturnValue(makeQuery({ ...venteWithDetails, status: 'cancelled' }))

    const res = await request(app)
      .patch(`/api/ventes/${mockVente.id}/status`)
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'cancelled' })

    expect(res.status).toBe(200)
    expect(mockSendMail).not.toHaveBeenCalled()
  })
})
