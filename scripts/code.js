import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { TextLoader } from 'langchain/document_loaders/fs/text'; // Keep for .txt if you add them later
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { join, extname } from 'path';
import { readdir, readFile } from 'fs/promises'; // Need readFile for custom JS handling
import { getVectorStore } from '../src/lib/astradb.js';
import { Document } from "@langchain/core/documents";

// --- Configuration --- (Keep as before)
const SOURCE_DIRECTORY = "src/data";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;
const BATCH_SIZE = 50;
const MIN_CHUNK_LENGTH = 30;
const MIN_WORD_COUNT = 5;

// --- cleanText & isValidChunk Functions --- (Keep as before)
const cleanText = (text) => {
    if (typeof text !== 'string') return '';
    let cleaned = text;
    cleaned = cleaned
        .replace(/<[^>]*>/g, ' ')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\{[\s\S]*?\}/g, ' ') // Be cautious if {} are needed in text
        .replace(/\[[\s\S]*?\]/g, ' ') // Be cautious if [] are needed in text
        .replace(/http\S+/g, '')      // Remove URLs
        .replace(/[^\w\s.,!?;'-]/g, ' ')
        .replace(/['"]+/g, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\\n/g, ' ')         // Replace literal '\n' often found in JSON strings
        .replace(/\s+/g, ' ')
        .trim();
    return cleaned;
};

const isValidChunk = (text) => {
    if (!text || typeof text !== 'string') return false;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return (
        text.length >= MIN_CHUNK_LENGTH &&
        wordCount >= MIN_WORD_COUNT &&
        !/^\d+$/.test(text) &&
        !/^[^\w]+$/.test(text)
    );
};

// --- walk Function --- (Keep as before, ensuring it yields .js)
async function* walk(dir) {
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const res = join(dir, entry.name);
            if (entry.isDirectory()) {
                yield* walk(res);
            } else {
                const ext = extname(entry.name).toLowerCase();
                // Make sure .js is included here if walk was modified previously
                if (['.csv', '.js', '.json'].includes(ext)) {
                    yield res;
                }
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error.message);
    }
}

// --- Custom JS Loader ---
async function loadCustomJsData(filePath) {
    console.log(`   Attempting custom JS load for: ${filePath}`);
    const documents = [];
    try {
        const fileContent = await readFile(filePath, 'utf-8');

        // 1. Isolate the JSON-like array part
        const assignmentMatch = fileContent.match(/=\s*(\[[\s\S]*\])/); // Find '= [' structure
        if (!assignmentMatch || !assignmentMatch[1]) {
            console.warn(`   Could not find array assignment structure '= [...]' in ${filePath}. Skipping.`);
            return [];
        }
        const arrayString = assignmentMatch[1];

        // 2. Parse the isolated string as JSON
        const dataArray = JSON.parse(arrayString); // This might throw if not valid JSON

        // 3. Extract text from each object in the array
        if (Array.isArray(dataArray)) {
            dataArray.forEach((item, index) => {
                const profile = item?.profile;
                const description = profile?.description;

                let combinedText = '';
                if (description?.bio && typeof description.bio === 'string') {
                    combinedText += description.bio + ' '; // Add bio
                }
                if (description?.location && typeof description.location === 'string') {
                    combinedText += description.location + ' '; // Add location
                }
                // Optionally add website *description* if it existed, but ignore the URL itself
                // if (description?.website_description && typeof description.website_description === 'string') {
                //    combinedText += description.website_description + ' ';
                // }

                combinedText = combinedText.trim(); // Remove trailing space

                if (combinedText) {
                    // Create a Document. Metadata helps trace back origin.
                    documents.push(new Document({
                        pageContent: combinedText,
                        metadata: { source: filePath, type: 'profile', index: index }
                    }));
                }
            });
            console.log(`   Successfully parsed ${documents.length} profile entries from ${filePath}`);
        } else {
            console.warn(`   Parsed data from ${filePath} is not an array. Skipping.`);
        }

    } catch (error) {
        console.error(`   Error parsing custom JS file ${filePath}:`, error.message);
        // Handle JSON parsing errors or file reading errors
    }
    return documents;
}


// --- processAllFiles Function (Modified) ---
async function processAllFiles() {
    let vectorStore;
    try {
        console.log("Initializing vector store...");
        vectorStore = await getVectorStore();
        console.log("Vector store initialized.");

        const rawDocuments = [];

        console.log(`Starting processing of directory: ${SOURCE_DIRECTORY}`);
        console.log("Looking for .csv, .js, .json files...");

        for await (const filePath of walk(SOURCE_DIRECTORY)) {
            const ext = extname(filePath).toLowerCase();
            let docs = [];

            console.log(`-> Processing file: ${filePath}`);

            try {
                if (ext === ".csv") {
                    // --- RAW CSV TEXT EXTRACTION ---
                    const fileContent = await readFile(filePath, 'utf-8');
                    // Remove newlines inside quotes (optional, for messy CSVs)
                    const normalized = fileContent.replace(/"([^"]*)"/g, m => m.replace(/\n/g, ' '));
                    // Split by lines, then by comma, flatten, and join all cells
                    const allCells = normalized
                        .split('\n')
                        .map(line => line.split(','))
                        .flat()
                        .map(cell => cell.trim())
                        .filter(Boolean)
                        .join(' ');
                    if (allCells) {
                        docs = [new Document({ pageContent: allCells })];
                    }
                    console.log(`   Extracted raw text from CSV (${allCells.length} chars)`);
                } else if (ext === ".js") {
                    docs = await loadCustomJsData(filePath);
                } else if (ext === ".json") {
                    const loader = new JSONLoader(filePath);
                    docs = await loader.load();
                    console.log(`   Loaded ${docs?.length ?? 0} raw JSON part(s)`);
                }

                // Add successfully loaded/parsed documents to raw list
                if (Array.isArray(docs) && docs.length > 0) {
                    // Filter out any potential null/undefined entries just in case
                    const validDocs = docs.filter(d => d && d.pageContent);
                    rawDocuments.push(...validDocs);
                } else if (!Array.isArray(docs)) {
                    console.warn(`   Loader/parser for ${filePath} did not return an array.`);
                }

            } catch (loadError) {
                console.error(`   Error loading or processing file ${filePath} (outside custom handler):`, loadError.message);
            }
        } // End file walk loop

        console.log(`\nTotal raw document parts loaded: ${rawDocuments.length}`);

        if (rawDocuments.length === 0) {
            console.log("No documents found or loaded. Exiting.");
            process.exit(0);
        }

        // --- Text Cleaning and Preparation ---
        console.log("\nCleaning and preparing text content...");
        const cleanedContentDocs = [];
        rawDocuments.forEach((doc, index) => {
            // Ensure doc and pageContent exist and are strings
            if (doc && typeof doc.pageContent === 'string' && doc.pageContent.trim()) {
                const cleaned = cleanText(doc.pageContent); // Apply cleaning
                if (cleaned) {
                    // Create a *new* Document with cleaned content, preserving useful metadata if needed
                    cleanedContentDocs.push(new Document({
                        pageContent: cleaned,
                        metadata: doc.metadata || { source: 'unknown' } // Keep metadata from custom loader or add placeholder
                    }));
                }
            } else {
                console.warn(`   Skipping invalid raw document structure or empty content at index ${index}. Doc:`, doc);
            }
        });
        console.log(`Total documents after initial cleaning: ${cleanedContentDocs.length}`);


        // --- Splitting into Chunks ---
        console.log("\nSplitting documents into chunks...");
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: CHUNK_SIZE,
            chunkOverlap: CHUNK_OVERLAP,
            separators: ["\n\n", "\n", ". ", "? ", "! ", " ", ""],
            keepSeparator: false,
        });
        const chunks = await splitter.splitDocuments(cleanedContentDocs);
        console.log(`Split into ${chunks.length} potential chunks.`);

        // --- Filtering and Validating Chunks ---
        console.log("\nFiltering and validating chunks...");
        const validChunks = chunks.filter(chunk =>
            isValidChunk(chunk.pageContent)
        );
        console.log(`Retained ${validChunks.length} valid chunks after filtering.`);

        if (validChunks.length === 0) {
            console.log("No valid chunks to add to the vector store. Exiting.");
            process.exit(0);
        }

        // --- Adding Valid Chunks to Vector Store ---
        console.log(`\nAdding ${validChunks.length} valid chunks to AstraDB in batches of ${BATCH_SIZE}...`);
        let addedCount = 0;
        for (let i = 0; i < validChunks.length; i += BATCH_SIZE) {
            const batch = validChunks.slice(i, i + BATCH_SIZE);
            // Only pass pageContent if your vector store expects that,
            // otherwise pass the whole Document object (which includes metadata)
            // Most LangChain vector stores expect Document[]
            try {
                await vectorStore.addDocuments(batch); // Send Document objects
                addedCount += batch.length;
                console.log(`   Added batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validChunks.length / BATCH_SIZE)}. Total added: ${addedCount}`);
            } catch (dbError) {
                console.error(`   Error adding batch starting at index ${i} to AstraDB:`, dbError.message);
                // console.error("DB Error Stack:", dbError.stack); // Uncomment for more details
            }
        }

        console.log(`\nProcessing completed. Successfully added ${addedCount} chunks to AstraDB.`);
        process.exit(0); // Success

    } catch (error) {
        console.error("\n--- A critical error occurred during processing ---");
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
        process.exit(1); // Failure
    }
}

processAllFiles();