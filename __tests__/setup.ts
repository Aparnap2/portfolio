// __tests__/setup.ts
import '@testing-library/jest-dom';
import 'react-dom/test-utils';
import React from 'react';
import { config } from 'dotenv';
import path from 'path';

const loadenv = () => {
  config({ path: path.join(process.cwd(), '.env') });
};

const ensureEnv = (key: string, fallback: string) => {
  if (!process.env[key]) {
    process.env[key] = fallback;
  }
};

loadenv();

// Mock environment variables (NODE_ENV is set by Jest automatically)
ensureEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
ensureEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://test@sentry.io/123456');
ensureEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'GA-TEST123');

// Required environment variables for tests
ensureEnv('GOOGLE_API_KEY', 'test-google-api-key');
ensureEnv('DISCORD_WEBHOOK_URL', 'https://discord.com/api/webhooks/test/webhook');
ensureEnv('HUBSPOT_ACCESS_TOKEN', 'test-hubspot-token');
ensureEnv('REDIS_URL', 'redis://localhost:6379');
ensureEnv('UPSTASH_REDIS_REST_URL', 'redis://localhost:6379');
ensureEnv('UPSTASH_REDIS_REST_TOKEN', 'test-upstash-redis-token');
ensureEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/testdb');
ensureEnv('SENTRY_AUTH_TOKEN', 'test-sentry-auth-token');
ensureEnv('DISCORD_BOT_TOKEN', 'test-discord-bot-token');
ensureEnv('DISCORD_CLIENT_ID', 'test-discord-client-id');
ensureEnv('DISCORD_GUILD_ID', 'test-discord-guild-id');
ensureEnv('NEXTAUTH_SECRET', 'test-nextauth-secret');
ensureEnv('NEXTAUTH_URL', 'http://localhost:3000');
ensureEnv('EMAIL_FROM', 'test@example.com');
ensureEnv('EMAIL_SERVER_HOST', 'smtp.example.com');
ensureEnv('EMAIL_SERVER_PORT', '587');
ensureEnv('EMAIL_SERVER_USER', 'test@example.com');
ensureEnv('EMAIL_SERVER_PASSWORD', 'test-email-password');
ensureEnv('UNSPLASH_ACCESS_KEY', 'test-unsplash-key');
ensureEnv('RESEND_API_KEY', 'test-resend-key');

// Provide TextEncoder/TextDecoder for LangChain
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Provide ReadableStream for LangChain
if (typeof ReadableStream === 'undefined') {
  global.ReadableStream = require('stream').Readable;
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock DOM APIs that might not be available in test environment
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock toast provider
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toasts: [],
    toast: jest.fn(),
    dismiss: jest.fn(),
  })),
}));

// Mock toast provider component
jest.mock('@/components/ui/toast-provider', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: jest.fn(() => ({
    toasts: [],
    addToast: jest.fn(),
    removeToast: jest.fn(),
    clearToasts: jest.fn(),
  })),
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock useEmailCapture hook
jest.mock('@/hooks/useEmailCapture', () => ({
  useEmailCapture: jest.fn(() => ({
    captured: false,
    emailValue: '',
    setEmailValue: jest.fn(),
    isSending: false,
    error: null,
    emailSent: false,
    captureEmail: jest.fn(),
    sendReport: jest.fn(),
  })),
}));

// Mock framer-motion with proper JSX
jest.mock('framer-motion', () => {
  const React = require('react');
  
  return {
    motion: {
      div: React.forwardRef(({ children, layout, ...props }: any, ref: any) => {
        // Filter out framer-motion specific props
        const { layout: _, ...filteredProps } = { layout, ...props };
        return React.createElement('div', { ...filteredProps, ref }, children);
      }),
    },
    AnimatePresence: ({ children }: any) => {
      return React.createElement(React.Fragment, {}, children);
    },
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js API route globals
(global as any).Request = class MockRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  
  constructor(url: string, options: any = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = options.headers || {};
    this.body = options.body;
  }
  
  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }
};

(global as any).Response = class MockResponse {
  body: any;
  status: number;
  headers: Record<string, string>;
  
  constructor(body: any, options: any = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = options.headers || {};
  }
  
  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }

  static json(body: any, options: any = {}) {
    return new MockResponse(JSON.stringify(body), {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
  }
};

(global as any).NextRequest = (global as any).Request;
(global as any).NextResponse = {
  json: (body: any, options: any = {}) => new (global as any).Response(JSON.stringify(body), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  }),
  redirect: (url: string, options: any = {}) => new (global as any).Response(null, {
    ...options,
    status: 302,
    headers: { Location: url, ...options.headers }
  }),
  next: () => new (global as any).Response(null, { status: 200 }),
  error: (message: string, options: any = {}) => new (global as any).Response(JSON.stringify({ error: message }), {
    ...options,
    status: 500,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  }),
  rewrite: (destination: string, options: any = {}) => new (global as any).Response(null, {
    ...options,
    status: 307,
    headers: { Location: destination, ...options.headers }
  }),
};