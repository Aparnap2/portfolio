import * as Sentry from "@sentry/nextjs";

export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = statusCode < 500;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends APIError {
  public details: any;

  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class DatabaseError extends APIError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, "DATABASE_ERROR");
    if (originalError) {
      this.cause = originalError;
    }
  }
}

export class ExternalServiceError extends APIError {
  public service: string;
  public originalError?: Error;

  constructor(service: string, message: string, originalError?: Error) {
    super(`${service} error: ${message}`, 502, "EXTERNAL_SERVICE_ERROR");
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * Handle API errors consistently across all routes
 */
export function handleAPIError(error: unknown): {
  success: false;
  error: string;
  code?: string;
  details?: any;
} {
  // Log to Sentry for non-operational errors
  if (!(error instanceof APIError) || !error.isOperational) {
    Sentry.captureException(error, {
      tags: {
        error_type: "api_error",
        is_operational: false,
      },
    });
  }

  if (error instanceof APIError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      ...(error instanceof ValidationError && { details: error.details }),
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    };
  }

  return {
    success: false,
    error: "An unknown error occurred",
    code: "UNKNOWN_ERROR",
  };
}

/**
 * Wrap async route handlers with error handling
 */
export function withErrorHandler(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error("[API] Error:", error);
      
      const errorResponse = handleAPIError(error);
      
      // Determine status code
      let statusCode = 500;
      if (error instanceof APIError) {
        statusCode = error.statusCode;
      }

      return new Response(JSON.stringify(errorResponse), {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  };
}

/**
 * Validate request body against a schema
 */
export function validateBody<T>(body: any, schema: {
  [K in keyof T]: {
    required?: boolean;
    type?: string;
    validate?: (value: any) => boolean;
  };
}): T {
  const result: any = {};
  const errors: string[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = body[key];
    const ruleSet = rules as any;

    // Check required fields
    if (ruleSet.required && (value === undefined || value === null || value === "")) {
      errors.push(`${key} is required`);
      continue;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined && !ruleSet.required) {
      continue;
    }

    // Type validation
    if (ruleSet.type && typeof value !== ruleSet.type) {
      errors.push(`${key} must be of type ${ruleSet.type}`);
      continue;
    }

    // Custom validation
    if (ruleSet.validate && !ruleSet.validate(value)) {
      errors.push(`${key} is invalid`);
      continue;
    }

    result[key] = value;
  }

  if (errors.length > 0) {
    throw new ValidationError("Validation failed", errors);
  }

  return result as T;
}

/**
 * Rate limiting helper
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): void {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // New window or expired window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  if (record.count >= limit) {
    throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`);
  }

  record.count++;
}

/**
 * Cleanup expired rate limit records
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

/**
 * Security headers helper
 */
export function getSecurityHeaders(): HeadersInit {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

/**
 * CORS helper for API routes
 */
export function handleCORS(req: Request): Response | null {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_BASE_URL,
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter(Boolean);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    const headers: HeadersInit = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      ...getSecurityHeaders(),
    };

    if (allowedOrigins.includes(origin || "")) {
      (headers as Record<string, string>)["Access-Control-Allow-Origin"] = origin!;
    }

    return new Response(null, { status: 200, headers });
  }

  // Add CORS headers to actual requests
  if (allowedOrigins.includes(origin || "")) {
    return null; // Continue with the actual request
  }

  return new Response(JSON.stringify({ error: "CORS policy violation" }), {
    status: 403,
    headers: {
      "Content-Type": "application/json",
      ...getSecurityHeaders(),
    },
  });
}