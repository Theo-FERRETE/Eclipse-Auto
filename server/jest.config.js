module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  // Verrouille la couverture acquise : la CI échoue si elle régresse.
  // Seuils placés juste sous les valeurs actuelles (92.75 / 79.83 / 98.7 / 97.74).
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 78,
      functions: 95,
      lines: 95,
    },
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  testTimeout: 10000,
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
}

