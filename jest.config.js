module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.(spec|test).{ts,tsx,js,jsx}',
    '<rootDir>/**/__tests__/**/*.(spec|test).{ts,tsx,js,jsx}',
  ],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'stores/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!app/**/_*.{ts,tsx}', // Exclude special Next.js files
    '!app/**/layout.{ts,tsx}',
    '!app/**/page.{ts,tsx}',
    '!components/ui/**/*.{ts,tsx}', // Exclude UI components from external libraries
    '!**/node_modules/**',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/cypress/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};