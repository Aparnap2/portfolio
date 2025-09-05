// src/lib/ai-chat.js
// Simplified AI chat service without vector DB dependencies

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Redis } from "@upstash/redis";
import { shouldCaptureLead, generateLeadCapturePrompt } from './lead-capture.js';

const CONFIG = {
  GEMINI_MODEL: process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash",
  MAX_HISTORY: +(process.env.MAX_CHAT_HISTORY || 5),
  MAX_TOKENS: 2500,
  TEMPERATURE: 0.1,
  SESSION_TTL: 7200, // 2 hours
};

const redis = Redis.fromEnv();

/**
 * Initialize AI models
 */
function initModels() {
  const chatModel = new ChatGoogleGenerativeAI({
    modelName: CONFIG.GEMINI_MODEL,
    maxOutputTokens: CONFIG.MAX_TOKENS,
    temperature: CONFIG.TEMPERATURE,
  });

  return { chatModel };
}

/**
 * Get or create chat session
 */
async function getSession(sessionId) {
  if (!sessionId) return null;
  const session = await redis.get(`chat_session:${sessionId}`);
  return session ? JSON.parse(session) : null;
}

/**
 * Save chat session
 */
async function saveSession(sessionId, data) {
  await redis.setex(`chat_session:${sessionId}`, CONFIG.SESSION_TTL, JSON.stringify(data));
}

/**
 * Create system prompt for portfolio assistant
 */
const SYSTEM_PROMPT = `You are Aparna's AI assistant for her portfolio website. You help visitors learn about Aparna's skills, experience, and services.

ABOUT APARNA:
- Full-stack developer with expertise in React, Node.js, Python, and cloud technologies
- Specializes in building scalable web applications and AI-powered solutions
- Available for freelance projects and consulting
- Experienced in e-commerce, fintech, and SaaS applications
- Strong background in database design, API development, and system architecture

YOUR ROLE:
- Answer questions about Aparna's skills, experience, and services
- Help visitors understand how Aparna can help with their projects
- Identify potential leads and guide them toward contact
- Be professional, helpful, and engaging
- Always provide accurate information about Aparna's capabilities

LEAD CAPTURE:
- When someone shows interest in hiring, pricing, or working together, guide them to share contact information
- Look for buying signals like: "pricing", "cost", "hire", "project", "interested", "demo", "quote"
- Be natural and helpful, not pushy

RESPONSE FORMAT:
Always end your responses with metadata in this format:
[CONFIDENCE: 0.8] [INTENT: pricing] [TOPICS: web development, react]

CONFIDENCE: 0.0-1.0 (how confident you are in understanding the query)
INTENT: One of: general, pricing, demo, technical, contact, other
TOPICS: Comma-separated relevant topics discussed

Remember: You're representing Aparna professionally. Be knowledgeable, helpful, and personable.`;

/**
 * Create chat prompt template
 */
function createChatPrompt() {
  return ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"]
  ]);
}

/**
 * Parse response metadata
 */
function parseResponseMetadata(response) {
  const confidenceMatch = response.match(/\[CONFIDENCE: ([\d.]+)\]/);
  const intentMatch = response.match(/\[INTENT: (\w+)\]/);
  const topicsMatch = response.match(/\[TOPICS: ([^\]]+)\]/);

  return {
    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
    intent: intentMatch ? intentMatch[1] : 'other',
    topics: topicsMatch ? topicsMatch[1].split(',').map(t => t.trim()) : []
  };
}

/**
 * Clean response by removing metadata
 */
function cleanResponse(response) {
  return response
    .replace(/\[CONFIDENCE: [\d.]+\]/g, '')
    .replace(/\[INTENT: \w+\]/g, '')
    .replace(/\[TOPICS: [^\]]+\]/g, '')
    .trim();
}

/**
 * Process chat message
 */
export async function processChatMessage(message, sessionId) {
  const startTime = Date.now();
  
  try {
    console.log(`💬 Processing chat message for session ${sessionId}`);
    
    // Get or create session
    let session = await getSession(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        history: [],
        topics_discussed: [],
        conversation_stage: 'initial',
        created_at: new Date().toISOString()
      };
    }

    // Initialize AI model
    const { chatModel } = initModels();
    const prompt = createChatPrompt();

    // Prepare chat history (limit to recent messages)
    const recentHistory = session.history.slice(-CONFIG.MAX_HISTORY);
    const chatHistory = recentHistory.map(msg => 
      msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    );

    // Generate response
    const chain = prompt.pipe(chatModel);
    const response = await chain.invoke({
      input: message,
      chat_history: chatHistory
    });

    const responseText = response.content;
    const metadata = parseResponseMetadata(responseText);
    const cleanedResponse = cleanResponse(responseText);

    // Check if we should capture lead
    const leadCapture = shouldCaptureLead(message, metadata, session.history);
    
    let finalResponse = cleanedResponse;
    let shouldAskForContact = false;

    if (leadCapture) {
      if (leadCapture.should_capture) {
        // We have lead info, this will be handled by the main chat route
        console.log('🎯 Lead information detected in message');
      } else if (leadCapture.should_ask) {
        // Generate lead capture prompt
        const capturePrompt = generateLeadCapturePrompt(metadata);
        finalResponse += `\n\n${capturePrompt}`;
        shouldAskForContact = true;
        console.log('📞 Adding lead capture prompt to response');
      }
    }

    // Update session
    session.history.push(
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: finalResponse, timestamp: new Date().toISOString() }
    );

    // Update topics discussed
    if (metadata.topics.length > 0) {
      metadata.topics.forEach(topic => {
        if (!session.topics_discussed.includes(topic)) {
          session.topics_discussed.push(topic);
        }
      });
    }

    // Update conversation stage based on intent
    if (metadata.intent === 'pricing' || metadata.intent === 'demo') {
      session.conversation_stage = 'solution_proposal';
    } else if (metadata.intent === 'contact') {
      session.conversation_stage = 'lead_capture';
    } else if (metadata.confidence < 0.5) {
      session.conversation_stage = 'information_gathering';
    }

    session.last_intent = metadata.intent;
    session.last_confidence = metadata.confidence;
    session.updated_at = new Date().toISOString();

    // Save session
    await saveSession(sessionId, session);

    console.log(`✅ Chat message processed in ${Date.now() - startTime}ms`);

    return {
      response: finalResponse,
      metadata: {
        ...metadata,
        shouldAskForContact,
        leadCapture,
        processingTime: Date.now() - startTime,
        sessionId
      },
      session
    };

  } catch (error) {
    console.error('❌ Error processing chat message:', error);
    
    return {
      response: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment, or feel free to reach out directly if you need immediate assistance.",
      metadata: {
        confidence: 0,
        intent: 'error',
        topics: [],
        error: error.message,
        processingTime: Date.now() - startTime
      },
      session: null
    };
  }
}

/**
 * Get chat history for session
 */
export async function getChatHistory(sessionId, limit = 20) {
  const session = await getSession(sessionId);
  if (!session) return [];
  
  return session.history.slice(-limit);
}

/**
 * Clear chat session
 */
export async function clearChatSession(sessionId) {
  await redis.del(`chat_session:${sessionId}`);
  console.log(`🗑️ Chat session ${sessionId} cleared`);
}

/**
 * Get session statistics
 */
export async function getSessionStats(sessionId) {
  const session = await getSession(sessionId);
  if (!session) return null;

  return {
    messageCount: session.history.length,
    topicsDiscussed: session.topics_discussed,
    conversationStage: session.conversation_stage,
    lastIntent: session.last_intent,
    lastConfidence: session.last_confidence,
    createdAt: session.created_at,
    updatedAt: session.updated_at
  };
}

/**
 * Health check for AI chat service
 */
export async function healthCheck() {
  try {
    const { chatModel } = initModels();
    
    // Test with a simple message
    const testResponse = await chatModel.invoke("Hello, this is a health check.");
    
    return {
      status: 'healthy',
      model: CONFIG.GEMINI_MODEL,
      responseLength: testResponse.content.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      model: CONFIG.GEMINI_MODEL,
      timestamp: new Date().toISOString()
    };
  }
}

export default {
  processChatMessage,
  getChatHistory,
  clearChatSession,
  getSessionStats,
  healthCheck
};