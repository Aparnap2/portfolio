import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { join, extname, relative } from 'path';
import { readdir, writeFile } from 'fs/promises';
import { getVectorStore } from '../src/lib/astradb.js';

// Configuration
const SOURCE_DIRECTORY = process.env.SOURCE_DIR || 'src/data/';
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const BATCH_SIZE = 50; // Reduced batch size to prevent timeouts
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

// Recursive directory walker
async function* walkDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      yield* walkDirectory(fullPath);
    } else {
      yield fullPath;
    }
  }
}

// Process documents in batches with delay
async function processInBatches(documents, processFn) {
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(documents.length / BATCH_SIZE)}`);
    
    try {
      await processFn(batch);
      if (i + BATCH_SIZE < documents.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    } catch (error) {
      console.error(`Error processing batch starting at document ${i}:`, error.message);
      // Save failed batch for retry
      const batchFile = `failed_batch_${Date.now()}.json`;
      await writeFile(batchFile, JSON.stringify(batch, null, 2));
      console.log(`Saved failed batch to ${batchFile} for retry`);
    }
  }
}

// Main processing function
async function processAllFiles() {
  try {
    console.log("Initializing vector store...");
    const vectorStore = await getVectorStore();
    const documents = [];

    // Configure loaders for different file types
    const loaders = {
      '.json': (filePath) => new JSONLoader(filePath, ['/**']),
      '.csv': (filePath) => new CSVLoader(filePath),
      '.js': (filePath) => new TextLoader(filePath),
      '.txt': (filePath) => new TextLoader(filePath),
    };

    // Process all files recursively
    for await (const filePath of walkDirectory(SOURCE_DIRECTORY)) {
      const ext = extname(filePath).toLowerCase();
      const relativePath = relative(SOURCE_DIRECTORY, filePath);

      if (loaders[ext]) {
        console.log(`Processing ${ext} file: ${relativePath}`);
        
        try {
          const loader = loaders[ext](filePath);
          const docs = await loader.load();
          
          // Add metadata to documents
          const processedDocs = docs.map(doc => ({
            ...doc,
            metadata: {
              ...doc.metadata,
              filePath: relativePath,
              fileType: ext.slice(1),
              processedAt: new Date().toISOString()
            }
          }));
          
          documents.push(...processedDocs);
        } catch (error) {
          console.error(`Error processing ${filePath}:`, error.message);
        }
      } else {
        console.log(`Skipping unsupported file type: ${relativePath}`);
      }
    }

    if (documents.length === 0) {
      console.log("No supported files found to process.");
      return;
    }

    console.log(`Loaded ${documents.length} documents from source files`);

    // Split documents into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    console.log("Splitting documents into chunks...");
    const splitDocs = await splitter.splitDocuments(documents);
    console.log(`Created ${splitDocs.length} chunks`);

    // Process in batches to avoid timeouts
    console.log(`Uploading documents in batches of ${BATCH_SIZE}...`);
    await processInBatches(splitDocs, async (batch) => {
      await vectorStore.addDocuments(batch);
    });

    console.log("All documents processed successfully");

  } catch (error) {
    console.error("Fatal error during processing:", error.message);
    process.exit(1);
  }
}

// Execute the processing
processAllFiles()
  .then(() => {
    console.log("Processing completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Processing failed:", error.message);
    process.exit(1);
  });