const request = require('supertest')

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}))

const app = require('../../app')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/contact', () => {
  const validBody = {
    name: 'Jean Dupont',
    email: 'jean@example.com',
    message: 'Bonjour, je suis intéressé par un véhicule.',
  }

  it('accepte un message valide (200)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', '10.0.0.1')
      .send(validBody)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('rejette si un champ obligatoire manque (400)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', '10.0.0.2')
      .send({ email: 'jean@example.com', message: 'Bonjour' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('rejette si un champ dépasse la longueur maximale (400)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', '10.0.0.5')
      .send({ name: 'a'.repeat(101), email: 'jean@example.com', message: 'Bonjour' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/trop longs/)
  })

  it('bloque après 5 requêtes depuis la même IP (429)', async () => {
    const ip = '10.0.0.99'

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/contact')
        .set('X-Forwarded-For', ip)
        .send(validBody)
    }

    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', ip)
      .send(validBody)

    expect(res.status).toBe(429)
    expect(res.body.error).toMatch(/Trop de requêtes/)
  })

  it('ignore X-Forwarded-For quand TRUST_PROXY est désactivé', async () => {
    // Sans proxy inverse, l'en-tête est forgeable : s'il servait de clé au rate
    // limiting, il suffirait de le faire varier pour envoyer des mails sans limite.
    const previous = process.env.TRUST_PROXY
    delete process.env.TRUST_PROXY
    jest.resetModules()
    const freshApp = require('../../app')

    let last
    for (let i = 0; i < 6; i++) {
      last = await request(freshApp)
        .post('/api/contact')
        .set('X-Forwarded-For', `203.0.113.${i}`)
        .send(validBody)
    }

    expect(last.status).toBe(429)

    process.env.TRUST_PROXY = previous
    jest.resetModules()
  })
})
