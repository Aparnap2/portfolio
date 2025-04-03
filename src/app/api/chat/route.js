import { getVectorStore } from "../../../lib/astradb";
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
import { RunnableSequence } from "@langchain/core/runnables";

export const POST = async (req) => {
  try {
    const body = await req.json();
    const messages = body.messages;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided." }),
        { status: 400 }
      );
    }

    const chatHistory = messages
      .slice(0, -1)
      .map((m) =>
        m.role === "user"
          ? new HumanMessage(m.content)
          : new AIMessage(m.content)
      );

    const currentMessageContent = messages[messages.length - 1].content;

    const cache = new UpstashRedisCache({
      client: Redis.fromEnv(),
    });

    const rephrasingModel = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash",
      verbose: true,
      cache,
    });

    const chatModel = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash",
      streaming: true,
      cache,
    });

    const retriever = (await getVectorStore()).asRetriever();
    const results = await retriever._getRelevantDocuments(currentMessageContent);

    console.log("Vector DB query results:", results);

    const historyAwareRetrieverPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You MUST generate a search query for every input, even if similar questions were asked before. " +
        "Always analyze the current question independently and create new search terms."
      ],
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
      [
        "user",
        "Generate a vector search query that will find relevant information about Aparna's portfolio and experience. " +
        "Follow these rules strictly:\n" +
        "1. Always include at least 3 key terms from the question\n" +
        "2. Add relevant technical terms and skills that relate to the question\n" +
        "3. Include both specific and broader related terms\n" +
        "4. Format as space-separated keywords and phrases\n" +
        "5. Keep the query between 5-10 terms\n\n" +
        "Current question: {input}\n" +
        "Generate search query:"
      ],
    ]);

    const historyAwareRetriever = await createHistoryAwareRetriever({
      llm: rephrasingModel,
      retriever,
      rephrasePrompt: historyAwareRetrieverPrompt,
      searchKwargs: {
        forceRerank: true,
        minimumRelevanceScore: 0.7,
        maxDocuments: 5
      }
    });

    // ...existing code...
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a chatbot for a personal portfolio website. You impersonate the website's owner. " +
        "Answer the user's questions based on the below context. " +
        "Whenever it makes sense, provide links to pages that contain more information about the topic from the given context. " +
        "Format your messages in markdown format.\n\n" +
        "Context:\n{context}",
      ],
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
    ]);

    const documentChain = await createStuffDocumentsChain({
      llm: chatModel,
      prompt,
      documentPrompt: PromptTemplate.fromTemplate(
        "Page URL: {page_content}"
      ),
    });

    // Create a sequence of retrieving and processing
    const retrievalChain = RunnableSequence.from([
      {
        input: (input) => input.input,
        chat_history: (input) => input.chat_history ?? [],
      },
      {
        originalInput: (input) => input.input,
        context: historyAwareRetriever,
      },
      {
        context: (input) => input.context,
        input: (input) => input.originalInput,
        chat_history: () => chatHistory,
      },
      documentChain,
    ]);

    const stream = await retrievalChain.stream({
      input: currentMessageContent,
      chat_history: chatHistory,
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(`${chunk}\n `);
            }
            controller.close();
          } catch (error) {
            console.error("Error in streaming response:", error);
            controller.error(
              new Response(
                JSON.stringify({ error: "Internal server error" }),
                { status: 500 }
              )
            );
          }
        },
      }),
      {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
};
