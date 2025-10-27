import 'server-only';

import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// Enhanced environment schema with comprehensive validation
const baseEnvSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Database
  DATABASE_URL: z.string().url('Invalid database URL format'),
  DATABASE_POOL_MIN: z.string().transform(Number).default('2'),
  DATABASE_POOL_MAX: z.string().transform(Number).default('10'),
  
  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Redis URL format'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Redis token is required'),
  REDIS_TTL: z.string().transform(Number).default('86400'), // 24 hours
  
  // AI/ML Services
  GOOGLE_API_KEY: z.string().min(1, 'Google AI API key is required'),
  GEMINI_MODEL_NAME: z.string().default('gemini-2.0-flash-exp'),
  AI_MAX_TOKENS: z.string().transform(Number).default('4000'),
  AI_TEMPERATURE: z.string().transform(Number).default('0.7'),
  
  // Authentication
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_ACCESS_TOKEN: z.string().optional(),
  
  // Integrations
  HUBSPOT_ACCESS_TOKEN: z.string().optional(),
  HUBSPOT_CLIENT_SECRET: z.string().optional(),
  DISCORD_TOKEN: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_SERVER_ID: z.string().optional(),
  DISCORD_CHANNEL_ID: z.string().optional(),
  DISCORD_APP_ID: z.string().optional(),
  DISCORD_PUBLIC_KEY: z.string().optional(),
  
  // Monitoring & Observability
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('true'),
  
  // Security & Rate Limiting
  RATE_LIMIT_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'), // 15 minutes
  CORS_ORIGINS: z.string().transform(val => val.split(',')).default('*'),
  ENABLE_CSP: z.string().transform(val => val === 'true').default('true'),
  
  // Performance
  CACHE_TTL: z.string().transform(Number).default('3600'), // 1 hour
  SESSION_TIMEOUT: z.string().transform(Number).default('86400'), // 24 hours
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  
  // Feature Flags
  ENABLE_DISCORD_BOT: z.string().transform(val => val === 'true').default('false'),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('true'),
});

// Environment-specific schemas
const developmentSchema = baseEnvSchema.extend({
  // Development-specific overrides
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('debug'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('false'),
});

const productionSchema = baseEnvSchema.extend({
  // Production-specific requirements
  SENTRY_DSN: z.string().min(1, 'Sentry DSN is required in production'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('warn'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('true'),
  // Require HTTPS in production
  NEXT_PUBLIC_APP_URL: z.string().url().refine(url => url.startsWith('https://'), {
    message: 'App URL must use HTTPS in production'
  }),
});

const testSchema = baseEnvSchema.extend({
  // Test-specific overrides
  DATABASE_URL: z.string().url().default('postgresql://test:test@localhost:5432/test'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('error'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('false'),
});

// Environment validation with detailed error reporting
function validateEnv() {
  try {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    let schema: z.ZodObject<any>;
    switch (nodeEnv) {
      case 'production':
        schema = productionSchema;
        break;
      case 'test':
        schema = testSchema;
        break;
      default:
        schema = developmentSchema;
    }

    const env = schema.parse(process.env);
    
    // Validate critical dependencies
    validateCriticalDependencies(env);
    
    // Log successful validation (without sensitive data)
    console.log(`✅ Environment validated for ${nodeEnv}`);
    console.log(`📊 Metrics: ${env.ENABLE_METRICS}, Error Reporting: ${env.ENABLE_ERROR_REPORTING}`);
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Unexpected environment validation error:', error);
    }
    
    // Report to Sentry if available
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: { validation: 'environment' },
        extra: { nodeEnv: process.env.NODE_ENV }
      });
    }
    
    if (typeof process.exit === 'function') {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

// Validate critical service dependencies
function validateCriticalDependencies(env: any) {
  const errors: string[] = [];
  
  // Database connectivity check would go here in a real implementation
  // For now, just validate URL format
  try {
    new URL(env.DATABASE_URL);
  } catch {
    errors.push('Invalid DATABASE_URL format');
  }
  
  // Redis connectivity check
  try {
    new URL(env.UPSTASH_REDIS_REST_URL);
  } catch {
    errors.push('Invalid UPSTASH_REDIS_REST_URL format');
  }
  
  // Required API keys
  if (!env.GOOGLE_API_KEY) {
    errors.push('GOOGLE_API_KEY is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Critical dependency validation failed:\n${errors.join('\n')}`);
  }
}

// Export validated configuration
export const config = validateEnv();

// Environment helpers
export const isDev = config.NODE_ENV === 'development';
export const isProd = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Configuration helpers for different environments
export const getDatabaseConfig = () => ({
  url: config.DATABASE_URL,
  pool: {
    min: config.DATABASE_POOL_MIN,
    max: config.DATABASE_POOL_MAX,
  },
});

export const getRedisConfig = () => ({
  url: config.UPSTASH_REDIS_REST_URL,
  token: config.UPSTASH_REDIS_REST_TOKEN,
  ttl: config.REDIS_TTL,
});

export const getAIConfig = () => ({
  apiKey: config.GOOGLE_API_KEY,
  model: config.GEMINI_MODEL_NAME,
  maxTokens: config.AI_MAX_TOKENS,
  temperature: config.AI_TEMPERATURE,
});

export const getRateLimitConfig = () => ({
  requests: config.RATE_LIMIT_REQUESTS,
  window: config.RATE_LIMIT_WINDOW,
});

export const getSecurityConfig = () => ({
  corsOrigins: config.CORS_ORIGINS,
  enableCSP: config.ENABLE_CSP,
  maxFileSize: config.MAX_FILE_SIZE,
});

export const getFeatureFlags = () => ({
  discordBot: config.ENABLE_DISCORD_BOT,
  emailNotifications: config.ENABLE_EMAIL_NOTIFICATIONS,
  analytics: config.ENABLE_ANALYTICS,
  metrics: config.ENABLE_METRICS,
  errorReporting: config.ENABLE_ERROR_REPORTING,
});

// Secrets management utilities
export const secrets = {
  // Get secret with fallback
  get: (key: string, fallback?: string): string | undefined => {
    return (config as any)[key] || fallback;
  },
  
  // Check if secret exists
  has: (key: string): boolean => {
    return !!(config as any)[key];
  },
  
  // Get all secret keys (without values)
  keys: (): string[] => {
    return Object.keys(config).filter(key =>
      key.includes('TOKEN') ||
      key.includes('SECRET') ||
      key.includes('KEY') ||
      key.includes('PASSWORD')
    );
  },
};

// Runtime configuration validation
export const validateRuntimeConfig = () => {
  const issues: string[] = [];
  
  // Check for common misconfigurations
  if (isProd && config.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
    issues.push('Production app URL should not be localhost');
  }
  
  if (isProd && !config.SENTRY_DSN) {
    issues.push('Sentry DSN should be configured in production');
  }
  
  if (config.ENABLE_DISCORD_BOT && !config.DISCORD_TOKEN) {
    issues.push('Discord bot is enabled but DISCORD_TOKEN is missing');
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ Runtime configuration issues:');
    issues.forEach(issue => console.warn(`  - ${issue}`));
  }
  
  return issues.length === 0;
};

// Initialize runtime validation
validateRuntimeConfig();