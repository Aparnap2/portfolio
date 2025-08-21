import { getVectorStore } from "../../../lib/astradb.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Redis } from "@upstash/redis";
import { UpstashRedisCache } from "@langchain/community/caches/upstash_redis";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import CircuitBreaker from "../../../lib/circuit_breaker.js";

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
  RETRIEVAL_FAILED: 'RETRIEVAL_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  LEAD_CAPTURE_FAILED: 'LEAD_CAPTURE_FAILED'
};

function handleChatbotError(error, context) {
  log.error('Chatbot error:', {
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
  GEMINI_MODEL: process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash",
  HISTORY_MODEL: process.env.HISTORY_MODEL_NAME || "gemini-2.0-flash-lite",
  MAX_HISTORY: +(process.env.MAX_CHAT_HISTORY || 2),
  MAX_TOKENS: 2500,
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
  const session = await redis.get(`session:${sessionId}`);
  return session ? JSON.parse(session) : null;
}

async function saveSession(sessionId, data) {
  await redis.setex(`session:${sessionId}`, sessionTTL, JSON.stringify(data));
}


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

function calculateRelevance(query, content) {
  if (!query || !content) return 0;
  const queryTerms = query.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();
  const matches = queryTerms.filter(term => contentLower.includes(term)).length;
  return matches / queryTerms.length;
}

function calculateRecency(lastUpdated) {
  if (!lastUpdated) return 0;
  const lastUpdatedDate = new Date(lastUpdated);
  if (isNaN(lastUpdatedDate)) return 0;

  const now = new Date();
  const diffDays = (now - lastUpdatedDate) / (1000 * 60 * 60 * 24);

  return Math.exp(-0.05 * diffDays);
}

function calculateTrust(sourceType) {
  if (!sourceType) return 0.5;
  const trustScores = {
    'official_docs': 1.0,
    'api_reference': 1.0,
    'tutorial': 0.9,
    'blog_post': 0.7,
    'forum_post': 0.6,
    'user_comment': 0.5,
  };
  return trustScores[sourceType.toLowerCase()] || 0.5;
}

async function preprocessQuery(query, sessionContext) {
  const { rephraseModel } = initModels();
  const context = sessionContext.topics_discussed?.join(', ') || '';

  try {
    const improved = await rephraseModel.invoke(
      QUERY_PREPROCESSOR_PROMPT
        .replace('{query}', query)
        .replace('{context}', context)
    );
    return improved.content || query;
  } catch (error) {
    log.warn('Query preprocessing failed:', error);
    return query;
  }
}

async function checkContentFreshness(query, retrievedDocs) {
  const freshnessKeywords = ['pricing', 'latest', 'current', 'new', 'update'];
  const needsFreshData = freshnessKeywords.some(keyword =>
    query.toLowerCase().includes(keyword)
  );

  if (!needsFreshData) return retrievedDocs;

  const oldestDoc = Math.min(...retrievedDocs.map(doc =>
    new Date(doc.metadata?.last_updated || '2024-01-01').getTime()
  ));

  const isStale = Date.now() - oldestDoc > (7 * 24 * 60 * 60 * 1000); // 7 days

  if (isStale) {
    return retrievedDocs.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        freshness_warning: true,
        suggested_action: 'contact_for_latest'
      }
    }));
  }

  return retrievedDocs;
}

function advancedReRanking(query, docs) {
  if (!Array.isArray(docs)) {
    console.warn('advancedReRanking received non-array docs:', typeof docs);
    return [];
  }
  
  const scoredDocs = docs.map(doc => ({
    ...doc,
    relevanceScore: calculateRelevance(query, doc.pageContent),
    recencyScore: calculateRecency(doc.metadata?.last_updated),
    trustScore: calculateTrust(doc.metadata?.source_type)
  }));

  const reranked = scoredDocs
    .map(doc => ({
      ...doc,
      finalScore: (doc.relevanceScore * 0.6) +
                  (doc.recencyScore * 0.2) +
                  (doc.trustScore * 0.2)
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 3);

  return reranked;
}

const RESPONSE_MODES = {
  quick: "Provide a concise, direct answer in 2-3 sentences.",
  detailed: "Provide a comprehensive explanation with examples.",
  steps: "Break down the answer into clear, actionable steps.",
  pricing: "Focus on cost, value proposition, and next steps.",
  technical: "Include technical details and implementation notes."
};

function determineResponseMode(query, sessionContext) {
  // Use intent from PREVIOUS turn if available
  if (sessionContext.last_intent === 'pricing') return 'pricing';

  // Use keywords in the current query
  if (query.toLowerCase().includes('pricing') || query.toLowerCase().includes('cost')) return 'pricing';
  if (query.includes('how to') || query.includes('steps')) return 'steps';
  if (query.includes('explain') || query.includes('detail')) return 'detailed';

  // Use conversation stage from session
  if (sessionContext.conversation_stage === 'follow_up') return 'quick';

  return 'detailed'; // Default
}

const CLARIFYING_TEMPLATES = {
  low_confidence: [
    "To give you the most relevant answer, could you tell me more about {context}?",
    "I want to make sure I understand correctly - are you asking about {topic}?",
    "Could you clarify what specific aspect of {topic} you're most interested in?"
  ],
  missing_context: [
    "To provide the best recommendation, what type of business are you running?",
    "What's your current biggest challenge with {topic}?",
    "Are you looking for a solution for yourself or your team?"
  ],
  multiple_options: [
    "I see a few ways to approach this - are you looking for {option_a} or {option_b}?",
    "This could apply to different scenarios - which best describes your situation: {options}?"
  ]
};

const CONVERSATION_FLOWS = {
  initial: {
    next: ['information_gathering', 'direct_answer'],
    triggers: ['greeting', 'question']
  },
  information_gathering: {
    next: ['solution_proposal', 'clarification'],
    triggers: ['partial_info', 'unclear_intent']
  },
  solution_proposal: {
    next: ['lead_capture', 'follow_up'],
    triggers: ['interested', 'pricing_request']
  },
  lead_capture: {
    next: ['confirmation', 'additional_questions'],
    triggers: ['email_provided', 'contact_requested']
  }
};

function updateConversationStage(currentStage, metadata) {
  const { intent, confidence } = metadata;
  const flow = CONVERSATION_FLOWS[currentStage];
  if (!flow) return currentStage;

  if (intent === 'pricing' && currentStage !== 'lead_capture') {
    return 'solution_proposal';
  }

  if (confidence < 0.5 && currentStage === 'initial') {
    return 'information_gathering';
  }

  if (intent === 'clarification') {
      return 'information_gathering';
  }

  if (intent === 'demo' || intent === 'support') {
      return 'solution_proposal';
  }

  return currentStage;
}

function generateClarifyingQuestion(metadata, query) {
  const { confidence, topics } = metadata;

  if (confidence < 0.5) { // Example threshold
    let template = CLARIFYING_TEMPLATES.low_confidence[
      Math.floor(Math.random() * CLARIFYING_TEMPLATES.low_confidence.length)
    ];
    template = template.replace('{topic}', topics[0] || 'your question');
    template = template.replace('{context}', 'what you mentioned');
    return template;
  }

  return null;
}

function initModels() {
  try {
    const cache = new UpstashRedisCache({
      client: Redis.fromEnv(),
      ttl: 60 * 5
    });

    const commonConfig = { cache, maxRetries: 2 };

    const chatModel = new ChatGoogleGenerativeAI({
      ...commonConfig,
      modelName: CONFIG.GEMINI_MODEL,
      streaming: true,
      maxOutputTokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE
    });

    const rephraseModel = new ChatGoogleGenerativeAI({
      ...commonConfig,
      modelName: CONFIG.HISTORY_MODEL,
      maxOutputTokens: 200,
      temperature: 0
    });

    return { chatModel, rephraseModel };
  } catch (err) {
    log.error("Model initialization failed:", err);
    throw new Error("Failed to initialize AI models");
  }
}

function buildHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-CONFIG.MAX_HISTORY)
    .map(m => (m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)));
}

const astraCircuitBreaker = new CircuitBreaker(5, 60000);

async function createRetriever() {
  const vectorStore = await getVectorStore();

  return {
    invoke: async (query) => {
      console.log("Hybrid retriever query:", query);

      // AstraDB doesn't support MongoDB-style $text search
      // Use semantic search only
      const semanticDocs = await astraCircuitBreaker.execute(() =>
        vectorStore.similaritySearch(query, 5)
      );

      console.log("Retriever results:", semanticDocs.length);
      return semanticDocs.slice(0, 5);
    }
  };
}

const QUERY_PREPROCESSOR_PROMPT = `
Analyze the user query and improve it for better document retrieval:
1. Expand abbreviations and acronyms
2. Add relevant context terms
3. Normalize product/service names
4. Extract key entities

Original: "{query}"
Context: {context}

Return only the improved search query.
`;

const PROMPTS = {
  retriever: ChatPromptTemplate.fromMessages([
    ["system", "Generate a search query based on:"],
    new MessagesPlaceholder("chat_history"),
    ["user", "Latest query: {input}"],
    ["user", "Output ONLY the search terms"]
  ]),

  assistant: ChatPromptTemplate.fromMessages([
    ["system", `You are a professional AI assistant for Aparna Pradhan's portfolio. Your purpose is to answer questions about his skills, projects, and professional experience based on the provided context.

Aparna is a full-stack developer with a specialization in building AI-powered applications.

Your approach:
1.  Be helpful, professional, and concise.
2.  Answer questions directly based on the provided context.
3.  If the context does not contain the answer, say that you don't have that information. Do not make things up.
4.  Do not ask for personal information or try to capture leads.
5.  If asked about contacting Aparna, direct them to the contact information on the website.

If a document in the context has a 'freshness_warning' in its metadata, you MUST inform the user that the information might be outdated and suggest they contact Aparna for the most current details.

CRITICAL: Always end your response with metadata:
[CONFIDENCE: 0.0-1.0] (based on context quality and specificity)
[INTENT: information|contact|other]
[TOPICS: comma,separated,topics]

{response_mode_instruction}

Context: {context}`],
    new MessagesPlaceholder("chat_history"),
    ["user", "{input}"]
  ])
};

async function createProcessingChain(models, retriever) {
  const { chatModel, rephraseModel } = models;

  const historyAwareRetriever = await createHistoryAwareRetriever({
    llm: rephraseModel,
    retriever,
    rephrasePrompt: PROMPTS.retriever
  });

  const docChain = await createStuffDocumentsChain({
    llm: chatModel,
    prompt: PROMPTS.assistant,
    documentPrompt: PromptTemplate.fromTemplate("{page_content}"),
    documentSeparator: "\n\n",
    documentVariableName: "context"
  });

  return RunnableSequence.from([
    RunnablePassthrough.assign({
      original_input: i => i.original_input,
      processed_input: i => i.processed_input,
      chat_history: i => i.chat_history || [],
      session: i => i.session
    }),
    async input => {
      const docs = await historyAwareRetriever.invoke({
        input: input.processed_input, // Use processed query for retriever
        chat_history: input.chat_history
      });

      const docsArray = Array.isArray(docs) ? docs : [];
      const rerankedDocs = advancedReRanking(input.original_input, docsArray); // Use original query for re-ranking

      const freshDocs = await checkContentFreshness(input.original_input, rerankedDocs);

      const responseMode = determineResponseMode(input.original_input, input.session);
      const response_mode_instruction = RESPONSE_MODES[responseMode];

      return {
        context: freshDocs.map(doc => new Document({
          pageContent: doc?.pageContent || "No content available",
          metadata: doc?.metadata || {}
        })),
        input: input.original_input, // Pass original query to final prompt
        chat_history: input.chat_history,
        response_mode_instruction: response_mode_instruction
      };
    },
    docChain
  ]);
}

async function handleStream(stream, controller, query, session, sessionId) {
  const encoder = new TextEncoder();
  let fullResponse = "";

  try {
    // 1. Buffer the full response from the LLM stream
    for await (const chunk of stream) {
      if (chunk) {
        fullResponse += typeof chunk === 'string' ? chunk : (chunk.content || '');
      }
    }

    // 2. Parse metadata from the buffered response
    const metadata = parseResponseMetadata(fullResponse);
    log.info('Original response metadata:', metadata);

    // 3. Decide if we need to ask a clarifying question
    const clarifyingQuestion = generateClarifyingQuestion(metadata, query);

    let responseContent;
    let finalMetadata = metadata;

    if (clarifyingQuestion) {
      responseContent = clarifyingQuestion;
      finalMetadata = {
          confidence: 0.95, // High confidence in asking a question
          intent: 'clarification',
          topics: metadata.topics
      };
      log.info('Generated clarifying question.');
    } else {
      responseContent = fullResponse.replace(/\[(CONFIDENCE|INTENT|TOPICS):[^\]]+\]/g, "").trim();
    }

    // 4. Stream the chosen response content
    const message = JSON.stringify({ content: String(responseContent) });
    controller.enqueue(encoder.encode(`data: ${message}\n\n`));

    // 5. Send the final metadata for the turn
    const metadataMessage = JSON.stringify({ metadata: finalMetadata });
    controller.enqueue(encoder.encode(`data: ${metadataMessage}\n\n`));

    // 6. Update session history
    session.chat_history.push({ role: 'user', content: query });
    session.chat_history.push({ role: 'assistant', content: responseContent });
    session.topics_discussed = [...new Set([...session.topics_discussed, ...finalMetadata.topics])];
    session.last_confidence = finalMetadata.confidence;
    session.last_intent = finalMetadata.intent;
    session.conversation_stage = updateConversationStage(session.conversation_stage, finalMetadata);
    await saveSession(sessionId, session);

  } catch (err) {
    log.error(`Stream error for query: "${query}"`, err);
    const chatbotError = new ChatbotError(err.message, 'GENERIC', false, 'An error occurred during the stream.');
    const errorResponse = handleChatbotError(chatbotError, { query: query });
    const errorMessage = JSON.stringify(errorResponse);
    controller.enqueue(encoder.encode(`data: ${errorMessage}\n\n`));
  } finally {
    // 8. Close the stream
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    controller.close();
  }
}

export const POST = async (req) => {
  let queryContent = "N/A";
  const sessionId = req.headers.get('x-session-id') || uuidv4();

  try {
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

    const processedQuery = await preprocessQuery(queryContent, session);
    log.info(`Processed query: "${processedQuery}"`);

    const models = initModels();
    const history = buildHistory(session.chat_history);
    const retriever = await createRetriever();
    const chain = await createProcessingChain(models, retriever);

    const geminiCircuitBreaker = new CircuitBreaker(3, 30000);
    const stream = await geminiCircuitBreaker.execute(() => chain.stream({
      original_input: queryContent,
      processed_input: processedQuery,
      chat_history: history,
      session: session,
    }));

    const responseHeaders = {
      "Content-Type": "text/event-stream",
      "x-session-id": sessionId,
      'Access-Control-Expose-Headers': 'x-session-id',
    };

    return new Response(
      new ReadableStream({
        start(controller) {
          handleStream(stream, controller, queryContent, session, sessionId);
        }
      }),
      { headers: responseHeaders }
    );

  } catch (err) {
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
    } else {
      chatbotError = new ChatbotError(err.message, 'GENERIC', false);
    }
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