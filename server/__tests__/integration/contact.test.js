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

  it('rejette si nom manquant (400)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', '10.0.0.2')
      .send({ email: 'jean@example.com', message: 'Bonjour' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('rejette si email manquant (400)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', '10.0.0.3')
      .send({ name: 'Jean', message: 'Bonjour' })

    expect(res.status).toBe(400)
  })

  it('rejette si message manquant (400)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', '10.0.0.4')
      .send({ name: 'Jean', email: 'jean@example.com' })

    expect(res.status).toBe(400)
  })

  it('rejette si nom > 100 caractères (400)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', '10.0.0.5')
      .send({ name: 'a'.repeat(101), email: 'jean@example.com', message: 'Bonjour' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/trop longs/)
  })

  it('rejette si message > 5000 caractères (400)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('X-Forwarded-For', '10.0.0.6')
      .send({ name: 'Jean', email: 'jean@example.com', message: 'a'.repeat(5001) })

    expect(res.status).toBe(400)
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
})
