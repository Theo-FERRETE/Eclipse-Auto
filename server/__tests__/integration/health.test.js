const request = require('supertest')
const app = require('../../app')

describe('GET /api/health', () => {
  it('retourne 200 avec le statut, le nom de l\'app et un timestamp ISO valide', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.app).toBe('Eclipse Auto API')
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp)
  })
})
