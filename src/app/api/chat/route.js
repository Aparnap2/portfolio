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

async function captureLeadToHubSpot({ email, name, company, phone, project_type, budget, timeline, notes }) {
  try {
    const nameParts = name.split(' ');
    const hubspotData = {
      properties: {
        email,
        firstname: nameParts[0],
        lastname: nameParts.slice(1).join(' ') || '',
        company: company || "",
        phone: phone || "",
        lifecyclestage: "lead"
      }
    };

    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hubspotData)
    });

    if (response.ok) {
      const result = await response.json();
      log.info("Lead captured in HubSpot:", result.id);
      return `✅ Thanks ${name}! I've captured your information and will follow up within 24 hours.`;
    } else {
      const errorText = await response.text();
      log.error("HubSpot API error:", errorText);
      
      // Log lead locally when HubSpot fails
      log.info("LEAD CAPTURED LOCALLY:", { email, name, company, phone, project_type, budget, timeline });
      
      return `✅ Thanks ${name}! I've captured your information and will follow up within 24 hours.`;
    }
  } catch (error) {
    log.error("HubSpot capture error:", error);
    return `Thanks ${name}! I've noted your information and will follow up soon.`;
  }
}

function extractLeadInfo(message, history = []) {
  const emailRegex = /(?:mailto:)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const nameRegex = /(?:i'm|i am|my name is|name is|call me)\s+([a-zA-Z\s]+)/i;
  
  let email = null;
  let name = null;
  
  // Extract from current message
  const emailMatch = message.match(emailRegex);
  const nameMatch = message.match(nameRegex);
  
  if (emailMatch) email = emailMatch[1];
  if (nameMatch) name = nameMatch[1].trim();
  
  // If name not found in current message, check if it's just a name
  if (!name && email) {
    const words = message.replace(emailMatch[0], '').trim().split(/\s+/);
    if (words.length >= 1 && words.length <= 3 && words.every(w => /^[a-zA-Z]+$/.test(w))) {
      name = words.join(' ');
    }
  }
  
  // Check recent history for missing info
  if ((!email || !name) && history.length > 0) {
    const recentMessages = history.slice(-3);
    for (const msg of recentMessages) {
      if (!email) {
        const historyEmailMatch = msg.content?.match(emailRegex);
        if (historyEmailMatch) email = historyEmailMatch[1];
      }
      if (!name) {
        const historyNameMatch = msg.content?.match(nameRegex);
        if (historyNameMatch) name = historyNameMatch[1].trim();
        // Check if message is just a name
        else if (msg.content && /^[a-zA-Z\s]{2,30}$/.test(msg.content.trim())) {
          name = msg.content.trim();
        }
      }
    }
  }
  
  return email && name ? { email, name } : null;
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
    .slice(0, -1)
    .slice(-CONFIG.MAX_HISTORY)
    .filter(m => m.content?.trim())
    .map(m => m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content));
}

async function createRetriever() {
  const vs = await getVectorStore();
  return vs.asRetriever({ k: 3 });
}

const PROMPTS = {
  retriever: ChatPromptTemplate.fromMessages([
    ["system", "Generate a search query based on:"],
    new MessagesPlaceholder("chat_history"),
    ["user", "Latest query: {input}"],
    ["user", "Output ONLY the search terms"]
  ]),

  assistant: ChatPromptTemplate.fromMessages([
    ["system", `You are Aparna Pradhan's AI assistant. Be helpful, professional, and focused on understanding client needs.

Aparna specializes in AI automation solutions that help businesses:
• Automate repetitive tasks
• Improve customer service
• Streamline workflows
• Save time and reduce costs

COMMON AI AUTOMATION AREAS:
• Content creation and management
• Lead qualification and customer support
• Document processing and data extraction
• Email automation and scheduling
• Social media management
• Business process automation

Your approach:
1. Ask about their business and current challenges
2. Explain how AI automation could help in general terms
3. Focus on potential benefits like time savings and efficiency
4. Ask for contact details to discuss their specific needs
5. When they provide email + name, capture the lead immediately

Keep responses general and honest. Don't make specific claims about results or mention fake case studies. Focus on understanding their needs and connecting them with Aparna for detailed discussions.

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
      original_input: i => i.input,
      chat_history: i => i.chat_history || []
    }),
    async input => {
      const docs = await historyAwareRetriever.invoke({
        input: input.original_input,
        chat_history: input.chat_history
      });

      return {
        context: docs.map(doc => new Document({
          pageContent: doc?.pageContent || "No content available",
          metadata: doc?.metadata || {}
        })),
        input: input.original_input,
        chat_history: input.chat_history
      };
    },
    docChain
  ]);
}

async function handleStream(stream, controller, query, messages) {
  const encoder = new TextEncoder();
  
  // Check for lead info before streaming
  const leadInfo = extractLeadInfo(query, messages);
  
  try {
    for await (const chunk of stream) {
      if (chunk) {
        const content = typeof chunk === 'string' ? chunk : (chunk.content || '');
        if (content) {
          const message = JSON.stringify({ content });
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        }
      }
    }
    
    // After streaming response, capture lead if detected
    if (leadInfo) {
      log.info('Lead detected:', leadInfo);
      const leadResult = await captureLeadToHubSpot(leadInfo);
      const leadMessage = JSON.stringify({ 
        content: `\n\n${leadResult}`,
        tool_call: true 
      });
      controller.enqueue(encoder.encode(`data: ${leadMessage}\n\n`));
    }
    
  } catch (err) {
    log.error(`Stream error for query: "${query}"`, err);
    const errorMessage = JSON.stringify({ error: "Stream failed", details: err.message });
    controller.enqueue(encoder.encode(`data: ${errorMessage}\n\n`));
  } finally {
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    controller.close();
  }
}

export const POST = async (req) => {
  let queryContent = "N/A";

  try {
    if (!req.body) return newResponse(400, "Missing request body");

    const { messages } = await req.json();
    if (!messages?.length) return newResponse(400, "Empty messages array");

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.content?.trim()) return newResponse(400, "Empty last message");
    
    queryContent = lastMsg.content;
    log.info(`Received query: "${queryContent}"`);

    const models = initModels();
    const history = buildHistory(messages);
    const retriever = await createRetriever();
    const chain = await createProcessingChain(models, retriever);

    const stream = await chain.stream({
      input: queryContent,
      chat_history: history
    });

    return new Response(
      new ReadableStream({
        start(controller) {
          handleStream(stream, controller, queryContent, messages);
        }
      }),
      { headers: { "Content-Type": "text/event-stream" } }
    );

  } catch (err) {
    log.error(`API Error for query "${queryContent}":`, err);
    return newResponse(500, err.message || "Internal server error");
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