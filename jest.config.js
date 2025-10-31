module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@sentry/nextjs$': '<rootDir>/__mocks__/@sentry/nextjs.js',
    'react-markdown': '<rootDir>/__mocks__/react-markdown.js',
    'discord.js': '<rootDir>/__mocks__/discord.js',
    'nanoid': '<rootDir>/__mocks__/nanoid.js',
    'server-only': '<rootDir>/__mocks__/server-only.js',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.(spec|test).{ts,tsx,js,jsx}',
    '<rootDir>/**/__tests__/**/*.(spec|test).{ts,tsx,js,jsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/cypress/',
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
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|remark-gfm|rehype-raw|vfile|unist-util-stringify-position|unified|bail|is-plain-obj|decode-named-character-reference|remark-parse|mdast-util-from-markdown|micromark|micromark-util-decode-numeric-character-reference|micromark-util-resolve-all|micromark-util-chunked|micromark-util-combine-extensions|micromark-util-encode|micromark-util-html-tag-name|micromark-util-normalize-identifier|micromark-util-symbol|micromark-util-types|parse-entities|character-entities|property-information|space-separated-tokens|comma-separated-tokens|web-namespaces|zwitch|html-void-elements|nanoid|@langchain|@prisma)/)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/cypress/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
