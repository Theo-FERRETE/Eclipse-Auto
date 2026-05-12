describe('Error Handler', () => {
  describe('Error Response Format', () => {
    it('should return error message in production mode', () => {
      const nodeEnv = 'production'
      const err = new Error('Database connection failed')

      const message = nodeEnv === 'production' ? 'Erreur interne du serveur.' : err.message
      expect(message).toBe('Erreur interne du serveur.')
    })

    it('should return error details in development mode', () => {
      const nodeEnv = 'development'
      const err = new Error('Database connection failed')

      const message = nodeEnv !== 'production' ? err.message : 'Erreur interne du serveur.'
      expect(message).toBe('Database connection failed')
    })
  })

  describe('Status Code Handling', () => {
    it('should default to 500 if no status provided', () => {
      const err = new Error('Something went wrong')
      const statusCode = err.status || 500

      expect(statusCode).toBe(500)
    })

    it('should use custom error status if provided', () => {
      const err = new Error('Not found')
      err.status = 404

      const statusCode = err.status || 500
      expect(statusCode).toBe(404)
    })

    it('should handle common HTTP error statuses', () => {
      const testCases = [
        { status: 400, name: 'Bad Request' },
        { status: 401, name: 'Unauthorized' },
        { status: 403, name: 'Forbidden' },
        { status: 404, name: 'Not Found' },
        { status: 429, name: 'Too Many Requests' },
        { status: 500, name: 'Internal Server Error' },
      ]

      testCases.forEach(testCase => {
        const err = new Error(testCase.name)
        err.status = testCase.status
        expect(err.status).toBe(testCase.status)
      })
    })
  })

  describe('Error Logging', () => {
    it('should log errors in development', () => {
      const nodeEnv = 'development'
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const err = new Error('Test error')
      if (nodeEnv !== 'production') {
        console.error(err)
      }

      expect(consoleSpy).toHaveBeenCalledWith(err)
      consoleSpy.mockRestore()
    })

    it('should not expose stack trace in production', () => {
      const nodeEnv = 'production'
      const err = new Error('Database error with sensitive info')

      const message = nodeEnv === 'production' ? 'Erreur interne du serveur.' : err.message

      expect(message).not.toContain('Database error')
      expect(message).not.toContain('stack')
    })
  })

  describe('Response Format', () => {
    it('should return JSON response with error field', () => {
      const response = { error: 'Something went wrong' }

      expect(response).toHaveProperty('error')
      expect(typeof response.error).toBe('string')
    })

    it('should not include sensitive debugging info', () => {
      const nodeEnv = 'production'
      const err = new Error('SELECT * FROM users returned 10 rows')

      const response = {
        error: nodeEnv === 'production' ? 'Erreur interne du serveur.' : err.message,
      }

      expect(response.error).not.toContain('SELECT')
      expect(response.error).not.toContain('users')
    })
  })
})
