const request = require('supertest')
const app = require('../../app')

describe('Configuration applicative', () => {
  it('renvoie un 404 JSON sur une route /api inconnue, pas le HTML du SPA', async () => {
    const res = await request(app).get('/api/route-inexistante')

    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.body).toHaveProperty('error')
  })

  it('autorise l\'origine Supabase dans la CSP (sinon le front est bloqué en production)', async () => {
    const res = await request(app).get('/api/health')
    const csp = res.headers['content-security-policy']
    const { origin } = new URL(process.env.SUPABASE_URL)

    expect(csp).toContain(`connect-src 'self' ${origin} ${origin.replace('https:', 'wss:')}`)
    expect(csp).toContain(origin)
  })
})
