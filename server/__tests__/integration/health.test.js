const request = require('supertest')
const app = require('../../app')

describe('GET /api/health', () => {
  it('retourne 200 avec status ok', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('retourne le nom de l\'application', async () => {
    const res = await request(app).get('/api/health')

    expect(res.body.app).toBe('Eclipse Auto API')
  })

  it('retourne un timestamp ISO valide', async () => {
    const res = await request(app).get('/api/health')

    expect(res.body).toHaveProperty('timestamp')
    expect(() => new Date(res.body.timestamp)).not.toThrow()
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp)
  })
})
