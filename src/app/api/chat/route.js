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
      modelName: "gemini-1.5-pro",
      verbose: true,
      cache,
    });

    const chatModel = new ChatGoogleGenerativeAI({
      modelName: "gemini-1.5-pro",
      streaming: true,
      cache,
    });

    const retriever = (await getVectorStore()).asRetriever();
    
    const historyAwareRetrieverPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
      [
        "user",
        "Given the above conversation, generate a search query to look up in order to get information relevant to the current question. " +
        "Don't leave out any relevant keywords. Only return the query and no other text.",
      ],
    ]);

    const historyAwareRetriever = await createHistoryAwareRetriever({
      llm: rephrasingModel,
      retriever,
      rephrasePrompt: historyAwareRetrieverPrompt,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a chatbot for a professional portfolio website. You impersonate the website's owner [Aparna Pradhan] who is a full-stack web and React Native expo developer specialising in ai integration with niche specific projects which general llms can't ( finetuning, ai agents, tool calling , rag / retrieval augmented generation, caching , history aware generation, etc )  " +
        "Answer the user's questions based on the below context. " +
        "Whenever it makes sense, provide links " +
        "Format your messages in beautiful markdown format. try to use extensive tags to make it beautifully presented\n\n" +
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