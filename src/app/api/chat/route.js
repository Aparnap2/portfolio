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
import { Document } from "@langchain/core/documents"; // Import Document

// --- Configuration ---
// Best practice: Move sensitive keys and potentially model names to environment variables
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL_NAME || "gemini-1.5-pro";
const HISTORY_AWARE_RETRIEVER_MODEL_NAME = process.env.HISTORY_AWARE_RETRIEVER_MODEL_NAME || "gemini-1.5-pro"; // Can use a faster/cheaper model if needed
const MAX_CHAT_HISTORY_MESSAGES = 6; // Limit history length to control token usage

// --- Helper Functions ---

/**
 * Initializes Language Models and Cache.
 * @returns {{chatModel: ChatGoogleGenerativeAI, rephrasingModel: ChatGoogleGenerativeAI, cache: UpstashRedisCache}}
 */
function initializeModelsAndCache() {
  console.log("Initializing models and cache...");
  const cache = new UpstashRedisCache({
    client: Redis.fromEnv(), // Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set
  });

  // Model for generating the final response (streaming)
  const chatModel = new ChatGoogleGenerativeAI({
    modelName: GEMINI_MODEL_NAME,
    streaming: true,
    cache,
    // safetySettings: [], // Optional: Adjust safety settings if needed
    // generationConfig: { // Optional: Control output parameters
    //   temperature: 0.7,
    // },
  });

  // Model for rephrasing the input based on history (can be faster/cheaper)
  const rephrasingModel = new ChatGoogleGenerativeAI({
    modelName: HISTORY_AWARE_RETRIEVER_MODEL_NAME,
    verbose: false, // Less verbose for this internal step
    cache,
  });

  console.log("Models and cache initialized.");
  return { chatModel, rephrasingModel, cache };
}

/**
 * Builds chat history in the format expected by Langchain.
 * @param {Array<{role: string, content: string}>} messages - The message history from the request.
 * @returns {Array<HumanMessage | AIMessage>} - Langchain message objects.
 */
function buildChatHistory(messages) {
    // Take the last N messages, excluding the very last one (current user input)
    const historyMessages = messages.slice(0, -1).slice(-MAX_CHAT_HISTORY_MESSAGES);
    return historyMessages.map((m) =>
      m.role === "user"
        ? new HumanMessage(m.content)
        : new AIMessage(m.content)
    );
}

/**
 * Creates the prompt template for the history-aware retriever.
 * @returns {ChatPromptTemplate}
 */
function createHistoryAwareRetrieverPrompt() {
  return ChatPromptTemplate.fromMessages([
    new MessagesPlaceholder("chat_history"),
    ["user", "{input}"],
    [
      "user",
      "Given the conversation history and the latest user question below, generate a concise and focused search query. " +
      "This query will be used to find relevant information about Aparna Pradhan's services, expertise in full-stack web/React Native development, and specialized AI integrations (agents, workflows, RAG, tool calling, automation). " +
      "Focus *only* on keywords and concepts directly related to the user's *current* information need based on the conversation flow. " +
      "If the question is a follow-up, incorporate necessary context from the history. " +
      "Example: If the user asks 'Tell me more about the RAG projects', the query should be something like 'Aparna Pradhan RAG projects examples'. " +
      "Example: If the user asks 'What's your pricing?', query: 'Aparna Pradhan pricing model consultation'. " +
      "Output *only* the search query text, nothing else.",
    ],
  ]);
}

/**
 * Creates the main prompt template for the document chain (final response generation).
 * Enhancements: More detailed persona, clearer instructions on niche expertise, guidance on interaction flow, asking clarifying questions.
 * @returns {ChatPromptTemplate}
 */
function createDocumentChainPrompt() {
  return ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a highly professional and expert lead-generation assistant representing Aparna Pradhan. Your purpose is to engage potential clients, understand their needs, qualify them, and clearly articulate how Aparna's unique skills can solve their problems, ultimately encouraging them to book a consultation call.\n\n" +
      "**About Aparna Pradhan [he]:**\n" +
      "*   **Role:** Full-Stack Web & React Native (Expo) Developer specialized in ai integration in niche .\n" +
      "*   **Specialization:** Deep expertise in building advanced, niche-specific AI integrations that standard LLMs often fail to handle effectively. This includes complex AI agents, automated workflows, sophisticated Retrieval-Augmented Generation (RAG) systems, LLM tool calling, and process automation tailored to specific business needs.\n" +
      "*   **Value Proposition:** Solves complex technical challenges where general AI solutions fall short, delivering tangible business value through custom AI.\n\n" +
      "**Your Core Directives:**\n" +
      "1.  **Persona:** Act as an expert, approachable, and helpful representative. Be concise, clear, and purposeful. Your tone should inspire confidence.\n" +
      "2.  **Goal:** Qualify leads and guide them towards booking a consultation with Aparna. Highlight Aparna's specific AI expertise relevant to the user's query.\n" +
      "3.  **Engagement:** Actively listen. If a query is ambiguous or lacks detail (e.g., 'tell me about AI'), ask clarifying questions to understand their specific needs or challenges before providing solutions (e.g., 'Could you tell me a bit more about the specific AI challenge you're facing or the goal you want to achieve?').\n" +
      "4.  **Niche Focus:** Consistently emphasize Aparna's specialization in *advanced* AI integrations (agents, workflows, RAG, tool calling, automation). Explain *why* this is different from generic AI development when relevant.\n" +
      "5.  **Problem Solving:** Frame answers around solving client problems using Aparna's skills. Use examples if possible (drawing from the provided context).\n" +
      "6.  **Call to Action:** When appropriate (e.g., after addressing specific questions, identifying a potential fit), gently guide the user towards the next step: booking a consultation call with Aparna. Provide a link if available in the context, or suggest it as the best way to discuss specifics by clicking the hire me btn on the website .\n" +
      "7.  **Conciseness:** Keep answers relevant and reasonably short , use nice markdown format. Avoid walls of text. Use Markdown (headers, bolding, bullet points, links) for readability.\n" +
      "8.  **Context Usage:** Utilize the provided context snippets ({context}) to answer questions accurately. Reference the source of information if helpful.\n" +
      "9.  **Handling Irrelevance:** If the user asks something completely unrelated to Aparna's services, politely steer the conversation back. State your purpose (e.g., 'I'm here to help with questions about Aparna Pradhan's web development and specialized AI integration services. How can I assist you with that?'). Do not invent answers if the information isn't available.\n\n" +
      "**Relevant Information Snippets:**\n{context}\n\n" +
      "--- End of System Instructions ---",
    ],
    new MessagesPlaceholder("chat_history"),
    ["user", "{input}"],
  ]);
}

// ... (imports and other functions remain the same) ...

/**
 * Creates the main RunnableSequence for the chat logic.
 * @param {ChatGoogleGenerativeAI} rephrasingModel
 * @param {VectorStoreRetriever} retriever
 * @param {ChatGoogleGenerativeAI} chatModel
 * @param {Array<HumanMessage | AIMessage>} chatHistory - The pre-formatted chat history.
 * @returns {RunnableSequence}
 */
async function createFullChain(rephrasingModel, retriever, chatModel, chatHistory) {
  console.log("Creating history-aware retriever...");
  const historyAwareRetrieverPrompt = createHistoryAwareRetrieverPrompt();
  const historyAwareRetriever = await createHistoryAwareRetriever({
      llm: rephrasingModel,
      retriever,
      rephrasePrompt: historyAwareRetrieverPrompt,
  });
  console.log("History-aware retriever created.");

  console.log("Creating document chain...");
  const documentChainPrompt = createDocumentChainPrompt();
  const documentPrompt = PromptTemplate.fromTemplate(
    // Ensure this template matches the fields you reliably have or handle defaults below
    "Source: {metadata_source}\nContent: {page_content}\n---"
  );
  const documentChain = await createStuffDocumentsChain({
      llm: chatModel,
      prompt: documentChainPrompt,
      documentPrompt: documentPrompt, // Use the modified template variable name if needed
      documentSeparator: "\n\n",
  });
  console.log("Document chain created.");

  console.log("Creating main retrieval chain sequence...");
  const retrievalChain = RunnableSequence.from([
      RunnablePassthrough.assign({
         original_input: (input) => input.input,
         chat_history: (input) => input.chat_history ?? [],
      }),
      (input) => {
        console.log(`Generating search query for input: "${input.original_input}" with history length: ${input.chat_history.length}`);
        return historyAwareRetriever.invoke({input: input.original_input, chat_history: input.chat_history})
            .then(docs => {
                console.log(`Retrieved ${docs.length} documents.`);

                // --- START FIX: Process documents to ensure metadata.source exists ---
                const processedDocs = docs.map((doc, index) => {
                    // 1. Ensure metadata object exists
                    const metadata = doc.metadata ?? {};
                    // 2. Get source, provide default if missing or not a string
                    let source = metadata.source;
                    if (typeof source !== 'string' || source.trim() === '') {
                        console.warn(`Document at index ${index} missing or has invalid 'metadata.source'. Assigning default.`);
                        source = 'Unknown Source';
                    }
                    // 3. Create a *new* metadata object for the template to avoid potential side effects
                    //    Use a different key name 'metadata_source' for clarity in the template
                    return new Document({
                        pageContent: doc.pageContent,
                        metadata: {
                            ...metadata, // Keep original metadata
                            metadata_source: source // Add the safe source field
                        }
                    });
                });
                // --- END FIX ---

                console.log(`Processed ${processedDocs.length} documents for context.`);
                return { context: processedDocs, original_input: input.original_input, chat_history: input.chat_history };
            })
            .catch(err => {
                console.error("Error invoking historyAwareRetriever:", err);
                return { context: [], original_input: input.original_input, chat_history: input.chat_history };
            });
      },
      (input) => {
         console.log("Invoking document chain with context and history...");
         // The documentChain will now use the 'metadata_source' field from the processed docs
         return documentChain.invoke({
            input: input.original_input,
            context: input.context,
            chat_history: chatHistory,
         });
       }
  ]);
  console.log("Main retrieval chain sequence created.");
  return retrievalChain;
}

// ... (rest of the file: streamResponse, POST handler, etc.) remains the same ...

/**
 * Handles the streaming of the response back to the client.
 * @param {ReadableStream<string>} stream - The stream from the Langchain chain.
 * @param {WritableStreamDefaultController} controller - The controller for the Response stream.
 */
async function streamResponse(stream, controller) {
  const encoder = new TextEncoder();
  try {
    for await (const chunk of stream) {
      // Ensure chunk is a string before encoding
      if (typeof chunk === 'string') {
        controller.enqueue(encoder.encode(chunk)); // Stream chunks as they arrive
      } else {
         // If the chunk isn't a string (might happen with some intermediate chain steps if not handled properly)
         // Log it for debugging, but don't send to client unless it's meaningful
         console.warn("Received non-string chunk from stream:", chunk);
         // You might want to serialize complex objects if they are intended output
         // controller.enqueue(encoder.encode(JSON.stringify(chunk)));
      }
    }
    console.log("Stream finished successfully.");
    controller.close();
  } catch (error) {
    console.error("Error processing stream:", error);
    // Attempt to send an error message back through the stream if possible
    try {
      controller.enqueue(encoder.encode(`\n\n[ERROR: Sorry, an internal error occurred while processing your request.]`));
    } catch (enqueueError) {
       console.error("Failed to enqueue error message:", enqueueError)
    }
    controller.close(); // Close the stream even on error
  }
}

// --- API Route Handler ---

export const POST = async (req) => {
  console.log("Received POST request to chat API.");
  try {
    const body = await req.json();
    const messages = body.messages; // Expecting format: [{ role: "user" | "assistant", content: "..." }]

    // Basic Input Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("Validation Error: No messages or invalid format provided.");
      return new Response(
        JSON.stringify({ error: "Invalid input: 'messages' array is required." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const currentMessageContent = messages[messages.length - 1].content;
    if (!currentMessageContent || typeof currentMessageContent !== 'string' || currentMessageContent.trim() === "") {
       console.error("Validation Error: Last message content is empty.");
       return new Response(
         JSON.stringify({ error: "Invalid input: Last message content cannot be empty." }),
         { status: 400, headers: { 'Content-Type': 'application/json' } }
       );
    }

    console.log(`Current user input: "${currentMessageContent}"`);

    // 1. Initialize Models and Cache
    const { chatModel, rephrasingModel } = initializeModelsAndCache();

    // 2. Prepare Chat History
    const chatHistory = buildChatHistory(messages);
    console.log(`Built chat history with ${chatHistory.length} messages.`);

    // 3. Get Vector Store Retriever
    console.log("Initializing vector store retriever...");
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever({
      // k: 5 // Optional: Configure number of documents to retrieve
    });
    console.log("Vector store retriever initialized.");

    // 4. Create the Full Processing Chain
    const chain = await createFullChain(rephrasingModel, retriever, chatModel, chatHistory);

    // 5. Invoke the Chain and Stream the Response
    console.log("Invoking the main chain for streaming...");
    const stream = await chain.stream({
      input: currentMessageContent,
      chat_history: chatHistory, // Pass history for context/rephrasing steps
    });

    // 6. Return Streaming Response
    return new Response(
      new ReadableStream({
        start(controller) {
          console.log("Starting response stream.");
          // Start processing the Langchain stream
          streamResponse(stream, controller).catch(error => {
            console.error("Error in streamResponse:", error);
            controller.error(error); // Propagate error to the ReadableStream
          });
        },
        cancel(reason) {
            console.warn("Response stream cancelled.", reason);
            // You might add logic here to cancel the underlying Langchain stream if possible/needed
        }
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8", // Correct content type for streaming text
          "X-Content-Type-Options": "nosniff", // Security header
          "Transfer-Encoding": "chunked", // Often used with streams
        },
      }
    );

  } catch (error) {
    console.error("--- UNHANDLED ERROR IN POST HANDLER ---");
    console.error(error);
    // Generic error for the client
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred processing your request." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// --- END OF FILE route.js ---