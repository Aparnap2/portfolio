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
  MAX_TOKENS: 250,
  TEMPERATURE: 0.1,
};

const log = {
  info: (...args) => console.log("[INFO]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
  debug: (...args) => console.debug("[DEBUG]", ...args)
};

const redis = Redis.fromEnv();
const sessionTTL = 7200; // 2 hours

async function getSession(sessionId) {
  if (!sessionId) return null;
  try {
    const session = await redis.get(`session:${sessionId}`);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    log.error('Failed to parse session data:', error);
    // Return a fresh session if parsing fails
    return {
      chat_history: [],
      topics_discussed: [],
      user_context: {},
      conversation_stage: 'initial'
    };
  }
}

async function saveSession(sessionId, data) {
  try {
    // Clean the data to remove any non-serializable values
    const cleanData = JSON.parse(JSON.stringify(data));
    await redis.setex(`session:${sessionId}`, sessionTTL, JSON.stringify(cleanData));
  } catch (error) {
    log.error('Failed to serialize session data:', error);
    // Fallback: save only essential serializable data
    const fallbackData = {
      chat_history: data.chat_history || [],
      topics_discussed: data.topics_discussed || [],
      last_intent: data.last_intent || null,
      conversation_stage: data.conversation_stage || 'initial'
    };
    try {
      await redis.setex(`session:${sessionId}`, sessionTTL, JSON.stringify(fallbackData));
    } catch (redisError) {
      log.error('Failed to save session fallback data:', redisError);
      // Continue without Redis - session won't be persistent but won't crash
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

// Intelligent lead extraction from conversation
async function extractLeadIntelligently(query, history) {
  let chatModel;
  try {
    const models = initModels();
    chatModel = models.chatModel;
  } catch (modelErr) {
    log.warn('Lead extraction model initialization failed:', modelErr);
    return null;
  }

  const conversationText = history.slice(-6).map(m => m.content).join('\n') + '\nUser: ' + query;

  const extractionPrompt = `You are an expert lead qualification assistant. Extract structured lead information from this conversation.

Rules:
1. Only extract information that is explicitly mentioned
2. Use null for missing information - don't make up values
3. Name and email are required for lead capture
4. Look for implicit indicators of budget and timeline
5. Score the lead quality from 0-100 based on:
   - Clarity of requirements (25 points)
   - Budget availability (25 points)
   - Timeline urgency (25 points)
   - Decision making authority (25 points)

Return ONLY valid JSON, no explanations or markdown.

Conversation:
${conversationText}

Required format:
{
  "name": "full name or null",
  "email": "email@domain.com or null",
  "company": "company name or null",
  "phone": "phone number or null",
  "industry": "industry or null",
  "requirements": "specific needs or null",
  "budget": "budget range or null",
  "timeline": "timeline or null",
  "company_size": "team size or null",
  "current_challenges": "challenges mentioned or null",
  "conversation_summary": "brief summary of what they're looking for",
  "lead_score": 0-100,
  "capture_ready": true/false
}`;

  try {
    // Add timeout for lead extraction
    const response = await Promise.race([
      chatModel.invoke(extractionPrompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Lead extraction timeout')), 15000)
      )
    ]);

    if (!response || !response.content) {
      log.warn('Lead extraction: Empty response from model');
      return null;
    }

    const content = response.content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(content);

    // Validate required fields
    if (!parsed.name || !parsed.email) {
      log.debug('Lead extraction: Missing required fields', { name: parsed.name, email: parsed.email });
      return { ...parsed, capture_ready: false };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parsed.email)) {
      log.debug('Lead extraction: Invalid email format', { email: parsed.email });
      return { ...parsed, capture_ready: false };
    }

    return parsed;
  } catch (error) {
    if (error.message === 'Lead extraction timeout') {
      log.warn('Lead extraction timed out after 15 seconds');
    } else {
      log.warn('Intelligent lead extraction failed:', error);
    }
    return null;
  }
}

// Generate conversation summary for lead capture
async function generateConversationSummary(history, finalQuery) {
  let chatModel;
  try {
    const models = initModels();
    chatModel = models.chatModel;
  } catch (modelErr) {
    log.warn('Conversation summary model initialization failed:', modelErr);
    return 'User interested in AI automation solutions';
  }

  const recentConversation = history.slice(-8).map(m => `${m.role}: ${m.content}`).join('\n') + `\nUser: ${finalQuery}`;

  const summaryPrompt = `Summarize this conversation in 2-3 sentences, focusing on:
1. What the user is looking for
2. Their main challenges or requirements
3. Any budget or timeline indicators

Conversation:
${recentConversation}

Summary:`;

  try {
    const response = await Promise.race([
      chatModel.invoke(summaryPrompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Conversation summary timeout')), 10000)
      )
    ]);

    if (!response || !response.content) {
      log.warn('Conversation summary: Empty response from model');
      return 'User interested in AI automation solutions';
    }

    return response.content.trim();
  } catch (error) {
    if (error.message === 'Conversation summary timeout') {
      log.warn('Conversation summary timed out after 10 seconds');
    } else {
      log.warn('Conversation summary failed:', error);
    }
    return 'User interested in AI automation solutions';
  }
}

function initModels() {
  try {
    const cache = new UpstashRedisCache({
      client: Redis.fromEnv(),
      ttl: 60 * 5
    });

    const commonConfig = {
      cache,
      maxRetries: 2,
      timeout: 60000, // Increased to 60 second timeout
      maxConcurrency: 5
    };

    const chatModel = new ChatGoogleGenerativeAI({
      ...commonConfig,
      modelName: CONFIG.GEMINI_MODEL,
      streaming: true,
      maxOutputTokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE,
      apiKey: process.env.GOOGLE_API_KEY,
      // Additional timeout configurations
      clientOptions: {
        timeout: 60000,
        maxRetries: 3
      }
    });

    return { chatModel };
  } catch (err) {
    log.error("Model initialization failed:", err);
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
  const history = session.chat_history || [];
  const historyLength = history.length;

  // Simple heuristic-based stage determination
  if (historyLength === 0) return 'initial_greeting';
  if (historyLength <= 2) return 'business_understanding';
  if (historyLength <= 4) return 'solution_exploration';
  return 'lead_capture';
}

function generateProactiveResponse(session, metadata) {
  const stage = determineConversationStage(session);
  const prompts = LEAD_QUALIFICATION_PROMPTS[stage];

  if (prompts && Math.random() > 0.3) { // 70% chance to use proactive prompt
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    return {
      content: prompt,
      metadata: {
        confidence: 0.9,
        intent: 'information_gathering',
        topics: ['lead_qualification'],
        proactive: true
      }
    };
  }

  return null;
}

const CONVERSATION_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", `You are a direct and efficient lead capture bot for Aparna Pradhan, an AI automation expert. Your goal is to qualify leads quickly and aggressively.

Your rules:
1.  **Be concise.** Use short, to-the-point sentences.
2.  **Ask direct questions.** Don't use conversational fluff.
3.  **Always drive towards lead capture.** Your primary goal is to get the user's name, email, and project details.
4.  **Use the capture_lead tool** as soon as you have a name and email.

Key qualification questions:
- What is your business?
- What problem are you trying to solve with AI?
- What is your budget?
- What is your timeline?
- What is your name and email?

Do not engage in general conversation. If the user is not a serious lead, end the conversation.

End with metadata:
[CONFIDENCE: 0.0-1.0]
[INTENT: information|pricing|demo|support|lead_capture|other]
[TOPICS: comma,separated,topics]`],
  new MessagesPlaceholder("chat_history"),
  ["user", "{input}"]
]);

async function handleStream(stream, controller, query, session, sessionId) {
  const encoder = new TextEncoder();
  let fullResponse = "";
  let streamTimeout;
  let controllerClosed = false;

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

  const safeClose = () => {
    try {
      if (!controllerClosed && controller) {
        controller.close();
        controllerClosed = true;
      }
    } catch (error) {
      controllerClosed = true;
    }
  };

  try {
    // Set a timeout for the entire stream operation
    const streamPromise = (async () => {
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
        }, 45000);
      })
    ]);

    clearTimeout(streamTimeout);

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
        session.chat_history.push({ role: 'user', content: query });
        session.chat_history.push({ role: 'assistant', content: responseContent });
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
    safeEnqueue(encoder.encode("data: [DONE]\n\n"));
    safeClose();
  }
}

export const POST = async (req) => {
  let queryContent = "N/A";
  const sessionId = req.headers.get('x-session-id') || uuidv4();
  let timeoutId;

  try {
    // Set overall request timeout
    const requestPromise = (async () => {
      if (!req.body) return newResponse(400, "Missing request body");

      const { messages } = await req.json();
      if (!messages?.length) return newResponse(400, "Empty messages array");

      const lastMsg = messages[messages.length - 1];
      if (!lastMsg?.content?.trim()) return newResponse(400, "Empty last message");

      queryContent = lastMsg.content;
      log.info(`Received query: "${queryContent}" from session: ${sessionId}`);

      let session = await getSession(sessionId);
      if (!session) {
        session = {
          chat_history: [],
          topics_discussed: [],
          user_context: {},
          conversation_stage: 'initial'
        };
      }

      // Initialize models with error handling
      let chatModel;
      try {
        const models = initModels();
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
      const chain = CONVERSATION_PROMPT.pipe(chatModel);

      // Enhanced circuit breaker configuration
      const geminiCircuitBreaker = new CircuitBreaker(3, 60000); // 60s reset timeout

      let stream;
      try {
        stream = await geminiCircuitBreaker.execute(async () => {
          const result = await chain.stream({
            input: queryContent,
            chat_history: history
          });
          return result;
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
      };

      return new Response(
        new ReadableStream({
          start(controller) {
            handleStream(stream, controller, queryContent, session, sessionId);
          }
        }),
        { headers: responseHeaders }
      );
    })();

    // Race between request and timeout
    return await Promise.race([
      requestPromise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new ChatbotError(
            'Request timeout',
            ERROR_TYPES.MODEL_TIMEOUT,
            true,
            'The request took too long to process. Please try again.'
          ));
        }, 60000); // 60 second overall timeout
      })
    ]);

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
      sessionId: sessionId
    });

    const errorResponse = handleChatbotError(chatbotError, { query: queryContent });
    return newResponse(500, errorResponse);
  }
};

function newResponse(status, message, headers = {}) {
  return new Response(JSON.stringify(message), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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