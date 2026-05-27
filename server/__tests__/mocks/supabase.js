// Mock Supabase client pour les tests d'intégration
const mockUser = {
  id: 'user-uuid-123',
  email: 'user@test.com',
}

const mockAdmin = {
  id: 'admin-uuid-456',
  email: 'admin@test.com',
  app_metadata: { role: 'admin' },
}

const mockVehicle = {
  id: 'vehicle-uuid-789',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2022,
  price: 25000,
  fuel_type: 'essence',
  transmission: 'automatique',
  mileage: 15000,
  status: 'available',
  created_at: new Date().toISOString(),
}

// Builders chaînables qui imitent l'API Supabase
function buildQuery(result) {
  const q = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    then: undefined,
  }
  // Rendre la query elle-même awaitable
  Object.assign(q, Promise.resolve(result))
  q[Symbol.toStringTag] = 'Promise'
  q.then = (fn) => Promise.resolve(result).then(fn)
  return q
}

const supabaseMock = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  _mockUser: mockUser,
  _mockAdmin: mockAdmin,
  _mockVehicle: mockVehicle,
}

module.exports = { supabaseMock, mockUser, mockAdmin, mockVehicle }
