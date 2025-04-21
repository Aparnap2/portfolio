import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { DataAPIClient } from "@datastax/astra-db-ts";
import { AstraDBVectorStore } from "@langchain/community/vectorstores/astradb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const endpoint = process.env.ASTRA_DB_ENDPOINT || "";
const token = process.env.ASTRA_DB_APPLICATION_TOKEN || "";
const collection = process.env.ASTRA_DB_COLLECTION || "";

if (!token || !endpoint || !collection) {
  throw new Error(
    "Please set ASTRA_DB_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, and ASTRA_DB_COLLECTION environment variables."
  );
}

export async function getVectorStore() {
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "embedding-001",
      taskType: "RETRIEVAL_DOCUMENT",
    });

    const vectorStore = await AstraDBVectorStore.fromExistingIndex(embeddings, {
      token,
      endpoint,
      collection,
      collectionOptions: {
        vector: {
          dimension: 768,
          metric: "cosine",
        },
      },
    });

    // Test vector store connection
    const testQuery = "test query";
    const testResults = await vectorStore.similaritySearch(testQuery, 1);
    console.log("Vector store test query results:", testResults);

    return vectorStore;
  } catch (error) {
    console.error("Error initializing vector store:", error);
    throw error;
  }
}

export async function getEmbeddingsCollection() {
  try {
    const client = new DataAPIClient(token);
    const db = client.db(endpoint, { namespace: "default_keyspace" });
    const coll = db.collection(collection);
    console.log("Connected to Astra DB collection:", collection);
    return coll;
  } catch (error) {
    console.error("Error connecting to Astra DB collection:", error);
    throw error;
  }
}