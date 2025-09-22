import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Redis } from "@upstash/redis";
import { UpstashRedisCache } from "@langchain/community/caches/upstash_redis";
import { RunnableSequence } from "@langchain/core/runnables";
import { v4 as uuidv4 } from "uuid";
import { captureLead } from "../../../lib/lead-capture.js";
import { upsertContact } from "../../../lib/hubspot-service.js";
import { sendSystemNotification } from "../../../lib/discord-service.js";

class ChatbotError extends Error {
  constructor(message, type = 'GENERIC', retryable = false, userMessage = null) {
    super(message);
    this.type = type;
    this.retryable = retryable;
    this.userMessage = userMessage || 'Sorry, I encountered an issue. Please try again.';
    this.timestamp = new Date().toISOString();
  }
}

const CONFIG = {
  GEMINI_MODEL: process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash",
  MAX_HISTORY: 5,
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.1,
  TIMEOUT: 8000,
};

const redis = Redis.fromEnv();
const sessionTTL = 1800; // 30 minutes

// Initialize Gemini model with caching
const model = new ChatGoogleGenerativeAI({
  model: CONFIG.GEMINI_MODEL,
  temperature: CONFIG.TEMPERATURE,
  maxOutputTokens: CONFIG.MAX_TOKENS,
  cache: new UpstashRedisCache({
    client: redis,
    ttl: 1800,
  }),
});

// Optimized prompt for faster responses
const prompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a helpful AI assistant for a software development portfolio. 
  Be concise and professional. Focus on technical solutions and project discussions.
  If someone asks about services, pricing, or wants to work together, ask for their email and project details.
  
  Current context: {context}`],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"]
]);

// Simple session management with Redis only
async function getSession(sessionId) {
  if (!sessionId) return null;
  
  try {
    const session = await redis.get(`chat:${sessionId}`);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
}

async function saveSession(sessionId, data) {
  try {
    await redis.setex(`chat:${sessionId}`, sessionTTL, JSON.stringify(data));
  } catch (error) {
    console.error('Session save error:', error);
  }
}

// Fast lead detection
function shouldCaptureLead(message, history = []) {
  const contactPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i,
    /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/,
  ];

  const intentPatterns = [
    /\b(?:pricing|cost|budget|quote|estimate|hire|project|work together)\b/i,
    /\b(?:contact|email|phone|reach out|get in touch)\b/i,
  ];

  const hasContact = contactPatterns.some(pattern => pattern.test(message));
  const hasIntent = intentPatterns.some(pattern => pattern.test(message));
  
  return hasContact || hasIntent;
}

// Extract basic lead info quickly
function extractLeadInfo(message) {
  const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i);
  const phoneMatch = message.match(/\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/);
  
  const nameMatch = message.match(/\b(?:name|i'm|i am)\s+([A-Za-z\s]+?)(?:\.|,|$)/i);
  const name = nameMatch ? nameMatch[1].trim() : "Visitor";

  return {
    email: emailMatch?.[0] || null,
    phone: phoneMatch?.[0] || null,
    name: name,
    notes: message,
    source: 'chatbot'
  };
}

// Main chat handler
export async function POST(request) {
  const startTime = Date.now();
  console.log('🚀 [CHAT API] Request received at:', new Date().toISOString());
  
  try {
    const requestData = await request.json();
    const { message, sessionId, context = {} } = requestData;
    console.log('📥 [CHAT API] Request data:', {
      messageLength: message?.length || 0,
      sessionId: sessionId || 'new',
      hasContext: Object.keys(context).length > 0,
      contextKeys: Object.keys(context)
    });
    
    if (!message) {
      console.error('❌ [CHAT API] Missing message in request');
      throw new ChatbotError("Message is required", "MISSING_MESSAGE");
    }
    
    console.log('💬 [CHAT API] Processing message:', {
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      length: message.length
    });

    const sessionKey = sessionId || `chat_${uuidv4()}`;
    console.log('🔑 [CHAT API] Session key:', sessionKey);
    
    // Fast session retrieval
    let session = await getSession(sessionKey);
    if (!session) {
      console.log('📝 [CHAT API] Creating new session');
      session = {
        id: sessionKey,
        messages: [],
        context: { ...context, startTime }
      };
    } else {
      console.log('♻️ [CHAT API] Retrieved existing session:', {
        messageCount: session.messages?.length || 0,
        hasContext: !!session.context
      });
    }

    // Limit history for performance
    const recentMessages = session.messages.slice(-CONFIG.MAX_HISTORY);
    
    // Create chain
    const chain = RunnableSequence.from([
      prompt,
      model,
    ]);

    // Get response with timeout
    const response = await Promise.race([
      chain.invoke({
        input: message,
        chat_history: recentMessages,
        context: JSON.stringify(session.context)
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), CONFIG.TIMEOUT)
      )
    ]);

    // Update session efficiently
    session.messages.push(
      new HumanMessage(message),
      new AIMessage(response.content)
    );

    // Keep only recent messages
    if (session.messages.length > CONFIG.MAX_HISTORY * 2) {
      session.messages = session.messages.slice(-CONFIG.MAX_HISTORY * 2);
    }

    // Save session asynchronously
    saveSession(sessionKey, session);

    // Check for lead capture (async)
    console.log('🔍 [CHAT API] Checking for lead capture opportunity');
    if (shouldCaptureLead(message, session.messages)) {
      console.log('🎯 [CHAT API] Lead capture triggered!');
      const leadData = extractLeadInfo(message);
      console.log('📊 [CHAT API] Extracted lead data:', {
        hasEmail: !!leadData.email,
        hasName: !!leadData.name,
        hasPhone: !!leadData.phone,
        email: leadData.email ? leadData.email.substring(0, 10) + '...' : null
      });
      
      if (leadData.email) {
        console.log('💾 [CHAT API] Starting background lead capture for:', leadData.email);
        // Capture lead in background
        upsertContact(leadData).then(result => {
          console.log('✅ [CHAT API] Lead captured successfully:', result.id);
          sendSystemNotification(
            `New lead from chat: ${leadData.name} (${leadData.email})`,
            'success'
          );
        }).catch(error => {
          console.error('❌ [CHAT API] Lead capture failed:', error);
        });
      } else {
        console.log('⚠️ [CHAT API] Lead detected but no email found');
      }
    } else {
      console.log('ℹ️ [CHAT API] No lead capture opportunity detected');
    }

    const processingTime = Date.now() - startTime;
    console.log('✅ [CHAT API] Request completed successfully:', {
      processingTime: `${processingTime}ms`,
      responseLength: response.content?.length || 0,
      sessionId: sessionKey
    });
    
    return Response.json({
      response: response.content,
      sessionId: sessionKey,
      processingTime,
      fast: true
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ [CHAT API] Request failed:', {
      error: error.message,
      stack: error.stack,
      processingTime: `${processingTime}ms`,
      type: error.constructor.name
    });
    
    // Return fallback response
    return Response.json({
      response: "I'm here to help! Could you tell me more about your project?",
      sessionId: sessionId || `chat_${uuidv4()}`,
      error: "timeout",
      fast: false
    });
  }
}

// Health check endpoint
export async function GET() {
  return Response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    features: {
      redis: true,
      hubspot: true,
      discord: true
    }
  });
}