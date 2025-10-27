import { z } from 'zod';

// Enhanced base schemas with comprehensive validation
export const schemas = {
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .transform(val => val.toLowerCase().trim())
    .refine(email => {
      // Additional email validation
      const blockedDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
      const domain = email.split('@')[1];
      return !blockedDomains.some(blocked => domain?.includes(blocked));
    }, 'Please use a permanent email address'),
  
  sessionId: z.string()
    .min(1, 'Session ID is required')
    .max(100, 'Session ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Session ID contains invalid characters'),
  
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2000 characters')
    .transform(val => val.trim()),
  
  auditPhase: z.enum([
    'discovery', 'pain_points', 'qualification', 'contact_info',
    'email_request', 'ready_for_generation', 'processing',
    'complete', 'finished', 'completed'
  ]),
  
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[A-Za-z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .transform(val => val.trim())
    .refine(name => {
      // Block common fake names
      const blockedNames = ['test', 'admin', 'user', 'anonymous', 'null'];
      return !blockedNames.some(blocked => name.toLowerCase().includes(blocked));
    }, 'Please provide a real name'),
  
  company: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must be less than 200 characters')
    .transform(val => val.trim())
    .refine(company => {
      // Block common fake company names
      const blockedNames = ['test', 'company', 'business', 'corp', 'inc'];
      return !blockedNames.some(blocked => company.toLowerCase().includes(blocked));
    }, 'Please provide a real company name'),
  
  budget: z.string()
    .regex(
      /^\$?([1-9]\d{0,2}(,\d{3})*|\d+)(\.\d{2})?[kK]?$|^(\d+)\s*(thousand|million|k|m)?$/i,
      'Please enter a valid budget (e.g., $10,000, 50k, 100 thousand)'
    )
    .transform(val => {
      // Normalize budget format
      const cleaned = val.replace(/[$,\s]/g, '').toLowerCase();
      if (cleaned.endsWith('k')) return parseFloat(cleaned) * 1000;
      if (cleaned.endsWith('m')) return parseFloat(cleaned) * 1000000;
      return parseFloat(cleaned);
    })
    .refine(budget => budget >= 1000, 'Budget must be at least $1,000')
    .refine(budget => budget <= 10000000, 'Budget seems too high. Please contact us directly'),
  
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .transform(val => val.replace(/\s/g, ''))
    .refine(phone => phone.replace(/\D/g, '').length >= 10, 'Phone number must have at least 10 digits'),
  
  website: z.string()
    .url('Please enter a valid website URL')
    .refine(url => {
      try {
        const domain = new URL(url).hostname;
        return !domain.includes('localhost') && !domain.includes('127.0.0.1');
      } catch {
        return false;
      }
    }, 'Please provide a valid public website'),
  
  ipAddress: z.string()
    .ip('Invalid IP address format'),
  
  uuid: z.string()
    .uuid('Invalid UUID format'),
};

// Enhanced sanitization functions
export function sanitizeInput(input: string, options: {
  allowHTML?: boolean;
  maxLength?: number;
  preserveSpaces?: boolean;
} = {}): string {
  const { allowHTML = false, maxLength, preserveSpaces = true } = options;
  
  let sanitized = input;
  
  // Remove script tags and dangerous content
  if (!allowHTML) {
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '');
  }
  
  // Remove potentially dangerous characters
  sanitized = sanitized
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters
    .replace(/[\uFFF0-\uFFFF]/g, '') // Special Unicode characters
    .replace(/[<>]/g, allowHTML ? '' : ''); // Remove brackets if HTML not allowed
  
  // Handle spaces
  if (!preserveSpaces) {
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
  } else {
    sanitized = sanitized.trim();
  }
  
  // Apply length limit
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// Sanitize different data types
export function sanitizeData(data: any, options: {
  sanitizeStrings?: boolean;
  sanitizeObjects?: boolean;
  sanitizeArrays?: boolean;
} = {}): any {
  const { sanitizeStrings = true, sanitizeObjects = true, sanitizeArrays = true } = options;
  
  if (typeof data === 'string' && sanitizeStrings) {
    return sanitizeInput(data);
  }
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data) && sanitizeArrays) {
      return data.map(item => sanitizeData(item, options));
    }
    
    if (sanitizeObjects) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Sanitize object keys
        const sanitizedKey = sanitizeInput(key, { maxLength: 100, preserveSpaces: false });
        sanitized[sanitizedKey] = sanitizeData(value, options);
      }
      return sanitized;
    }
  }
  
  return data;
}

// Enhanced validation with sanitization
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const sanitized = sanitizeData(data);
  return schema.parse(sanitized);
}

// Enhanced validation result type
export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string[]>;
  warnings?: Record<string, string[]>;
  data?: any;
  sanitized?: any;
}

// Enhanced workflow validation with warnings
export function validateWorkflowData(step: string, data: any): ValidationResult {
  try {
    let validatedData;
    let warnings: Record<string, string[]> = {};
    
    switch (step) {
      case 'discovery':
        validatedData = workflowSchemas.discovery.parse(data);
        
        // Add business logic warnings
        if (validatedData.industry.toLowerCase().includes('consulting')) {
          warnings.industry = ['Consulting industries may have specific requirements'];
        }
        if (parseInt(validatedData.companySize) > 1000) {
          warnings.companySize = ['Large enterprises may need custom solutions'];
        }
        break;
        
      case 'pain_points':
        validatedData = workflowSchemas.painPoints.parse(data);
        
        // Add business logic warnings
        if (validatedData.budget < 10000) {
          warnings.budget = ['Low budget may limit solution options'];
        }
        if (validatedData.timeline.toLowerCase().includes('asap')) {
          warnings.timeline = ['Rush timelines may require premium services'];
        }
        break;
        
      case 'contact_info':
        validatedData = workflowSchemas.contactInfo.parse(data);
        break;
        
      default:
        return { valid: false, errors: { general: ['Invalid workflow step'] } };
    }
    
    return {
      valid: true,
      data: validatedData,
      sanitized: sanitizeData(validatedData),
      warnings: Object.keys(warnings).length > 0 ? warnings : undefined
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach(err => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return { valid: false, errors: fieldErrors };
    }
    return { valid: false, errors: { general: ['Validation failed'] } };
  }
}

// Enhanced form field validation with detailed feedback
export function validateField(schema: z.ZodSchema, value: unknown): {
  valid: boolean;
  error?: string;
  warning?: string;
  sanitized?: any;
  errorCode?: string;
} {
  try {
    const sanitized = sanitizeData(value);
    schema.parse(sanitized);
    return { valid: true, sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        valid: false,
        error: firstError?.message || 'Invalid input',
        errorCode: firstError?.code
      };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

// Enhanced API schemas with comprehensive validation
export const apiSchemas = {
  startAudit: z.object({
    email: schemas.email,
    ipAddress: schemas.ipAddress.optional(),
    userAgent: z.string().max(500).optional(),
    referrer: z.string().max(500).optional(),
  }),
  
  submitMessage: z.object({
    sessionId: schemas.sessionId,
    message: schemas.message,
    timestamp: z.string().datetime().optional(),
  }),
  
  sendReport: z.object({
    sessionId: schemas.sessionId,
    email: schemas.email,
    format: z.enum(['pdf', 'html', 'json']).default('pdf'),
    includeRecommendations: z.boolean().default(true),
  }),
  
  updateSession: z.object({
    sessionId: schemas.sessionId,
    data: z.record(z.any()),
    lastActivity: z.string().datetime().optional(),
  }),
};

// Enhanced workflow data validation schemas
export const workflowSchemas = {
  discovery: z.object({
    industry: z.string()
      .min(2, 'Industry must be at least 2 characters')
      .max(100, 'Industry too long')
      .refine(industry => {
        const validIndustries = [
          'technology', 'healthcare', 'finance', 'retail', 'manufacturing',
          'education', 'government', 'nonprofit', 'consulting', 'other'
        ];
        return validIndustries.some(valid =>
          industry.toLowerCase().includes(valid)
        );
      }, 'Please specify a valid industry'),
    
    companySize: z.string()
      .min(1, 'Company size is required')
      .max(50, 'Company size description too long')
      .refine(size => {
        const validSizes = ['1-10', '11-50', '51-200', '201-500', '500+'];
        return validSizes.some(valid =>
          size.toLowerCase().includes(valid) ||
          /\d+/.test(size)
        );
      }, 'Please specify a valid company size'),
    
    acquisitionFlow: z.string()
      .min(5, 'Please provide more details')
      .max(500, 'Description too long')
      .refine(text => {
        const keywords = ['process', 'workflow', 'system', 'manual', 'automated'];
        return keywords.some(keyword =>
          text.toLowerCase().includes(keyword)
        );
      }, 'Please describe your current acquisition process'),
    
    deliveryFlow: z.string()
      .min(5, 'Please provide more details')
      .max(500, 'Description too long')
      .refine(text => {
        const keywords = ['delivery', 'fulfillment', 'service', 'product', 'customer'];
        return keywords.some(keyword =>
          text.toLowerCase().includes(keyword)
        );
      }, 'Please describe your delivery process'),
  }),
  
  painPoints: z.object({
    manualTasks: z.string()
      .min(5, 'Please provide more details')
      .max(500, 'Description too long')
      .refine(text => {
        const keywords = ['manual', 'hand', 'repeat', 'time-consuming'];
        return keywords.some(keyword =>
          text.toLowerCase().includes(keyword)
        );
      }, 'Please describe manual tasks you perform'),
    
    bottlenecks: z.string()
      .min(5, 'Please provide more details')
      .max(500, 'Description too long')
      .refine(text => {
        const keywords = ['bottleneck', 'slow', 'delay', 'wait', 'queue'];
        return keywords.some(keyword =>
          text.toLowerCase().includes(keyword)
        );
      }, 'Please describe specific bottlenecks'),
    
    dataSilos: z.string()
      .min(5, 'Please provide more details')
      .max(500, 'Description too long')
      .refine(text => {
        const keywords = ['silo', 'separate', 'disconnected', 'isolated', 'data'];
        return keywords.some(keyword =>
          text.toLowerCase().includes(keyword)
        );
      }, 'Please describe data connectivity issues'),
    
    budget: schemas.budget,
    
    timeline: z.string()
      .min(3, 'Timeline too short')
      .max(100, 'Timeline description too long')
      .refine(text => {
        const timeUnits = ['week', 'month', 'quarter', 'year', 'asap', 'immediate'];
        return timeUnits.some(unit =>
          text.toLowerCase().includes(unit)
        );
      }, 'Please specify a realistic timeline'),
    
    userRole: z.string()
      .min(2, 'Role must be at least 2 characters')
      .max(100, 'Role description too long')
      .refine(role => {
        const validRoles = [
          'ceo', 'cto', 'manager', 'director', 'owner', 'lead',
          'coordinator', 'administrator', 'specialist', 'analyst'
        ];
        return validRoles.some(valid =>
          role.toLowerCase().includes(valid)
        );
      }, 'Please specify your role in the company'),
  }),
  
  contactInfo: z.object({
    name: schemas.name,
    email: schemas.email,
    company: schemas.company.optional(),
    phone: schemas.phone.optional(),
    website: schemas.website.optional(),
    jobTitle: z.string()
      .min(2, 'Job title must be at least 2 characters')
      .max(100, 'Job title too long')
      .optional(),
  }),
};

// Enhanced form validation utilities with real-time feedback
export const formValidation = {
  validateEmailField: (email: string) => validateField(schemas.email, email),
  validateNameField: (name: string) => validateField(schemas.name, name),
  validateCompanyField: (company: string) => validateField(schemas.company, company),
  validateBudgetField: (budget: string) => validateField(schemas.budget, budget),
  validateMessageField: (message: string) => validateField(schemas.message, message),
  validatePhoneField: (phone: string) => validateField(schemas.phone, phone),
  validateWebsiteField: (website: string) => validateField(schemas.website, website),
  
  // Real-time validation with debouncing
  createValidator: (schema: z.ZodSchema, debounceMs = 300) => {
    let timeout: NodeJS.Timeout;
    
    return (value: string, callback: (result: ReturnType<typeof validateField>) => void) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        callback(validateField(schema, value));
      }, debounceMs);
    };
  },
};

// Security validation utilities
export const securityValidation = {
  // Check for potential SQL injection
  detectSQLInjection: (input: string): boolean => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\*|;|'|\"|\/\*|\*\/|xp_|sp_)/i,
      /(\bOR\b.*=.*\bOR\b)|(\bAND\b.*=.*\bAND\b)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  },
  
  // Check for XSS attempts
  detectXSS: (input: string): boolean => {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  },
  
  // Check for suspicious patterns
  detectSuspiciousContent: (input: string): boolean => {
    const suspiciousPatterns = [
      /\b(admin|root|password|test|debug)\b/gi,
      /\.\./g, // Directory traversal
      /[<>]/g, // HTML tags
      /[\x00-\x1F\x7F]/g // Control characters
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(input));
  },
  
  // Comprehensive security check
  validateInput: (input: string): {
    safe: boolean;
    risks: string[];
    sanitized: string;
  } => {
    const risks: string[] = [];
    
    if (securityValidation.detectSQLInjection(input)) {
      risks.push('SQL injection detected');
    }
    
    if (securityValidation.detectXSS(input)) {
      risks.push('XSS attempt detected');
    }
    
    if (securityValidation.detectSuspiciousContent(input)) {
      risks.push('Suspicious content detected');
    }
    
    return {
      safe: risks.length === 0,
      risks,
      sanitized: sanitizeInput(input)
    };
  }
};