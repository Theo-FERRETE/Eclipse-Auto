const { requireAuth, requireAdmin } = require('../../middleware/auth')

describe('Auth Middleware', () => {
  describe('requireAuth', () => {
    it('should reject request without Authorization header', (done) => {
      const req = { headers: {} }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }
      const next = jest.fn()

      requireAuth(req, res, next).then(() => {
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Token manquant.' })
        expect(next).not.toHaveBeenCalled()
        done()
      })
    })

    it('should reject request with invalid Bearer format', (done) => {
      const req = { headers: { authorization: 'InvalidFormat' } }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }
      const next = jest.fn()

      requireAuth(req, res, next).then(() => {
        expect(res.status).toHaveBeenCalledWith(401)
        done()
      })
    })
  })

  describe('requireAdmin', () => {
    it('should reject request without token', (done) => {
      const req = { headers: {} }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }
      const next = jest.fn()

      requireAdmin(req, res, next).then(() => {
        expect(res.status).toHaveBeenCalledWith(401)
        done()
      })
    })
  })
})
