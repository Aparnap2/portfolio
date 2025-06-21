// --- START OF FILE route.js ---

import { getVectorStore } from "../../../lib/astradb.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Redis } from "@upstash/redis";
import { UpstashRedisCache } from "@langchain/community/caches/upstash_redis";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";

// --- Configuration ---
const CONFIG = {
  GEMINI_MODEL: process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash",
  HISTORY_MODEL: process.env.HISTORY_MODEL_NAME || "gemini-2.0-flash-lite",
  MAX_HISTORY: +(process.env.MAX_CHAT_HISTORY || 2),
  MAX_TOKENS: 2500,
  TEMPERATURE: 0.1,
  VECTOR_STORE_RETRIES: 3,
  VECTOR_STORE_TIMEOUT: 50000
};

// Enhanced logging
const log = {
  info: (...args) => console.log("[INFO]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
  debug: (...args) => console.debug("[DEBUG]", ...args)
};

/** Initialize models with proper error handling */
function initModels() {
  try {
    log.info("Initializing models with config:", CONFIG);
    const cache = new UpstashRedisCache({
      client: Redis.fromEnv(),
      ttl: 60 * 5 // 5 minute cache
    });

    const commonConfig = {
      cache,
      maxRetries: 2,

    };

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
      temperature: 0.1
    });

    return { chatModel, rephraseModel };
  } catch (err) {
    log.error("Model initialization failed:", err);
    throw new Error("Failed to initialize AI models");
  }
}

/** Validate and format chat history */
function buildHistory(messages) {
  if (!Array.isArray(messages)) {
    log.warn("Invalid messages format, using empty history");
    return [];
  }

  return messages
    .slice(0, -1) // exclude latest message
    .slice(-CONFIG.MAX_HISTORY) // limit history
    .filter(m => m.content?.trim()) // filter empty
    .map(m =>
      m.role === "user"
        ? new HumanMessage(m.content)
        : new AIMessage(m.content)
    );
}

/** Create retriever with retries and timeout */
async function createRetriever() {
  let lastError;

  for (let attempt = 1; attempt <= CONFIG.VECTOR_STORE_RETRIES; attempt++) {
    try {
      log.info(`Connecting to vector store (attempt ${attempt}/${CONFIG.VECTOR_STORE_RETRIES})`);

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Vector store connection timed out after ${CONFIG.VECTOR_STORE_TIMEOUT}ms`)),
          CONFIG.VECTOR_STORE_TIMEOUT)
      );

      // Race the store connection against the timeout
      const vs = await Promise.race([
        getVectorStore(),
        timeoutPromise
      ]);

      log.info("Vector store connected successfully");
      return vs.asRetriever({ k: 3 }); // limit docs

    } catch (err) {
      lastError = err;
      log.warn(`Vector store connection attempt ${attempt} failed:`, err.message);

      // Wait before retrying (exponential backoff)
      if (attempt < CONFIG.VECTOR_STORE_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  log.error("All vector store connection attempts failed");
  throw new Error(`Failed to connect to vector store after ${CONFIG.VECTOR_STORE_RETRIES} attempts: ${lastError.message}`);
}

/** Enhanced prompt templates */
const PROMPTS = {
  retriever: ChatPromptTemplate.fromMessages([
    ["system", "Generate a search query based on:"],
    new MessagesPlaceholder("chat_history"),
    ["user", "Latest query: {input}"],
    ["user", "Output ONLY the search terms"]
  ]),

   assistant: ChatPromptTemplate.fromMessages([
    ["system", `You are Aparna Pradhan (he/him), a full-stack web and React Native developer specializing in AI integration. Your goal is to provide professional, accurate, and helpful responses using the context : {context} to potential clients.

## Core Expertise
- **AI & Machine Learning**: Building RAG-based chatbots, vector databases, and AI-powered applications
- **Full-Stack Development**: MERN stack (MongoDB, Express, React, Node.js)
- **Mobile Development**: Cross-platform apps with React Native
- **Custom SaaS Solutions**: End-to-end development of scalable web applications

## Response Guidelines
1. **Professional Tone**: Maintain a professional yet approachable communication style
2. **Clarity**: Use clear, concise language (2-3 sentences per paragraph)
3. **Formatting**:
   - **Bold** for emphasis
   - Bullet points for lists
   - Code blocks for technical terms
4. **Confidentiality**: Never share sensitive information
5. **Accuracy**: Base responses on your expertise and available context
6. **Call-to-Action**: Guide clients to connect on LinkedIn or GitHub for detailed discussions using the links on website

## Example Response
**How can AI enhance my web application?**
AI can automate repetitive tasks, provide intelligent search capabilities, and personalize user experiences. For example, I've implemented RAG-based chatbots that improved customer support efficiency by 40%.

Let's discuss how we can tailor these solutions to your specific needs.`],
    new MessagesPlaceholder("chat_history"),
    ["user", "{input}"]
  ])
};
/** Process documents to allow any data from Astra DB */
function processDocuments(docs) {
  if (!Array.isArray(docs)) {
    log.warn("Invalid documents array, returning empty");
    return [];
  }

  return docs.map(doc => {
    // Accept any document structure
    return new Document({
      pageContent: doc?.pageContent || "No content available",
      metadata: doc?.metadata || {}
    });
  });
}

/** Main processing chain with error handling */
async function createProcessingChain(models, retriever) {
  try {
    const { chatModel, rephraseModel } = models;

    const historyAwareRetriever = await createHistoryAwareRetriever({
      llm: rephraseModel,
      retriever,
      rephrasePrompt: PROMPTS.retriever,
      verbose: true
    });

    const docChain = await createStuffDocumentsChain({
      llm: chatModel,
      prompt: PROMPTS.assistant,
      documentPrompt: PromptTemplate.fromTemplate(
        "{page_content}"
      ),
      documentSeparator: "\n\n",
      documentVariableName: "context"
    });

    return RunnableSequence.from([
      RunnablePassthrough.assign({
        original_input: i => i.input,
        chat_history: i => i.chat_history || []
      }),
      async input => {
        log.debug("Retrieving context for input:", input.original_input);
        
        const docs = await historyAwareRetriever.invoke({
          input: input.original_input,
          chat_history: input.chat_history
        });

        // Enhanced logging for retrieved documents
        log.info(`Retrieved ${docs.length} documents`);
        docs.forEach((doc, index) => {
          log.debug(`Document ${index + 1}:`, {
            pageContent: doc.pageContent ? doc.pageContent.slice(0, 300) + '...' : 'No content',
            metadata: JSON.stringify(doc.metadata, null, 2)
          });
        });

        return {
          context: processDocuments(docs), // Ensure consistent document processing
          input: input.original_input,
          chat_history: input.chat_history
        };
      },
      docChain
    ]);
  } catch (err) {
    log.error("Chain creation failed:", err);
    throw new Error("Failed to create processing pipeline");
  }
}


/** Stream response with proper error handling */
async function handleStream(stream, controller, requestStartTime, query) {
  const encoder = new TextEncoder();
  try {
    for await (const chunk of stream) {
      if (chunk) {
        // Handle both string and object chunks
        const content = typeof chunk === 'string' 
          ? chunk 
          : (chunk.content || '');
        
        if (content) {
          // Format as SSE message with proper JSON structure
          const message = JSON.stringify({ content });
          log.debug(`[${requestStartTime}] Sending chunk to client for query "${query}":`, content);
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        }
      }
    }
    log.info(`[${requestStartTime}] Stream completed successfully for query: "${query}"`);
    // Done signal is now sent in finally block
  } catch (err) {
    log.error(`[${requestStartTime}] Stream error for query: "${query}"`, err);
    // Encode error message to be sent to client
    const errorMessage = JSON.stringify({ error: "Stream failed", details: err.message });
    controller.enqueue(encoder.encode(`data: ${errorMessage}\n\n`));
  } finally {
    const totalDuration = Date.now() - requestStartTime;
    log.info(`[${requestStartTime}] Stream closed. Total query processing and streaming duration: ${totalDuration}ms for query: "${query}"`);
    controller.enqueue(encoder.encode("data: [DONE]\n\n")); // Ensure DONE is sent before closing
    controller.close();
  }
}

/** API endpoint with comprehensive validation */
export const POST = async (req) => {
  const requestStartTime = Date.now();
  let queryContent = "N/A"; // Default query content for logging if extraction fails

  try {
    // Validate request
    if (!req.body) {
      return newResponse(400, "Missing request body");
    }

    const { messages } = await req.json();
    if (!messages?.length) {
      return newResponse(400, "Empty messages array");
    }

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.content?.trim()) {
      return newResponse(400, "Empty last message");
    }
    queryContent = lastMsg.content; // Assign actual query content
    log.info(`[${requestStartTime}] Received query: "${queryContent}"`);

    // Initialize components
    const models = initModels();
    const history = buildHistory(messages);
    const retriever = await createRetriever();
    const chain = await createProcessingChain(models, retriever);

    // Process and stream
    const stream = await chain.stream({
      input: queryContent,
      chat_history: history
    });

    const streamSetupDuration = Date.now() - requestStartTime;
    log.info(`[${requestStartTime}] Streaming response setup in ${streamSetupDuration}ms for query: "${queryContent}"`);

    return new Response(
      new ReadableStream({
        start(controller) {
          // Pass requestStartTime and queryContent to handleStream
          handleStream(stream, controller, requestStartTime, queryContent);
        }
      }),
      { headers: { "Content-Type": "text/event-stream" } }
    );

  } catch (err) {
    const errorDuration = Date.now() - requestStartTime;
    log.error(`[${requestStartTime}] API Error after ${errorDuration}ms for query "${queryContent}":`, err);
    return newResponse(500, err.message || "Internal server error");
  }
};

// Helper for consistent error responses
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

// Add OPTIONS handler for CORS preflight
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

// --- END OF FILE ---