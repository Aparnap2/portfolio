import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { Redis } from "@upstash/redis";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getEmbeddingsCollection, getVectorStore } from "../src/lib/astradb.js";

class UniversalLoader extends TextLoader {
  async parse(raw) {
    if (!raw || !raw.trim()) return [""]; // Empty or null content
    const jsMatch = raw.match(/window\.YTD\.[^\s]+ = (\[.*\])/s);
    if (jsMatch && jsMatch[1]) {
      try {
        const data = JSON.parse(jsMatch[1]);
        const content = data.map(item => JSON.stringify(item.account || item)).join(" ");
        return [content || ""];
      } catch (e) {
        console.warn(`JS parse fail: ${e.message}`);
        return [raw]; // Fallback to raw text
      }
    }
    return [raw];
  }
}

async function generateEmbeddings() {
  const metrics = {
    totalFiles: 0,
    processed: 0,
    failedFiles: 0,
    emptyFiles: 0,
    embeddingsCreated: 0,
  };

  try {
    let redis;
    try {
      redis = Redis.fromEnv();
      await redis.flushdb();
    } catch (error) {
      console.warn(`Redis init: ${error instanceof Error ? error.message : String(error)}`);
    }

    let vectorStore;
    try {
      vectorStore = await getVectorStore();
      const collection = await getEmbeddingsCollection();
      await collection.deleteMany({});
      console.log("Connected to Astra DB collection");
    } catch (error) {
      throw new Error(`Vector store: ${error instanceof Error ? error.message : String(error)}`);
    }

    const loader = new DirectoryLoader(
      "./data",
      {
        ".txt": (path) => new TextLoader(path),
        ".csv": (path) => new CSVLoader(path),
        ".json": (path) => new JSONLoader(path, "/text"),
        ".js": (path) => new UniversalLoader(path),
      },
      true
    );

    let rawDocs = [];
    try {
      const loadedFiles = await loader.load();
      console.log(`Found ${loadedFiles.length} files in ./data`);
      metrics.totalFiles = loadedFiles.length;
      if (!loadedFiles.length) console.log("Check if ./data exists and has .txt, .csv, .json, or .js files");

      for (const docPromise of loadedFiles) {
        try {
          const doc = await Promise.resolve(docPromise);
          if (doc.pageContent === undefined) {
            console.warn(`Undefined content in ${doc.metadata.source}`);
            doc.pageContent = ""; // Fix undefined
          }
          console.log(`Loaded: ${doc.metadata.source}`);
          rawDocs.push(doc);
        } catch (error) {
          metrics.failedFiles++;
          console.warn(`Load fail ${docPromise.metadata?.source || "unknown"}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      console.warn(`Loader error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const docs = rawDocs.map((doc) => {
      try {
        const filePath = doc.metadata.source.replace(/\\/g, "/");
        const fileName = filePath.split("/").pop()?.split(".")[0] || "unknown";
        let content = doc.pageContent || ""; // Default to empty string if undefined

        if (!content.trim()) {
          metrics.emptyFiles++;
          console.log(`Empty file: ${filePath}`);
          return null;
        }

        content = content.replace(/\s+/g, " ").substring(0, 100000);
        metrics.processed++;

        return {
          pageContent: content,
          metadata: {
            source: filePath,
            identifier: fileName,
            type: filePath.split(".").pop()?.toUpperCase() || "TEXT",
          },
        };
      } catch (error) {
        metrics.failedFiles++;
        console.warn(`Process fail ${doc.metadata.source}: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      }
    }).filter((doc) => doc !== null);

    try {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await splitter.splitDocuments(docs);
      metrics.embeddingsCreated = splitDocs.length;
    
      if (vectorStore) {
        console.log(`Attempting to add ${splitDocs.length} documents to Astra DB`);
        await vectorStore.addDocuments(splitDocs);
        console.log("Documents added to Astra DB successfully");
      }
    } catch (error) {
      console.error(`Embed error: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log(`
      Total files:     ${metrics.totalFiles}
      Processed:       ${metrics.processed}
      Failed files:    ${metrics.failedFiles}
      Empty files:     ${metrics.emptyFiles}
      Embeddings:      ${metrics.embeddingsCreated}
    `);
  } catch (fatalError) {
    console.error(`Fatal: ${fatalError instanceof Error ? fatalError.message : String(fatalError)}`);
    console.log(`
      Partial results:
      Processed:       ${metrics.processed}
      Embeddings:      ${metrics.embeddingsCreated}
    `);
    process.exit(1);
  }
}

generateEmbeddings();