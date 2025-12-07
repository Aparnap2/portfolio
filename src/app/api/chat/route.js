export const runtime = "nodejs";

import 'dotenv/config';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import CircuitBreaker from "../../../lib/circuit_breaker.js";
import { captureLeadToHubSpot } from "../../../lib/hubspot_client.js";
import { createLeadProcessingTask } from "../../../lib/qstash_client.js";

// Enhanced schemas for better validation
const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(10000),
  })).min(1).max(50),
  sessionId: z.string().uuid().optional(),
  query: z.string().optional(), // Add optional query field for direct messages
}).refine(data => {
  // Ensure either messages or query is provided
  return data.messages.length > 0 || (data.query && data.query.trim().length > 0);
}, {
  message: "Either messages array or query must be provided",
  path: ["messages", "query"]
});

const LeadExtractionSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  requirements: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  company_size: z.string().optional(),
  current_challenges: z.string().optional(),
  conversation_summary: z.string().optional(),
  lead_score: z.number().min(0).max(100).optional(),
});

// Configuration
const CONFIG = {
  MODEL_NAME: process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash-exp",
  MAX_TOKENS: 2500,
  TEMPERATURE: 0.1,
  MAX_RETRIES: 3,
  TIMEOUT: 30000,
  RATE_LIMIT_WINDOW: 60000,
  RATE_LIMIT_MAX: 20,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
};

// Error handling
class ChatbotError extends Error {
  constructor(message, type = 'GENERIC', retryable = false, userMessage = null) {
    super(message);
    this.type = type;
    this.retryable = retryable;
    this.userMessage = userMessage || 'Sorry, I encountered an issue. Please try again.';
    this.timestamp = new Date().toISOString();
  }
}

// Rate limiting implementation
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - CONFIG.RATE_LIMIT_WINDOW;
  const key = `rate_limit:${ip}`;
  
  const userRequests = rateLimitStore.get(key) || [];
  const recentRequests = userRequests.filter(time => time > windowStart);
  
  if (recentRequests.length >= CONFIG.RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: windowStart + CONFIG.RATE_LIMIT_WINDOW };
  }
  
  recentRequests.push(now);
  rateLimitStore.set(key, recentRequests);
  
  // Cleanup old entries
  setTimeout(() => {
    const currentRequests = rateLimitStore.get(key) || [];
    const validRequests = currentRequests.filter(time => time > (Date.now() - CONFIG.RATE_LIMIT_WINDOW));
    if (validRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }, CONFIG.RATE_LIMIT_WINDOW);
  
  return {
    allowed: true,
    remaining: Math.max(0, CONFIG.RATE_LIMIT_MAX - recentRequests.length - 1),
    resetTime: now + CONFIG.RATE_LIMIT_WINDOW
  };
}

// Lead extraction function
function extractLeadFromConversation(messages) {
  const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  
  // Simple regex-based extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const nameRegex = /(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi;
  const companyRegex = /(?:work at|work for|my company is)\s+([A-Z][a-zA-Z\s&]+)/gi;
  
  const emails = conversation.match(emailRegex) || [];
  const phones = conversation.match(phoneRegex) || [];
  const names = conversation.match(nameRegex) || [];
  const companies = conversation.match(companyRegex) || [];
  
  return {
    name: names.length > 0 ? names[0].replace(/(?:my name is|i'm|i am|this is)\s+/i, '') : null,
    email: emails[0] || null,
    company: companies.length > 0 ? companies[0].replace(/(?:work at|work for|my company is)\s+/i, '') : null,
    phone: phones[0] || null,
    lead_score: emails.length > 0 ? 70 : 30,
    capture_ready: emails.length > 0 && names.length > 0
  };
}

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are Aparna Pradhan's AI assistant specializing in AI automation solutions for businesses.

Aparna helps businesses:
• Automate repetitive tasks and workflows
• Improve customer service with AI
• Streamline business processes
• Save time and reduce operational costs
• Scale operations without adding headcount

Your approach:
1. Ask about their business and current challenges
2. Understand their specific needs and pain points
3. Explain how AI automation could help (in general terms)
4. Ask about timeline and budget when appropriate
5. Guide the conversation naturally toward lead capture
6. When they provide email + name, mention you'll connect them with Aparna

Key questions to ask:
- "What does your company do?"
- "What are some of your biggest operational challenges?"
- "What tasks take up most of your team's time?"
- "Are you looking to automate any specific processes?"
- "What's your timeline for exploring solutions?"
- "Do you have a budget range in mind?"

Keep responses conversational and natural. Focus on understanding their needs before proposing solutions.`;

// Enhanced API route handler
export async function POST(req) {
  let clientIp = 'unknown';
  
  try {
    // Get client IP
    clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';

    // Rate limiting
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Validate request
    const body = await req.json();
    const { messages, sessionId, query } = ChatRequestSchema.parse(body);
    console.log('[DEBUG] Received request with:', { messages, sessionId, query });
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content?.trim()) {
      throw new ChatbotError('Empty message content', 'INVALID_INPUT');
    }

    console.log(`[CHAT] Received message from ${clientIp}: ${lastMessage.content.substring(0, 100)}...`);
    console.log(`[CHAT] API Key available: ${CONFIG.GOOGLE_API_KEY ? 'YES' : 'NO'}`);
    console.log(`[CHAT] Model: ${CONFIG.MODEL_NAME}`);

    // Extract lead information
    const leadData = extractLeadFromConversation(messages);
    
    // Create Google provider with API key
    const google = createGoogleGenerativeAI({
      apiKey: CONFIG.GOOGLE_API_KEY,
    });
    
    // Generate response - manually create stream for better control
    const result = streamText({
          model: google(CONFIG.MODEL_NAME),
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.slice(-10) // Keep last 10 messages for context
          ],
          maxTokens: CONFIG.MAX_TOKENS,
          temperature: CONFIG.TEMPERATURE,
          abortSignal: AbortSignal.timeout(CONFIG.TIMEOUT),
        });

    // Create a custom stream to handle both streaming and completion
    const encoder = new TextEncoder();
    let accumulatedText = '';
    
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.textStream) {
              accumulatedText += chunk;
              
              // Stream each chunk immediately
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'text-delta',
                  textDelta: chunk
                })}\n\n`)
              );
            }
            
            // Signal completion
            controller.enqueue(
              encoder.encode('data: [DONE]\n\n')
            );
            
            // Handle lead capture after completion
            console.log('[DEBUG] LLM Response:', accumulatedText.substring(0, 200) + '...');
            if (leadData.capture_ready && leadData.name && leadData.email) {
              try {
                console.log('[LEAD] Capturing qualified lead:', leadData);
                await captureLeadToHubSpot({
                  ...leadData,
                  conversation_summary: `User interested in AI automation. Last message: ${lastMessage.content.substring(0, 200)}`
                });
              } catch (leadError) {
                console.error('[LEAD] Failed to capture lead:', leadError);
              }
            }
            
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Session-ID': sessionId || uuidv4(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      }
    );

  } catch (error) {
    console.error('[CHAT] Error:', error);
    
    let errorResponse = {
      error: 'An error occurred',
      type: 'GENERIC',
      retryable: false,
      timestamp: new Date().toISOString()
    };

    if (error instanceof z.ZodError) {
      errorResponse = {
        error: 'Invalid request format',
        type: 'VALIDATION_ERROR',
        details: error.errors,
        retryable: false
      };
    } else if (error instanceof ChatbotError) {
      errorResponse = {
        error: error.userMessage,
        type: error.type,
        retryable: error.retryable,
        timestamp: error.timestamp
      };
    } else if (error.name === 'AbortError') {
      errorResponse = {
        error: 'Request timeout',
        type: 'TIMEOUT',
        retryable: true
      };
    }

    return new Response(JSON.stringify(errorResponse), {
      status: error instanceof z.ZodError ? 400 : 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

// Health check endpoint
export async function GET() {
  return new Response(JSON.stringify({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// CORS handling
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}