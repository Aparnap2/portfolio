// --- START OF FILE route.js ---

// import { getVectorStore } from "../../../lib/astradb.js"; // No longer using AstraDB
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Redis } from "@upstash/redis";
import { Client as PgClient } from 'pg'; // Neon DB client
import { UpstashRedisCache } from "@langchain/community/caches/upstash_redis";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
// import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever"; // Will be replaced or modified
import { createRetrievalChain } from "langchain/chains/retrieval";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
import { DynamicTool } from "@langchain/core/tools";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";

// --- Configuration ---
const CONFIG = {
  GEMINI_MODEL: process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash",
  HISTORY_MODEL: process.env.HISTORY_MODEL_NAME || "gemini-2.0-flash-lite", // Used for rephrasing query
  MAX_HISTORY: +(process.env.MAX_CHAT_HISTORY || 2),
  MAX_TOKENS: 2500,
  TEMPERATURE: 0.1,
  // VECTOR_STORE_RETRIES: 3, // Not applicable
  // VECTOR_STORE_TIMEOUT: 50000, // Not applicable
  NEON_DB_QUERY_LIMIT: 3, // Max documents to fetch from Neon DB
  NEON_DB_CONNECTION_TIMEOUT: 5000, // Timeout for Neon DB connection
};

// PostgreSQL Client Configuration
const pgClientConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: CONFIG.NEON_DB_CONNECTION_TIMEOUT,
  // ssl: { // Uncomment and configure if your Neon DB requires SSL
  //   rejectUnauthorized: process.env.NODE_ENV === 'production',
  // }
};

// Redis client for RAG document caching (separate from LLM response cache)
const ragRedisClient = new Redis({
  url: process.env.REDIS_URL, // Ensure these are set in your env
  token: process.env.REDIS_TOKEN,
});
const RAG_CACHE_TTL_SECONDS = process.env.RAG_CACHE_TTL_SECONDS || 60 * 10; // 10 minutes default

// Simple hashing function for cache keys (crypto is preferred in Node.js but might be heavy for edge)
// Using a simple string hash for demonstration; consider a more robust one if needed.
// For serverless, 'crypto' module might not be readily available or performant.
// A simple approach for now, but can be improved.
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'h'+Math.abs(hash).toString(36); // 'h' prefix to ensure valid key start
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

/** Fetch documents from Neon DB based on a search query, with Redis caching */
async function fetchDocumentsFromNeonDB(searchQuery) {
  const cacheKey = `rag_docs:${simpleHash(searchQuery)}`;
  log.info(`Attempting to fetch documents for query "${searchQuery}" from cache with key: ${cacheKey}`);

  try {
    const cachedDocs = await ragRedisClient.get(cacheKey);
    if (cachedDocs) {
      log.info(`Cache hit for key ${cacheKey}. Returning ${cachedDocs.length} documents from cache.`);
      // Documents are stored as JSON strings, so parse them.
      // And then re-hydrate them into Document instances if necessary,
      // or ensure they are stored in a way that direct usage is fine.
      // For now, assuming they are stored as an array of objects that can be mapped to Document.
      const parsedDocs = JSON.parse(cachedDocs);
      return parsedDocs.map(docData => new Document(docData));
    }
  } catch (err) {
    log.warn(`Redis GET error for key ${cacheKey}:`, err.message);
    // Proceed to fetch from DB if cache read fails
  }

  log.info(`Cache miss for key ${cacheKey}. Fetching documents from Neon DB for query: "${searchQuery}"`);
  const client = new PgClient(pgClientConfig);
  try {
    await client.connect();
    log.info("Connected to Neon DB for document retrieval.");

    const queryKeywords = searchQuery.split(/\s+/).filter(kw => kw.length > 0);
    if (queryKeywords.length === 0) {
      log.info("Empty search query after splitting, returning no documents.");
      return [];
    }

    // Build dynamic query for ILIKE search across multiple fields and keywords
    // Using a simple relevance score: count of keyword matches in relevant fields.
    // More sophisticated scoring (like TF-IDF) is out of scope for "normal DB calls".

    let sqlQuery = `
      SELECT
        repo_name,
        description,
        readme_content,
        last_commit_message,
        updated_at_repo,
        package_json_content,
        topics,
        homepage_url,
        (
    `;

    // Add to relevance score for each keyword match in specified fields
    queryKeywords.forEach((keyword, index) => {
      if (index > 0) sqlQuery += " + ";
      sqlQuery += `
          (CASE WHEN description ILIKE '%' || $${index + 1} || '%' THEN 1 ELSE 0 END) +
          (CASE WHEN readme_content ILIKE '%' || $${index + 1} || '%' THEN 1 ELSE 0 END) +
          (CASE WHEN repo_name ILIKE '%' || $${index + 1} || '%' THEN 1 ELSE 0 END) +
          (CASE WHEN last_commit_message ILIKE '%' || $${index + 1} || '%' THEN 1 ELSE 0 END)
      `;
    });
    sqlQuery += `
        ) as relevance_score
      FROM projects
      WHERE (
    `;

    // Add WHERE conditions for each keyword
    queryKeywords.forEach((keyword, index) => {
      if (index > 0) sqlQuery += " OR ";
      sqlQuery += `
          description ILIKE '%' || $${index + 1} || '%' OR
          readme_content ILIKE '%' || $${index + 1} || '%' OR
          repo_name ILIKE '%' || $${index + 1} || '%' OR
          last_commit_message ILIKE '%' || $${index + 1} || '%'
      `;
    });

    sqlQuery += `
      )
      ORDER BY relevance_score DESC, updated_at_repo DESC
      LIMIT ${CONFIG.NEON_DB_QUERY_LIMIT};
    `;

    log.debug("Executing SQL Query:", sqlQuery);
    log.debug("With keywords:", queryKeywords);

    const result = await client.query(sqlQuery, queryKeywords);
    log.info(`Retrieved ${result.rows.length} rows from Neon DB for query "${searchQuery}".`);

    const documents = result.rows.map(row => {
      // Construct pageContent carefully to provide good context
      // Truncate readme_content if it's too long to avoid excessive token usage
      const readmeSummary = row.readme_content
        ? (row.readme_content.length > 1000 ? row.readme_content.substring(0, 997) + "..." : row.readme_content)
        : "Not available";

      const pageContent = `Project: ${row.repo_name}\nDescription: ${row.description || 'N/A'}\nRecent Update: ${row.last_commit_message || 'N/A'}\nREADME Summary: ${readmeSummary}`;

      return new Document({
        pageContent: pageContent,
        metadata: {
          source: row.repo_name,
          updated_at_repo: row.updated_at_repo,
          description: row.description,
          package_json: row.package_json_content,
          topics: row.topics,
          homepage: row.homepage_url,
          relevance_score: row.relevance_score
        }
      });
    });

    // Store in cache if documents were fetched
    if (documents.length > 0) {
      try {
        // Storing the array of Document-like objects directly after stringification.
        // The `Document` class itself might not be directly serializable/deserializable
        // without custom logic, so we store its plain object representation.
        const docsToCache = documents.map(doc => ({ pageContent: doc.pageContent, metadata: doc.metadata }));
        await ragRedisClient.set(cacheKey, JSON.stringify(docsToCache), { ex: RAG_CACHE_TTL_SECONDS });
        log.info(`Stored ${documents.length} documents in cache for key ${cacheKey} with TTL ${RAG_CACHE_TTL_SECONDS}s.`);
      } catch (err) {
        log.warn(`Redis SET error for key ${cacheKey}:`, err.message);
        // Don't let cache write failure prevent returning documents
      }
    }
    return documents;

  } catch (err) {
    log.error(`Neon DB query error for query "${searchQuery}":`, err);
    // Don't throw here, allow the chain to potentially continue with no documents or handle it upstream
    return [];
  } finally {
    if (client) {
      await client.end();
      log.info("Neon DB connection closed after document retrieval.");
    }
  }
}


/** Enhanced prompt templates */
const PROMPTS = {
  retriever: ChatPromptTemplate.fromMessages([
    ["system", "Generate a search query based on:"],
    new MessagesPlaceholder("chat_history"),
    ["user", "Latest query: {input}"],
    ["user", "Output ONLY the search terms"]
  ]),

  // The 'assistant' prompt is now replaced by the 'agentPrompt' inside createProcessingChain
  // assistant: ChatPromptTemplate.fromMessages(...)
};

// --- HubSpot Tools Definition ---
const hubspotTools = [
  new DynamicTool({
    name: "create_hubspot_contact",
    description: "Use this tool to create a new contact in the CRM system. The input must be a JSON string with 'email', 'firstname', 'lastname', and 'phone' properties. 'email' and 'firstname' are required.",
    func: async (input) => {
      try {
        const { email, firstname, lastname, phone } = JSON.parse(input);
        if (!email || !firstname) {
          return "Failed to create contact: The 'email' and 'firstname' properties are required in the JSON input.";
        }

        // Note: In a real app, you might get the base URL from an environment variable.
        // For serverless functions on the same deployment, a relative path is fine.
        const response = await fetch('/api/hubspot/createContact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, firstname, lastname, phone }),
        });

        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.error || `API returned status ${response.status}`);
        }

        return `Successfully created HubSpot contact. Details: ${JSON.stringify(responseData.data)}`;
      } catch (error) {
        log.error("Error in create_hubspot_contact tool:", error);
        return `Failed to execute create_hubspot_contact tool: ${error.message}`;
      }
    },
  }),
  new DynamicTool({
    name: "create_hubspot_ticket",
    description: "Use this tool to create a new support ticket. The input must be a JSON string with 'subject', 'content', and 'contactEmail' properties. All properties are required.",
    func: async (input) => {
      try {
        const { subject, content, contactEmail } = JSON.parse(input);
        if (!subject || !content || !contactEmail) {
          return "Failed to create ticket: 'subject', 'content', and 'contactEmail' are required in the JSON input.";
        }

        const response = await fetch('/api/hubspot/createTicket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, content, contactEmail }),
        });

        const responseData = await response.json();
        if (!response.ok) {
           // If contact not found, provide a helpful message back to the LLM
          if (response.status === 404) {
            return `Failed to create ticket: ${responseData.error}. Advise the user to create the contact first.`;
          }
          throw new Error(responseData.error || `API returned status ${response.status}`);
        }

        return `Successfully created HubSpot ticket. Details: ${JSON.stringify(responseData.data)}`;
      } catch (error) {
        log.error("Error in create_hubspot_ticket tool:", error);
        return `Failed to execute create_hubspot_ticket tool: ${error.message}`;
      }
    },
  }),
];


// The processDocuments function is no longer strictly needed as fetchDocumentsFromNeonDB now returns
// Langchain Document instances directly, with proper fallbacks for null/undefined fields.
// If further processing/sanitization of documents specifically for the LLM context is needed later,
// this function could be reinstated or a new transformation step added.
// function processDocuments(docs) {
//   if (!Array.isArray(docs)) {
//     log.warn("Invalid documents array, returning empty");
//     return [];
//   }
//   return docs.map(doc => {
//     return new Document({
//       pageContent: doc?.pageContent || "No content available",
//       metadata: doc?.metadata || {}
//     });
//   });
// }

/** Main processing chain, now creates a Tool-Calling Agent Executor */
async function createProcessingChain(models) {
  try {
    const { chatModel, rephraseModel } = models;

    // Define the prompt for the agent
    const agentPrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are Aparna Pradhan (he/him), a helpful and professional full-stack developer assistant.
- Your primary goal is to provide accurate, helpful responses based on the provided context about your projects and skills.
- You can also perform actions like creating contacts and support tickets in a CRM system (HubSpot).
- Use the provided context to answer questions about projects, skills, and experience.
- If a user asks to create a contact or a ticket, use the available tools. Ask for any missing information required by the tool.
- Maintain a professional yet approachable tone. Use formatting like bold for emphasis and bullet points for lists.

Context about projects:
{context}`],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"), // Important for agents using tools
    ]);

    // Create a chain to rephrase the input query based on history (for RAG)
    const rephraseQueryChain = RunnableSequence.from([
      (input) => ({ input: input.input, chat_history: input.chat_history }),
      PROMPTS.retriever,
      rephraseModel,
      (output) => output.content,
    ]);

    // Create a chain that performs RAG (retrieval and context formatting)
    const ragChain = RunnableSequence.from([
      {
        rephrased_query: rephraseQueryChain,
        input: (input) => input.input,
        chat_history: (input) => input.chat_history,
      },
      async (input) => {
        const documents = await fetchDocumentsFromNeonDB(input.rephrased_query);
        const context = documents.map(doc => doc.pageContent).join("\n\n");
        log.info(`Generated context for agent: ${context.slice(0, 500)}...`);
        return {
          context: context || "No specific project context found for this query.",
          input: input.input,
          chat_history: input.chat_history,
        };
      }
    ]);

    // Create the agent
    const agent = await createToolCallingAgent({
      llm: chatModel,
      tools: hubspotTools,
      prompt: agentPrompt,
    });

    // Create the Agent Executor
    const agentExecutor = new AgentExecutor({
      agent,
      tools: hubspotTools,
      verbose: true, // Set to true for detailed agent logging
    });

    // Combine the RAG chain with the Agent Executor
    return RunnableSequence.from([
      {
        // Pass the RAG context and other inputs to the agent
        ...ragChain,
        chat_history: (input) => input.chat_history,
        input: (input) => input.input,
      },
      agentExecutor,
    ]);

  } catch (err) {
    log.error("Agent Executor creation failed:", err);
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
    // const retriever = await createRetriever(); // No longer needed as we fetch docs directly
    const chain = await createProcessingChain(models); // No longer passes retriever

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