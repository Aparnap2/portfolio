// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.GOOGLE_API_KEY = 'test-google-api-key'
process.env.GEMINI_MODEL_NAME = 'gemini-2.5-flash'
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token'
process.env.HUBSPOT_ACCESS_TOKEN = 'test-hubspot-token'
process.env.QSTASH_V2_TOKEN = 'test-qstash-v2-token'
process.env.OLLAMA_BASE_URL = 'http://localhost:11434'
process.env.OLLAMA_MODEL = 'gemma3:1b'

// Mock fetch globally
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}