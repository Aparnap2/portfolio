export const runtime = "nodejs";

import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Redis } from "@upstash/redis";
import { UpstashRedisCache } from "@langchain/community/caches/upstash_redis";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import CircuitBreaker from "../../../lib/circuit_breaker.js";
import { captureLeadToHubSpot } from "../../../lib/hubspot_client.js";
import { createLeadProcessingTask } from "../../../lib/qstash_client.js";
import {
  ChatRequestSchema,
  SessionSchema,
  LeadExtractionSchema,
  EnvSchema,
  MessageSchema,
  ErrorResponseSchema,
  RateLimitSchema
} from "./schemas.js";

class ChatbotError extends Error {
  constructor(message, type = 'GENERIC', retryable = false, userMessage = null) {
    super(message);
    this.type = type;
    this.retryable = retryable;
    this.userMessage = userMessage || 'Sorry, I encountered an issue. Please try again.';
    this.timestamp = new Date().toISOString();
  }
}

const ERROR_TYPES = {
  RATE_LIMIT: 'RATE_LIMIT',
  MODEL_TIMEOUT: 'MODEL_TIMEOUT',
  LEAD_CAPTURE_FAILED: 'LEAD_CAPTURE_FAILED',
  INVALID_INPUT: 'INVALID_INPUT'
};

function handleChatbotError(error, context) {
  console.error('Chatbot error:', {
    error: error.message,
    type: error.type,
    context: context,
    timestamp: error.timestamp,
    retryable: error.retryable
  });

  return {
    error: true,
    message: error.userMessage,
    retryable: error.retryable,
    errorId: uuidv4()
  };
}

const CONFIG = {
  GEMINI_MODEL: process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash",
  MAX_HISTORY: +(process.env.MAX_CHAT_HISTORY || 10),
  MAX_TOKENS: 2500,
  TEMPERATURE: 0.1,
  PROACTIVE_COOLDOWN_MS: 90_000,
  RATE_LIMIT_WINDOW_MS: +(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  RATE_LIMIT_MAX_REQUESTS: +(process.env.RATE_LIMIT_MAX_REQUESTS || 20),
  CONCURRENT_STREAMS_LIMIT: +(process.env.CONCURRENT_STREAMS_LIMIT || 1),
  SESSION_TTL: 7200, // 2 hours
  STREAM_TIMEOUT: 45000,
  HEARTBEAT_INTERVAL: 15000,
};

const envCheck = EnvSchema.safeParse(process.env);
if (!envCheck.success) {
  console.warn("[WARN] Missing/invalid environment variables:", envCheck.error.flatten());
}

const log = {
  info: (...args) => console.log("[INFO]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
  debug: (...args) => console.debug("[DEBUG]", ...args)
};

const redis = Redis.fromEnv();

// Rate limiting implementation using Redis sliding window
async function checkRateLimit(ip, limit = CONFIG.RATE_LIMIT_MAX_REQUESTS, window = CONFIG.RATE_LIMIT_WINDOW_MS) {
  const now = Date.now();
  const windowStart = now - window;
  const key = `rate_limit:${ip}`;
  
  try {
    // Remove expired entries
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    const current = await redis.zcard(key);
    
    if (current >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + window
      };
    }
    
    // Add current request
    await redis.zadd(key, { score: now, member: `${now}-${uuidv4()}` });
    await redis.expire(key, Math.ceil(window / 1000));
    
    return {
      allowed: true,
      remaining: Math.max(0, limit - current - 1),
      resetTime: now + window
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request if rate limiting fails
    return { allowed: true, remaining: limit - 1, resetTime: now + window };
  }
}

// Concurrency control for sessions
async function acquireStreamLock(sessionId, timeout = 60) {
  const lockKey = `stream_lock:${sessionId}`;
  const lockValue = uuidv4();
  
  try {
    // Try to acquire lock with NX (only if not exists)
    const result = await redis.set(lockKey, lockValue, {
      px: timeout * 1000,
      nx: true
    });
    return result === 'OK' ? lockValue : null;
  } catch (error) {
    console.error('Lock acquisition error:', error);
    return null;
  }
}

async function releaseStreamLock(sessionId, lockValue) {
  const lockKey = `stream_lock:${sessionId}`;
  
  try {
    // Only release if we own the lock
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    await redis.eval(script, [lockKey], [lockValue]);
  } catch (error) {
    console.error('Lock release error:', error);
  }
}

// Helper function to sanitize and validate messages
function sanitizeMessage(message) {
  return {
    role: message.role,
    content: message.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .trim()
  };
}

// Enhanced request validation with header and message sanitization
function validateAndSanitizeRequest(bodyJson, headers) {
  try {
    // Validate session ID from headers
    const sessionId = headers.get('x-session-id');
    const userAgent = headers.get('user-agent') || '';
    const referer = headers.get('referer') || '';
    
    const validatedBody = ChatRequestSchema.parse({
      ...bodyJson,
      sessionId: sessionId || undefined,
      userAgent: userAgent,
      referer: referer
    });

    // Sanitize all messages
    const sanitizedMessages = validatedBody.messages.map(msg => {
      const sanitized = sanitizeMessage(msg);
      return MessageSchema.parse({
        ...sanitized,
        timestamp: msg.timestamp || new Date().toISOString()
      });
    });

    return {
      ...validatedBody,
      messages: sanitizedMessages
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ChatbotError(
        'Invalid request data',
        ERROR_TYPES.INVALID_INPUT,
        false,
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`
      );
    }
    throw new ChatbotError(
      'Request validation failed',
      ERROR_TYPES.INVALID_INPUT,
      false,
      'Invalid request format'
    );
  }
}

async function getSession(sessionId) {
  if (!sessionId) return null;
  try {
    const session = await redis.get(`session:${sessionId}`);
    if (!session) return null;
    
    // Handle case where session might be an object already
    let parsed;
    if (typeof session === 'string') {
      parsed = JSON.parse(session);
    } else if (typeof session === 'object') {
      parsed = session;
    } else {
      log.warn('Unexpected session data type:', typeof session);
      return SessionSchema.parse({});
    }
    
    return SessionSchema.parse(parsed);
  } catch (error) {
    log.error('Failed to parse/validate session data:', error);
    // Return a fresh validated session if parsing fails
    return SessionSchema.parse({});
  }
}

async function saveSession(sessionId, data) {
  try {
    const validated = SessionSchema.parse({
      ...data,
      _last_activity: Date.now()
    });
    const cleanData = JSON.parse(JSON.stringify(validated));
    await redis.setex(`session:${sessionId}`, CONFIG.SESSION_TTL, JSON.stringify(cleanData));
    return true;
  } catch (error) {
    log.error('Failed to validate/serialize session data:', error);
    try {
      // Fallback with minimal data
      const fallbackData = {
        chat_history: data?.chat_history ?? [],
        conversation_stage: data?.conversation_stage ?? 'initial',
        _last_activity: Date.now()
      };
      await redis.setex(`session:${sessionId}`, CONFIG.SESSION_TTL, JSON.stringify(fallbackData));
      return true;
    } catch (redisError) {
      log.error('Failed to save session fallback data:', redisError);
      return false;
    }
  }
}

// Enhanced lead capture schema with more comprehensive fields
const hubspotSchema = z.object({
  name: z.string().describe("Full name of the lead"),
  email: z.string().email().describe("Email address of the lead"),
  company: z.string().optional().describe("Company name"),
  phone: z.string().optional().describe("Phone number"),
  industry: z.string().optional().describe("Industry or business sector"),
  requirements: z.string().optional().describe("Project requirements or needs"),
  budget: z.string().optional().describe("Budget range"),
  timeline: z.string().optional().describe("Project timeline"),
  company_size: z.string().optional().describe("Company size or team size"),
  current_challenges: z.string().optional().describe("Current business challenges"),
  conversation_summary: z.string().optional().describe("Summary of the conversation"),
  lead_score: z.number().optional().describe("Lead quality score from 0-100")
});

const hubspotTool = tool(
  async ({ name, email, company, phone, industry, requirements, budget, timeline, company_size, current_challenges, conversation_summary, lead_score }) => {
    const leadData = {
      name, email, company, phone, industry, requirements, budget, timeline,
      company_size, current_challenges, conversation_summary, lead_score
    };

    // Queue for async processing with QStash
    await createLeadProcessingTask(leadData);

    return `✅ Thanks ${name}! I've captured your information and will follow up within 24 hours.`;
  },
  {
    name: "capture_lead",
    description: "Capture lead information to HubSpot when user provides contact details and shows interest in services",
    schema: hubspotSchema,
  }
);

// Fallback lead extraction function using regex patterns
function extractLeadFromText(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  
  // Simple name extraction (look for patterns like "My name is John" or "I'm John")
  const namePatterns = [
    /(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
    /(?:call me|you can call me)\s+([A-Z][a-z]+)/gi
  ];
  
  let name = null;
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      name = match[1];
      break;
    }
  }
  
  // Company extraction
  const companyPatterns = [
    /(?:work at|work for|employed at|my company is)\s+([A-Z][a-zA-Z\s&]+)/gi,
    /(?:at|from)\s+([A-Z][a-zA-Z\s&]+)(?:\s+(?:inc|llc|corp|ltd|company))/gi
  ];
  
  let company = null;
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      company = match[1].trim();
      break;
    }
  }
  
  return {
    name,
    email: emails[0] || null,
    company,
    phone: phones[0] || null,
    industry: null,
    requirements: null,
    budget: null,
    timeline: null,
    company_size: null,
    current_challenges: null,
    conversation_summary: text.length > 100 ? text.substring(0, 100) + '...' : text,
    lead_score: (name && emails.length > 0) ? 60 : 30,
    capture_ready: !!(name && emails[0]),
    _extracted_at: Date.now(),
    _validated: false
  };
}

// Simplified lead extraction without structured chain
async function extractLeadIntelligently(query, history) {
  try {
    // Trim context to reduce token usage and improve performance
    const recentHistory = history.slice(-4);
    const conversationText = recentHistory
      .map(m => `${m.role}: ${m.content.length > 200 ? m.content.substring(0, 200) + '...' : m.content}`)
      .join('\n') + '\nUser: ' + query;

    // First try regex-based extraction for speed
    const regexResult = extractLeadFromText(conversationText);
    
    // If we have basic info, return it
    if (regexResult.name && regexResult.email) {
      return regexResult;
    }
    
    // Otherwise, try AI extraction with timeout
    let chatModel;
    try {
      const models = await getModels(); // Add await here
      chatModel = models.chatModel;
    } catch (modelErr) {
      log.warn('Lead extraction model initialization failed:', modelErr);
      return regexResult;
    }

    const extractionPrompt = `Extract lead information from this conversation. Return JSON only.
    
Conversation: ${conversationText}

Format: {"name": "full name or null", "email": "email or null", "company": "company or null", "phone": "phone or null", "budget": "budget or null", "timeline": "timeline or null", "requirements": "needs or null", "lead_score": 0-100}`;

    try {
      const response = await Promise.race([
        chatModel.invoke(extractionPrompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Lead extraction timeout')), 8000)
        )
      ]);

      if (!response || !response.content) {
        log.warn('Lead extraction: Empty response from model');
        return regexResult;
      }

      const content = response.content.replace(/```json\n?|```\n?/g, '').trim();
      const raw = JSON.parse(content);
      
      // Validate using the LeadExtractionSchema
      const validationResult = LeadExtractionSchema.safeParse({
        ...raw,
        _extracted_at: Date.now(),
        _validated: true
      });
      
      if (!validationResult.success) {
        log.debug('Lead extraction: Schema validation failed', {
          errors: validationResult.error.flatten(),
          raw: raw
        });
        return regexResult;
      }
      
      const parsed = validationResult.data;
      if (!parsed.name || !parsed.email) {
        log.debug('Lead extraction: Missing required fields', { name: parsed.name, email: parsed.email });
        return { ...parsed, capture_ready: false };
      }
      return parsed;
    } catch (error) {
      if (error.message === 'Lead extraction timeout') {
        log.warn('Lead extraction timed out after 8 seconds');
      } else {
        log.warn('AI lead extraction failed:', error);
      }
      return regexResult;
    }
  } catch (error) {
    log.warn('Lead extraction failed:', error);
    return null;
  }
}

// Generate conversation summary with context trimming and timeout protection
async function generateConversationSummary(history, finalQuery) {
  let chatModel;
  try {
    const models = await getModels(); // Add await here
    chatModel = models.chatModel;
  } catch (modelErr) {
    log.warn('Conversation summary model initialization failed:', modelErr);
    return 'User interested in AI automation solutions';
  }

  // Trim context to reduce latency
  const recentHistory = history.slice(-4);
  const trimmedConversation = recentHistory
    .map(m => `${m.role}: ${m.content.length > 150 ? m.content.substring(0, 150) + '...' : m.content}`)
    .join('\n') + `\nUser: ${finalQuery}`;

  const summaryPrompt = `Summarize this conversation in 2-3 sentences, focusing on:
1. What the user is looking for
2. Their main challenges or requirements
3. Any budget or timeline indicators

Conversation:
${trimmedConversation}

Summary:`;

  try {
    const response = await Promise.race([
      chatModel.invoke(summaryPrompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Conversation summary timeout')), 8000)
      )
    ]);

    if (!response || !response.content) {
      log.warn('Conversation summary: Empty response from model');
      return 'User interested in AI automation solutions';
    }

    const summary = response.content.trim();
    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
  } catch (error) {
    if (error.message === 'Conversation summary timeout') {
      log.warn('Conversation summary timed out after 8 seconds');
    } else {
      log.warn('Conversation summary failed:', error);
    }
    return 'User interested in AI automation solutions';
  }
}

// Enhanced history summarization when token limits are exceeded
async function summarizeHistoryIfNeeded(session) {
  const history = session.chat_history || [];
  const maxHistory = CONFIG.MAX_HISTORY;
  
  if (history.length <= maxHistory * 2) {
    return session; // No need to summarize
  }
  
  try {
    log.info(`Summarizing history: ${history.length} messages exceeds limit`);
    
    // Keep the most recent messages and summarize the rest
    const recentMessages = history.slice(-maxHistory);
    const olderMessages = history.slice(0, -maxHistory);
    
    // Generate summary of older messages
    const summaryText = await generateConversationSummary(olderMessages, '');
    
    // Create new history with summary at the beginning
    const summarizedHistory = [
      {
        role: 'assistant',
        content: `Previous conversation summary: ${summaryText}`,
        timestamp: new Date().toISOString()
      },
      ...recentMessages
    ];
    
    return {
      ...session,
      chat_history: summarizedHistory,
      _history_summarized_at: Date.now()
    };
  } catch (error) {
    log.error('History summarization failed:', error);
    // Fallback: just truncate history
    return {
      ...session,
      chat_history: history.slice(-maxHistory)
    };
  }
}

let modelsSingleton = null;
let cacheSingleton = null;
let modelInitializationPromise = null;

async function getModels() {
  // If we already have initialized models, return them
  if (modelsSingleton) {
    return modelsSingleton;
  }
  
  // If initialization is in progress, wait for it
  if (modelInitializationPromise) {
    return await modelInitializationPromise;
  }
  
  // Start initialization
  modelInitializationPromise = initializeModels();
  return await modelInitializationPromise;
}

async function initializeModels() {
  try {
    // Reuse cache singleton to avoid recreating Upstash cache per request
    if (!cacheSingleton) {
      cacheSingleton = new UpstashRedisCache({ client: Redis.fromEnv(), ttl: 60 * 5 });
    }

    // Initialize Google AI
    if (process.env.GOOGLE_API_KEY) {
      log.info("Initializing Google AI model:", CONFIG.GEMINI_MODEL);
      const chatModel = new ChatGoogleGenerativeAI({
        cache: cacheSingleton,
        maxRetries: 2,
        timeout: 30000, // Reduced timeout for faster responses
        maxConcurrency: 3, // Reduced concurrency
        modelName: CONFIG.GEMINI_MODEL,
        streaming: true,
        maxOutputTokens: Math.min(CONFIG.MAX_TOKENS, 1500), // Limit output tokens
        temperature: CONFIG.TEMPERATURE,
        apiKey: process.env.GOOGLE_API_KEY,
        clientOptions: { timeout: 30000, maxRetries: 2 },
      });

      // Test the Google AI model
      try {
        log.info(`Testing Google AI model ${CONFIG.GEMINI_MODEL}...`);
        const testResponse = await Promise.race([
          chatModel.invoke("Hello"),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Model test timeout')), 10000))
        ]);
        
        if (testResponse && testResponse.content) {
          modelsSingleton = { chatModel, provider: 'google', model: CONFIG.GEMINI_MODEL };
          log.info(`Google AI model ${CONFIG.GEMINI_MODEL} initialized successfully`);
          return modelsSingleton;
        } else {
          throw new Error('Invalid response from Google AI model');
        }
      } catch (googleError) {
        log.error(`Google AI model test failed:`, googleError.message);
        throw googleError;
      }
    } else {
      throw new Error('No Google API key configured');
    }
  } catch (err) {
    log.error("Model initialization failed:", err);
    // Reset the promise so we can try again
    modelInitializationPromise = null;
    throw new ChatbotError(
      "Failed to initialize AI models. Please check your API configuration.",
      ERROR_TYPES.MODEL_TIMEOUT,
      false,
      'The AI service is temporarily unavailable. Please try again in a few minutes.'
    );
  }
}

function buildHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-CONFIG.MAX_HISTORY)
    .map(m => (m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)));
}

// Proactive information gathering prompts
const LEAD_QUALIFICATION_PROMPTS = {
  initial_greeting: [
    "Hi! I'm Aparna's AI assistant. I help businesses explore AI automation solutions. What kind of business are you working with?",
    "Hello! I specialize in helping businesses understand how AI automation can help them. Could you tell me about your company?",
    "Hi there! I assist Aparna in helping businesses with AI automation. What does your company do?"
  ],
  business_understanding: [
    "That's interesting! What are some of the biggest challenges you're facing in your day-to-day operations?",
    "Thanks for sharing. What specific tasks or processes do you think could be automated in your business?",
    "Great! What areas of your business do you feel could benefit most from automation?"
  ],
  solution_exploration: [
    "Based on what you've shared, AI automation could definitely help with that. Are you currently looking at any specific timeline for implementing solutions?",
    "That's a common challenge we solve. What's your budget range for exploring automation solutions?",
    "I see how AI could help streamline that for you. Are you the decision maker for this type of project?"
  ],
  lead_capture: [
    "This sounds like a great fit for what Aparna specializes in. I'd love to have him reach out with a personalized consultation. What's the best email to reach you at?",
    "Based on our conversation, I think Aparna could really help you. Could you share your email so he can follow up with specific recommendations?",
    "This is exactly the type of challenge Aparna helps businesses solve. What's your email address, and I'll make sure he reaches out?"
  ]
};

function determineConversationStage(session) {
  const historyLength = (session.chat_history || []).length;
  if (historyLength === 0) return 'initial';
  if (historyLength <= 2) return 'business_understanding';
  if (historyLength <= 4) return 'solution_exploration';
  return 'lead_capture';
}

// Enhanced proactive logic with stage and intent awareness
function shouldProactivelyAsk(session) {
  const stage = determineConversationStage(session);
  const lastIntent = session.last_intent ?? 'information';
  const lastProactiveAt = session._last_proactive_at || 0;
  const turns = Math.floor((session.chat_history?.length || 0) / 2);
  
  // Only trigger in early stages
  if (stage !== 'initial' && stage !== 'business_understanding') return false;
  
  // Don't ask if user was already captured or is in lead capture
  if (lastIntent === 'lead_capture') return false;
  
  // Rate limiting: max 1 proactive message per 3 user turns
  const maxTurnsBetweenProactive = 3;
  if (turns > 0 && (turns % maxTurnsBetweenProactive !== 0)) return false;
  
  // Cooldown period: don't ask if too recent
  const now = Date.now();
  const timeSinceLastProactive = now - lastProactiveAt;
  if (timeSinceLastProactive < CONFIG.PROACTIVE_COOLDOWN_MS) return false;
  
  // Context analysis: check user engagement level
  const recentUserMessages = session.chat_history
    ?.filter(m => m.role === 'user')
    ?.slice(-2) || [];
    
  const avgUserMessageLength = recentUserMessages.length > 0 
    ? recentUserMessages.reduce((sum, msg) => sum + msg.content.length, 0) / recentUserMessages.length
    : 0;
    
  // Only be proactive if user is engaged (non-trivial messages)
  if (avgUserMessageLength < 10) return false;
  
  return true;
}

// Enhanced proactive response generation with intelligent selection
function generateProactiveResponse(session) {
  if (!shouldProactivelyAsk(session)) return null;
  
  const stage = determineConversationStage(session);
  const lastIntent = session.last_intent ?? 'information';
  const prompts = LEAD_QUALIFICATION_PROMPTS[stage];
  
  if (!prompts || prompts.length === 0) return null;
  
  // Intelligent prompt selection based on conversation context
  let selectedPrompt = prompts[0]; // Default to first prompt
  
  if (stage === 'initial') {
    // Early stage: choose based on user engagement patterns
    const userMessages = session.chat_history?.filter(m => m.role === 'user') || [];
    if (userMessages.length === 0) {
      selectedPrompt = prompts[0]; // First greeting
    } else if (userMessages.length === 1) {
      selectedPrompt = prompts[1] || prompts[0]; // Second greeting
    } else {
      selectedPrompt = prompts[2] || prompts[0]; // Third greeting option
    }
  } else if (stage === 'business_understanding') {
    // Business understanding stage: choose based on last intent
    if (lastIntent === 'information') {
      selectedPrompt = prompts[0] || prompts[1]; // Ask about challenges
    } else if (lastIntent === 'pricing') {
      selectedPrompt = prompts[1] || prompts[0]; // Ask about automation needs
    } else {
      selectedPrompt = prompts[2] || prompts[0]; // General question
    }
  }
  
  // Add timestamp when proactive message is generated
  session._last_proactive_at = Date.now();
  
  return {
    content: selectedPrompt,
    metadata: { 
      confidence: 0.9, 
      intent: 'information_gathering', 
      topics: ['lead_qualification'], 
      proactive: true,
      stage: stage,
      lastIntent: lastIntent
    }
  };
}

const CONVERSATION_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", `You are Aparna Pradhan's [ he / him ] AI assistant. Be helpful, professional, and focused on understanding client needs for AI automation solutions.

Aparna specializes in helping businesses:
• Automate repetitive tasks and workflows
• Improve customer service with AI
• Streamline business processes
• Save time and reduce operational costs
• Scale operations without adding headcount

Your conversation approach:
1. Ask about their business and current challenges
2. Understand their specific needs and pain points
3. Explain how AI automation could help (in general terms)
4. Ask about timeline and budget when appropriate
5. Guide the conversation naturally toward lead capture
6. When they provide email + name, use the capture_lead tool immediately

Key questions to ask:
- "What does your company do?"
- "What are some of your biggest operational challenges?"
- "What tasks take up most of your team's time?"
- "Are you looking to automate any specific processes?"
- "What's your timeline for exploring solutions?"
- "Do you have a budget range in mind?"

When to use capture_lead tool:
- User provides name AND email
- Include all information gathered: company, challenges, requirements, budget, timeline
- Generate a conversation summary
- Score the lead quality (0-100)

Keep responses conversational and natural. Focus on understanding their needs before proposing solutions. Don't make specific promises or fake case studies.

End with metadata:
[CONFIDENCE: 0.0-1.0]
[INTENT: information|pricing|demo|support|lead_capture|other]
[TOPICS: comma,separated,topics]`],
  new MessagesPlaceholder("chat_history"),
  ["user", "{input}"]
]);

async function handleStream(stream, controller, query, session, sessionId, lockValue) {
  const encoder = new TextEncoder();
  let fullResponse = "";
  let streamTimeout;
  let controllerClosed = false;
  let heartbeatId;

  const safeEnqueue = (data) => {
    try {
      if (!controllerClosed && controller && controller.desiredSize !== null) {
        controller.enqueue(data);
        return true;
      }
      return false;
    } catch (error) {
      if (error.message.includes('Controller is already closed')) {
        controllerClosed = true;
      }
      return false;
    }
  };

  const safeClose = async () => {
    try {
      if (!controllerClosed && controller) {
        controller.close();
        controllerClosed = true;
      }
      // Release lock when closing
      if (lockValue) {
        await releaseStreamLock(sessionId, lockValue);
      }
    } catch (error) {
      controllerClosed = true;
    }
  };

  try {
    // Start heartbeat immediately for connection stability
    heartbeatId = setInterval(() => {
      safeEnqueue(encoder.encode("event: ping\ndata: {}\n\n"));
    }, CONFIG.HEARTBEAT_INTERVAL);

    // Set a timeout for the entire stream operation
    const streamPromise = (async () => {
      // Check if we should be proactive instead of generating LLM response
      const proactiveResponse = generateProactiveResponse(session);
      if (proactiveResponse) {
        try {
          const message = JSON.stringify({ content: proactiveResponse.content });
          safeEnqueue(encoder.encode(`data: ${message}\n\n`));

          const metadataMessage = JSON.stringify({ metadata: proactiveResponse.metadata });
          safeEnqueue(encoder.encode(`data: ${metadataMessage}\n\n`));

          // Update session
          session.chat_history.push({ role: 'user', content: query, timestamp: new Date().toISOString() });
          session.chat_history.push({ role: 'assistant', content: proactiveResponse.content, timestamp: new Date().toISOString() });
          session._last_proactive_at = Date.now();
          await saveSession(sessionId, session);

          safeEnqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          log.error('Proactive response streaming error:', error);
        } finally {
          await safeClose();
        }
        return;
      }

      // Generate LLM response with proper error handling
      if (!stream) {
        throw new Error("Stream is null or undefined");
      }

      // Handle different stream formats
      if (typeof stream[Symbol.asyncIterator] === 'function') {
        // Standard async iterator (LangChain style)
        for await (const chunk of stream) {
          if (controllerClosed) break;

          if (chunk) {
            // Handle LangChain chunk format
            let content = '';
            if (typeof chunk === 'string') {
              content = chunk;
            } else if (chunk && chunk.content) {
              content = chunk.content;
            } else if (chunk && typeof chunk.toString === 'function') {
              content = chunk.toString();
            }

            if (content) {
              fullResponse += content;

              // Stream chunk immediately for better UX
              const chunkMessage = JSON.stringify({ content, chunk: true });
              if (!safeEnqueue(encoder.encode(`data: ${chunkMessage}\n\n`))) {
                break; // Controller closed, exit loop
              }
            }
          }
        }
      } else if (stream && typeof stream.pipe === 'function') {
        // Node.js stream
        for await (const chunk of stream) {
          if (controllerClosed) break;

          if (chunk) {
            const content = chunk.toString ? chunk.toString() : String(chunk);
            if (content) {
              fullResponse += content;

              // Stream chunk immediately
              const chunkMessage = JSON.stringify({ content, chunk: true });
              if (!safeEnqueue(encoder.encode(`data: ${chunkMessage}\n\n`))) {
                break; // Controller closed, exit loop
              }
            }
          }
        }
      } else {
        throw new Error("Invalid stream format");
      }
    })();

    // Race between stream and timeout
    await Promise.race([
      streamPromise,
      new Promise((_, reject) => {
        streamTimeout = setTimeout(() => {
          controllerClosed = true; // Mark as closed on timeout
          reject(new Error('Stream timeout'));
        }, CONFIG.STREAM_TIMEOUT);
      })
    ]);

    clearTimeout(streamTimeout);
    clearInterval(heartbeatId);

    if (!controllerClosed) {
      // Parse metadata
      const metadataMatch = fullResponse.match(/\[(CONFIDENCE|INTENT|TOPICS):[^\]]+\]/g);
      const metadata = {
        confidence: 0.7,
        intent: 'information',
        topics: ['ai_automation'],
        proactive: false
      };

      if (metadataMatch) {
        try {
          const confMatch = metadataMatch.find(m => m.includes('CONFIDENCE'));
          const intentMatch = metadataMatch.find(m => m.includes('INTENT'));
          const topicsMatch = metadataMatch.find(m => m.includes('TOPICS'));

          if (confMatch) {
            const confValue = confMatch.match(/[\d.]+/);
            if (confValue) metadata.confidence = parseFloat(confValue[0]);
          }
          if (intentMatch) {
            const intentValue = intentMatch.match(/INTENT: (\w+)/);
            if (intentValue) metadata.intent = intentValue[1];
          }
          if (topicsMatch) {
            const topicsValue = topicsMatch.match(/TOPICS: ([^\]]+)/);
            if (topicsValue) {
              metadata.topics = topicsValue[1].split(',').map(t => t.trim());
            }
          }
        } catch (parseError) {
          log.warn('Metadata parsing failed:', parseError);
        }
      }

      const responseContent = fullResponse.replace(/\[(CONFIDENCE|INTENT|TOPICS):[^\]]+\]/g, "").trim();

      // Stream the response
      try {
        const message = JSON.stringify({ content: String(responseContent) });
        safeEnqueue(encoder.encode(`data: ${message}\n\n`));

        const metadataMessage = JSON.stringify({ metadata: metadata });
        safeEnqueue(encoder.encode(`data: ${metadataMessage}\n\n`));
      } catch (jsonError) {
        log.error('Response JSON serialization failed:', jsonError);
      }

      // Update session
      try {
        session.chat_history.push({ role: 'user', content: query, timestamp: new Date().toISOString() });
        session.chat_history.push({ role: 'assistant', content: responseContent, timestamp: new Date().toISOString() });
        session.last_intent = metadata.intent;
        await saveSession(sessionId, session);
      } catch (sessionError) {
        log.error('Session update failed:', sessionError);
      }

      // Intelligent lead capture
      try {
        const leadData = await extractLeadIntelligently(query, session.chat_history);

        if (leadData && leadData.capture_ready && leadData.name && leadData.email) {
          log.info('Capturing qualified lead:', leadData);

          // Generate conversation summary
          const conversationSummary = await generateConversationSummary(session.chat_history, query);
          leadData.conversation_summary = conversationSummary;

          const leadResult = await captureLeadToHubSpot(leadData);
          const leadMessage = JSON.stringify({
            content: `\n\n${leadResult}`,
            tool_call: true,
            lead_captured: true
          });
          safeEnqueue(encoder.encode(`data: ${leadMessage}\n\n`));
        }
      } catch (leadError) {
        log.error('Lead capture error:', leadError);
      }
    }

  } catch (err) {
    clearTimeout(streamTimeout);
    controllerClosed = true;
    log.error(`Stream error for query: "${query}"`, err);

    let chatbotError;
    if (err.message === 'Stream timeout') {
      chatbotError = new ChatbotError(
        'Request timed out. The AI took too long to respond.',
        ERROR_TYPES.MODEL_TIMEOUT,
        true,
        'The AI service is taking longer than expected. Please try again.'
      );
    } else if (err.message.includes('Stream') || err.message.includes('null')) {
      chatbotError = new ChatbotError(
        'Stream processing failed',
        'GENERIC',
        false,
        'There was an error processing your request. Please try again.'
      );
    } else {
      chatbotError = new ChatbotError(
        err.message || 'Unknown stream error',
        'GENERIC',
        false,
        'An error occurred while processing your request.'
      );
    }

    try {
      const errorResponse = handleChatbotError(chatbotError, { query: query });
      const errorMessage = JSON.stringify(errorResponse);
      safeEnqueue(encoder.encode(`data: ${errorMessage}\n\n`));
    } catch (jsonError) {
      log.error('Error response JSON serialization failed:', jsonError);
    }
  } finally {
    clearInterval(heartbeatId);
    safeEnqueue(encoder.encode("data: [DONE]\n\n"));
    await safeClose();
  }
}

export const POST = async (req) => {
  let queryContent = "N/A";
  let timeoutId;
  let sessionId = null;
  let lockValue = null;

  try {
    // Enhanced rate limiting with proper sliding window
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown';
    const rateLimitResult = await checkRateLimit(ip);
    
    if (!rateLimitResult.allowed) {
      const errorResponse = {
        error: true,
        message: "Too many requests, please slow down.",
        retryable: true,
        errorId: uuidv4(),
        details: {
          resetTime: rateLimitResult.resetTime,
          remaining: rateLimitResult.remaining
        }
      };
      return newResponse(429, errorResponse, {
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }

    // Enhanced validation and sanitization using Zod schemas
    let validatedData;
    try {
      if (!req.body) {
        throw new ChatbotError('Missing request body', ERROR_TYPES.INVALID_INPUT, false, 'Request body is required');
      }
      const bodyJson = await req.json();
      validatedData = validateAndSanitizeRequest(bodyJson, req.headers);
    } catch (validationError) {
      if (validationError instanceof ChatbotError) {
        const errorResponse = {
          error: true,
          message: validationError.userMessage,
          retryable: validationError.retryable,
          errorId: uuidv4(),
          details: { type: validationError.type }
        };
        return newResponse(400, errorResponse);
      }
      const errorResponse = {
        error: true,
        message: "Invalid request format",
        retryable: false,
        errorId: uuidv4()
      };
      return newResponse(400, errorResponse);
    }

    const { messages, sessionId: validatedSessionId } = validatedData;
    sessionId = validatedSessionId || uuidv4(); // Generate new session ID if not provided
    const lastMsg = messages[messages.length - 1];
    queryContent = lastMsg.content.trim();
    
    if (!queryContent) {
      const errorResponse = {
        error: true,
        message: "Empty message content",
        retryable: false,
        errorId: uuidv4()
      };
      return newResponse(400, errorResponse);
    }
    
    // Sanitize final query content
    queryContent = sanitizeMessage({ role: 'user', content: queryContent }).content;
    if (!queryContent) {
      const errorResponse = {
        error: true,
        message: "Invalid message content",
        retryable: false,
        errorId: uuidv4()
      };
      return newResponse(400, errorResponse);
    }
    
    log.info(`Received query: "${queryContent}" from session: ${sessionId}, IP: ${ip}`);

    // Acquire concurrency lock for session
    lockValue = await acquireStreamLock(sessionId, 60);
    if (!lockValue) {
      const errorResponse = {
        error: true,
        message: "Another reply is in progress for this session.",
        retryable: true,
        errorId: uuidv4()
      };
      return newResponse(409, errorResponse);
    }

    // Set overall request timeout
    const requestPromise = (async () => {
      let session = await getSession(sessionId);
      if (!session) {
        session = SessionSchema.parse({
          chat_history: [],
          conversation_stage: 'initial',
          _created_at: Date.now()
        });
      }

      // Summarize history if needed to keep latency low
      session = await summarizeHistoryIfNeeded(session);

      // Initialize models with error handling
      let chatModel;
      try {
        const models = await getModels(); // Add await since getModels is async
        chatModel = models.chatModel;
      } catch (modelErr) {
        log.error("Model initialization failed in POST:", modelErr);
        throw new ChatbotError(
          'AI service initialization failed',
          ERROR_TYPES.MODEL_TIMEOUT,
          true,
          'The AI service is temporarily unavailable. Please try again in a few minutes.'
        );
      }

      const history = buildHistory(session.chat_history);
      
      // Circuit breaker for model calls
      const modelBreaker = new CircuitBreaker(3, 60000);

      let stream;
      try {
        stream = await modelBreaker.execute(async () => {
          // Optimized approach with better prompt engineering and caching
          try {
            // Create optimized prompt with context awareness
            const contextLength = session.chat_history?.length || 0;
            const isFollowUp = contextLength > 2;
            
            let optimizedPrompt;
            if (isFollowUp) {
              // For follow-up messages, use shorter, more focused prompts
              const lastUserMessage = session.chat_history
                .filter(m => m.role === 'user')
                .pop()?.content || '';
              optimizedPrompt = `Continue conversation about AI automation. Previous context: ${lastUserMessage.substring(0, 100)}. Current question: ${queryContent}. Be concise and helpful.`;
            } else {
              // For new conversations, use full prompt
              optimizedPrompt = `You are Aparna's AI assistant specializing in AI automation solutions. User: ${queryContent}`;
            }
            
            // Get response with optimized parameters
            const response = await Promise.race([
              chatModel.invoke(optimizedPrompt),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Model response timeout')), 15000)
              )
            ]);
            
            const content = response.content || response;
            
            // Optimized streaming with variable chunk sizes
            return async function*() {
              const words = content.split(' ');
              let currentText = '';
              
              for (let i = 0; i < words.length; i++) {
                const word = words[i];
                currentText += (currentText ? ' ' : '') + word;
                
                // Variable delay based on content type and position
                let delay = 30; // Base delay
                if (i < 3) delay = 20; // Faster start
                else if (i > words.length - 3) delay = 40; // Slower end
                else if (word.length > 8) delay = 35; // Longer words
                
                yield { content: word + ' ' };
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }();
          } catch (modelError) {
            log.error('Model execution error:', modelError);
            
            // Enhanced error handling with intelligent fallback
            if (modelError.message.includes('ECONNREFUSED') ||
                modelError.message.includes('fetch failed') ||
                modelError.message.includes('timeout')) {
              
              log.info('Primary model failed, attempting intelligent fallback');
              
              // Reset singleton to force reinitialization
              modelsSingleton = null;
              modelInitializationPromise = null;
              
              // Try different fallback strategies
              try {
                // Strategy 1: Try Google AI if Ollama failed
                if (process.env.OLLAMA_BASE_URL) {
                  const originalOllamaUrl = process.env.OLLAMA_BASE_URL;
                  process.env.OLLAMA_BASE_URL = null;
                  
                  try {
                    const fallbackModels = await getModels();
                    if (fallbackModels.provider === 'google') {
                      const fallbackResponse = await Promise.race([
                        fallbackModels.chatModel.invoke(optimizedPrompt),
                        new Promise((_, reject) =>
                          setTimeout(() => reject(new Error('Fallback model timeout')), 10000)
                        )
                      ]);
                      
                      const fallbackContent = fallbackResponse.content || fallbackResponse;
                      process.env.OLLAMA_BASE_URL = originalOllamaUrl;
                      
                      return async function*() {
                        const words = fallbackContent.split(' ');
                        for (const word of words) {
                          yield { content: word + ' ' };
                          await new Promise(resolve => setTimeout(resolve, 40));
                        }
                      }();
                    }
                  } catch (googleError) {
                    process.env.OLLAMA_BASE_URL = originalOllamaUrl;
                    throw googleError;
                  }
                }
                
                // Strategy 2: Return cached response if available
                const cachedResponse = `I'm experiencing some technical difficulties, but I'd be happy to help you with AI automation solutions. Could you try rephrasing your question or contact me directly at contact@example.com for immediate assistance?`;
                
                return async function*() {
                  const words = cachedResponse.split(' ');
                  for (const word of words) {
                    yield { content: word + ' ' };
                    await new Promise(resolve => setTimeout(resolve, 30));
                  }
                }();
                
              } catch (fallbackError) {
                log.error('All fallback strategies failed:', fallbackError);
                throw new Error(`Model execution failed: ${modelError.message}`);
              }
            }
            
            throw new Error(`Model execution failed: ${modelError.message}`);
          }
        });
      } catch (circuitErr) {
        log.error("Circuit breaker error:", circuitErr);
        if (circuitErr.message === 'Circuit breaker is OPEN') {
          throw new ChatbotError(
            'Service temporarily unavailable due to high demand.',
            ERROR_TYPES.MODEL_TIMEOUT,
            true,
            'The service is experiencing high demand. Please try again in a few minutes.'
          );
        } else {
          throw circuitErr;
        }
      }

      const responseHeaders = {
        "Content-Type": "text/event-stream",
        "x-session-id": sessionId,
        'Access-Control-Expose-Headers': 'x-session-id',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Rate-Limit-Remaining': rateLimitResult.remaining.toString(),
        'X-Rate-Limit-Reset': rateLimitResult.resetTime.toString(),
      };

      return new Response(
        new ReadableStream({
          start(controller) {
            handleStream(stream, controller, queryContent, session, sessionId, lockValue);
          }
        }),
        { headers: responseHeaders }
      );
    })();

    // Race between request and timeout
    const res = await Promise.race([
      requestPromise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new ChatbotError(
            'Request timeout',
            ERROR_TYPES.MODEL_TIMEOUT,
            true,
            'The request took too long to process. Please try again.'
          ));
        }, 60000);
      })
    ]);

    return res;

  } catch (err) {
    clearTimeout(timeoutId);

    let chatbotError;
    if (err instanceof ChatbotError) {
      chatbotError = err;
    } else if (err.message === 'Circuit breaker is OPEN') {
      chatbotError = new ChatbotError(
        'Service unavailable due to repeated failures.',
        ERROR_TYPES.MODEL_TIMEOUT,
        true,
        'The service is temporarily unavailable. Please try again in a few minutes.'
      );
    } else if (err.name === 'AbortError' || err.message.includes('timeout')) {
      chatbotError = new ChatbotError(
        'Request timed out',
        ERROR_TYPES.MODEL_TIMEOUT,
        true,
        'The request took too long to process. Please try again.'
      );
    } else {
      chatbotError = new ChatbotError(
        err.message || 'An unexpected error occurred',
        'GENERIC',
        false,
        'An error occurred while processing your request. Please try again.'
      );
    }

    log.error("POST request error:", {
      error: chatbotError.message,
      type: chatbotError.type,
      query: queryContent,
      sessionId: sessionId,
      stack: err.stack
    });

    const errorResponse = {
      error: true,
      message: chatbotError.userMessage,
      retryable: chatbotError.retryable,
      errorId: uuidv4(),
      details: {
        type: chatbotError.type,
        timestamp: new Date().toISOString()
      }
    };
    
    return newResponse(500, errorResponse);
  } finally {
    // Ensure lock is released if we have one
    if (lockValue && sessionId) {
      try {
        await releaseStreamLock(sessionId, lockValue);
      } catch (error) {
        log.error('Error releasing lock in finally block:', error);
      }
    }
  }
};

function newResponse(status, message, headers = {}) {
  return new Response(JSON.stringify(message), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
      ...headers
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}