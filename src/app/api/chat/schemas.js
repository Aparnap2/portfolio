import { z } from "zod";

// Base message schema with enhanced validation
export const MessageSchema = z.object({
  role: z.enum(["user", "assistant"], {
    errorMap: () => ({ message: "Message role must be either 'user' or 'assistant'" })
  }),
  content: z.string()
    .trim()
    .min(1, "Message content cannot be empty")
    .max(8000, "Message content exceeds maximum length of 8000 characters")
    .transform(val => val.replace(/[\x00-\x1F\x7F]/g, "")), // Remove control characters
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(), // For future extensibility
});

// Enhanced chat request schema with comprehensive validation
export const ChatRequestSchema = z.object({
  sessionId: z.string()
    .uuid("Invalid session ID format")
    .optional()
    .or(z.string().min(1, "Session ID must be a non-empty string")),
  messages: z.array(MessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Cannot process more than 50 messages at once"),
  userAgent: z.string().max(500, "User agent string too long").optional(),
  referer: z.string().url("Invalid referer URL format").optional().or(z.literal("")),
  stream: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

// Enhanced session schema with TTL handling and validation
export const SessionSchema = z.object({
  chat_history: z.array(MessageSchema).default([]),
  topics_discussed: z.array(z.string().max(50, "Topic name too long")).default([]),
  user_context: z.record(z.any()).default({}),
  conversation_stage: z
    .enum(["initial", "business_understanding", "solution_exploration", "lead_capture"], {
      errorMap: () => ({ message: "Invalid conversation stage" })
    })
    .default("initial"),
  last_intent: z.string().max(100, "Intent string too long").nullish(),
  user_profile: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    company: z.string().optional(),
    preferences: z.record(z.any()).optional()
  }).optional(),
  _last_proactive_at: z.number().nullish(),
  _last_activity: z.number().default(() => Date.now()),
  _created_at: z.number().default(() => Date.now()),
  _expires_at: z.number().optional(), // For explicit TTL handling
  _version: z.number().default(1),
  _metadata: z.record(z.any()).optional(),
});

// Comprehensive lead extraction schema with validation
export const LeadExtractionSchema = z.object({
  name: z.string().nullable().refine(val => {
    if (val === null) return true;
    return val.trim().length > 0 && val.length <= 100;
  }, { message: "Name must be between 1 and 100 characters" }),
  email: z.string().email("Invalid email format").nullable(),
  company: z.string().max(100, "Company name too long").nullable().optional(),
  phone: z.string().regex(/^[+]?[\d\s\-\(\)]+$/, "Invalid phone number format").nullable().optional(),
  industry: z.string().max(50, "Industry name too long").nullable().optional(),
  requirements: z.string().max(1000, "Requirements description too long").nullable().optional(),
  budget: z.string().max(50, "Budget range too long").nullable().optional(),
  timeline: z.string().max(50, "Timeline description too long").nullable().optional(),
  company_size: z.string().max(50, "Company size description too long").nullable().optional(),
  current_challenges: z.string().max(1000, "Challenges description too long").nullable().optional(),
  conversation_summary: z.string().max(500, "Summary too long").nullable().optional(),
  lead_score: z.number().int().min(0, "Lead score must be at least 0").max(100, "Lead score cannot exceed 100"),
  capture_ready: z.boolean(),
  source: z.string().max(50, "Source identifier too long").optional(),
  _extracted_at: z.number().default(() => Date.now()),
  _validated: z.boolean().default(false),
});

// Comprehensive environment variables schema
export const EnvSchema = z.object({
  // Google AI Configuration
  GOOGLE_API_KEY: z.string().min(10, "Google API key must be at least 10 characters").optional(),
  GEMINI_MODEL_NAME: z.string().default("gemini-2.5-flash").optional(),
  HISTORY_MODEL_NAME: z.string().default("gemini-2.5-flash-lite").optional(),
  
  // Redis Configuration
  UPSTASH_REDIS_REST_URL: z.string().url("Invalid Redis URL format"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(10, "Redis token must be at least 10 characters"),
  
  // HubSpot Configuration
  HUBSPOT_ACCESS_TOKEN: z.string().min(20, "HubSpot access token must be at least 20 characters").optional(),
  HUBSPOT_CLIENT_SECRET: z.string().min(10, "HubSpot client secret must be at least 10 characters").optional(),
  
  // QStash Configuration
  QSTASH_V2_TOKEN: z.string().min(10, "QStash v2 token must be at least 10 characters").optional(),
  QSTASH_TOKEN: z.string().min(10, "QStash token must be at least 10 characters").optional(), // Legacy support
  QSTASH_URL: z.string().url("Invalid QStash URL format").optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(10, "QStash signing key must be at least 10 characters").optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(10, "QStash signing key must be at least 10 characters").optional(),
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: z.string().url("Invalid app URL format").optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MAX_CHAT_HISTORY: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default("10"),
  
  // Ollama Configuration (for local testing)
  OLLAMA_BASE_URL: z.string().optional(),
  OLLAMA_URL: z.string().optional(),
  OLLAMA_MODEL: z.string().optional(),
  
  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default("60000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default("20"),
  CONCURRENT_STREAMS_LIMIT: z.string().transform(Number).pipe(z.number().int().positive()).default("1"),
  
  // Discord Configuration
  DISCORD_WEBHOOK_URL: z.string().url("Invalid Discord webhook URL format").optional(),
  DISCORD_BOT_TOKEN: z.string().min(10, "Discord bot token must be at least 10 characters").optional(),
  DISCORD_SERVER_ID: z.string().optional(),
  DISCORD_CHANNEL_ID: z.string().optional(),
  DISCORD_APP_ID: z.string().optional(),
  DISCORD_PUBLIC_KEY: z.string().optional(),
  
  // Slack Configuration (optional)
  SLACK_WEBHOOK_URL: z.string().url("Invalid Slack webhook URL format").optional(),
  SLACK_WEBHOOK_SECRET: z.string().min(10, "Slack webhook secret must be at least 10 characters").optional(),
  SLACK_LEADS_CHANNEL_ID: z.string().optional(),
});

// Enhanced rate limiting schema
export const RateLimitSchema = z.object({
  ip: z.string().min(1, "IP address is required").regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Invalid IP address format"),
  window: z.number().int().positive("Window must be a positive integer"),
  limit: z.number().int().positive("Limit must be a positive integer"),
  identifier: z.string().optional(), // Additional identifier for rate limiting
});

// Enhanced proactive trigger schema
export const ProactiveTriggerSchema = z.object({
  stage: z.enum(["initial", "business_understanding", "solution_exploration", "lead_capture"], {
    errorMap: () => ({ message: "Invalid conversation stage for proactive trigger" })
  }),
  last_intent: z.string().max(100, "Intent string too long").optional(),
  turns_since_proactive: z.number().int().min(0, "Turns since proactive must be non-negative"),
  user_token_count: z.number().int().min(0, "User token count must be non-negative").optional(),
  should_trigger: z.boolean(),
  confidence: z.number().min(0, "Confidence must be at least 0").max(1, "Confidence cannot exceed 1"),
  trigger_reason: z.string().optional(),
  cooldown_remaining: z.number().optional(),
});

// Additional schemas for comprehensive validation

// Stream response schema
export const StreamResponseSchema = z.object({
  content: z.string(),
  metadata: z.object({
    confidence: z.number().min(0).max(1),
    intent: z.string(),
    topics: z.array(z.string()),
    proactive: z.boolean().optional(),
    stage: z.string().optional(),
  }).optional(),
  chunk: z.boolean().optional(),
  tool_call: z.boolean().optional(),
  lead_captured: z.boolean().optional(),
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.boolean(),
  message: z.string(),
  retryable: z.boolean().optional(),
  errorId: z.string().uuid(),
  details: z.record(z.any()).optional(),
});

// Task schema for QStash
export const TaskSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  data: z.record(z.any()),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  delay: z.number().optional(),
  retries: z.number().int().min(0).max(5).default(3),
  created_at: z.number().default(() => Date.now()),
});

// Notification schema
export const NotificationSchema = z.object({
  type: z.string(),
  message: z.string(),
  urgency: z.enum(["low", "normal", "high", "immediate"]).default("normal"),
  channels: z.array(z.enum(["discord", "slack", "email"])).default(["discord"]),
  data: z.record(z.any()).optional(),
  timestamp: z.number().default(() => Date.now()),
});

// Health check response schema
export const HealthCheckSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  service: z.string(),
  timestamp: z.string().datetime(),
  version: z.string().optional(),
  dependencies: z.record(z.boolean()).optional(),
});

// Type exports for TypeScript compatibility
export const MessageTypes = MessageSchema;
export const ChatRequestTypes = ChatRequestSchema;
export const SessionTypes = SessionSchema;
export const LeadExtractionTypes = LeadExtractionSchema;
export const EnvTypes = EnvSchema;
export const RateLimitTypes = RateLimitSchema;
export const ProactiveTriggerTypes = ProactiveTriggerSchema;
export const StreamResponseTypes = StreamResponseSchema;
export const ErrorTypes = ErrorResponseSchema;
export const TaskTypes = TaskSchema;
export const NotificationTypes = NotificationSchema;
export const HealthCheckTypes = HealthCheckSchema;
