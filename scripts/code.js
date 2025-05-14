import dotenv from "dotenv";
dotenv.config({ path: ".env" }); // Ensure your .env file has ASTRA_DB_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_COLLECTION

import { CSVLoader } from 'langchain/document_loaders/fs/csv'; // Though we'll do custom CSV for better formatting
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { join, extname } from 'path';
import { readdir, readFile } from 'fs/promises';
import { getVectorStore } from '../src/lib/astradb.js'; // Assuming this path is correct
import { Document } from "@langchain/core/documents";

// --- Configuration ---
const SOURCE_DIRECTORY = "src/data";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;
const BATCH_SIZE = 50; // Number of documents to add to AstraDB at a time
const MIN_CHUNK_LENGTH = 30; // Minimum character length for a chunk to be considered valid
const MIN_WORD_COUNT = 5; // Minimum word count for a chunk

// --- Text Cleaning Utility ---
const cleanText = (text) => {
    if (typeof text !== 'string') return '';
    let cleaned = text;
    cleaned = cleaned
        .replace(/<[^>]*>/g, ' ')       // Remove HTML tags
        .replace(/```[\s\S]*?```/g, ' ') // Remove markdown code blocks
        // .replace(/\{[\s\S]*?\}/g, ' ') // Removing general curly braces might be too aggressive
        // .replace(/\[[\s\S]*?\]/g, ' ') // Removing general square brackets might be too aggressive
        .replace(/http\S+/g, '')         // Remove URLs
        .replace(/[^\w\s.,!?;:'\-]/gu, ' ') // Remove most special characters, keep some punctuation, unicode aware
        .replace(/['"]+/g, '')           // Remove single and double quotes that are standalone
        .replace(/[_-]+/g, ' ')          // Replace underscores and hyphens with spaces
        .replace(/\\n/g, ' ')            // Replace literal '\n' (often in JSON strings) with space
        .replace(/\s+/g, ' ')            // Normalize whitespace (multiple spaces to single)
        .trim();
    return cleaned;
};

// --- Chunk Validation Utility ---
const isValidChunk = (text) => {
    if (!text || typeof text !== 'string') return false;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return (
        text.length >= MIN_CHUNK_LENGTH &&
        wordCount >= MIN_WORD_COUNT &&
        !/^\d+$/.test(text) &&          // Not purely numeric
        !/^[^\w\s]+$/.test(text)      // Not purely punctuation/symbols (allows whitespace)
    );
};

// --- File System Walker ---
async function* walk(dir) {
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const res = join(dir, entry.name);
            if (entry.isDirectory()) {
                yield* walk(res);
            } else {
                const ext = extname(entry.name).toLowerCase();
                if (['.csv', '.js', '.json'].includes(ext)) {
                    yield res;
                }
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error.message);
    }
}

// --- Custom CSV Loader for Structured Text ---
async function loadCsvData(filePath) {
    console.log(`   Attempting custom CSV load for: ${filePath}`);
    const documents = [];
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        if (lines.length < 1) { // Need at least a header conceptually, or just data
            console.warn(`   CSV file ${filePath} is empty or has no content lines. Skipping.`);
            return [];
        }

        // Find the first row that looks like a header (has non-empty cells)
        let headerLineIndex = 0;
        let headers = [];
        for (let i = 0; i < lines.length; i++) {
            const potentialHeaders = lines[i].split(',').map(h => h.trim());
            if (potentialHeaders.some(h => h !== '')) {
                headers = potentialHeaders;
                headerLineIndex = i;
                break;
            }
        }

        if (headers.length === 0) {
            console.warn(`   Could not determine headers in CSV file ${filePath}. Treating as raw lines.`);
            // Fallback: treat each line as a document
            lines.forEach((line, index) => {
                if (line.trim()) {
                    documents.push(new Document({
                        pageContent: line.trim(),
                        metadata: { source: filePath, type: 'csv_raw_line', line: index + 1 }
                    }));
                }
            });
            return documents;
        }
        
        console.log(`   CSV Headers for ${filePath}: ${headers.filter(h => h).join(', ')}`);

        // Process data rows
        for (let i = headerLineIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            const values = line.split(','); // Not handling commas within quoted fields robustly here.
                                            // For complex CSVs, a proper CSV parsing library is better.
            let rowText = "";
            let hasData = false;
            values.forEach((value, index) => {
                const header = headers[index] ? headers[index].trim() : '';
                const cellValue = value.trim();
                if (header && cellValue) { // Only include if both header and value are non-empty
                    rowText += `${header}: ${cellValue}. `;
                    hasData = true;
                } else if (!header && cellValue) { // Value exists but header is empty (like leading commas)
                    // Optionally include these if they are meaningful
                    // rowText += `Unnamed Column ${index + 1}: ${cellValue}. `;
                    // hasData = true;
                }
            });

            if (hasData) {
                documents.push(new Document({
                    pageContent: rowText.trim(),
                    metadata: { source: filePath, type: 'csv_row', line: i + 1 }
                }));
            }
        }
        console.log(`   Successfully parsed ${documents.length} data entries from CSV ${filePath}`);

    } catch (error) {
        console.error(`   Error parsing CSV file ${filePath}:`, error.message);
    }
    return documents;
}


// --- Custom JS Loader for 'window.YTD.follower.part0' structure ---
async function loadCustomJsData(filePath) {
    console.log(`   Attempting custom JS load for: ${filePath}`);
    const documents = [];
    try {
        const fileContent = await readFile(filePath, 'utf-8');

        // Regex to find the array assignment (e.g., window.YTD.follower.part0 = [...])
        const assignmentMatch = fileContent.match(/=\s*(\[[\s\S]*?\])\s*;?/);
        if (!assignmentMatch || !assignmentMatch[1]) {
            console.warn(`   Could not find array assignment structure '= [...]' in ${filePath}. Skipping.`);
            return [];
        }
        const arrayString = assignmentMatch[1];

        let dataArray;
        try {
            dataArray = JSON.parse(arrayString); // The array part should be valid JSON
        } catch (parseError) {
            console.error(`   Error parsing the extracted array from JS file ${filePath} as JSON:`, parseError.message);
            return [];
        }

        if (Array.isArray(dataArray)) {
            dataArray.forEach((item, index) => {
                // Specifically for the "follower" structure:
                // { "follower" : { "accountId" : "123", "userLink" : "https://..." } }
                if (item && item.follower && typeof item.follower.accountId === 'string') {
                    let textContent = `Twitter follower data: Account ID is ${item.follower.accountId}.`;
                    if (item.follower.userLink && typeof item.follower.userLink === 'string') {
                        // The userLink will likely be removed by cleanText, but we include it here
                        // for completeness before cleaning.
                        textContent += ` User link was ${item.follower.userLink}.`;
                    }
                    
                    documents.push(new Document({
                        pageContent: textContent.trim(),
                        metadata: { source: filePath, type: 'twitter_follower', index: index }
                    }));
                } else {
                    // Handle other potential structures or log a warning
                    // console.warn(`   Skipping item at index ${index} in ${filePath} due to unexpected structure:`, item);
                }
            });
            console.log(`   Successfully parsed ${documents.length} entries from JS file ${filePath}`);
        } else {
            console.warn(`   Parsed data from ${filePath} (after regex extraction) is not an array. Skipping.`);
        }

    } catch (error) {
        console.error(`   Error processing custom JS file ${filePath}:`, error.message);
    }
    return documents;
}

// --- Main Processing Function ---
async function processAllFiles() {
    let vectorStore;
    try {
        console.log("Initializing vector store...");
        vectorStore = await getVectorStore();
        if (!vectorStore) {
            console.error("Failed to initialize vector store. Exiting.");
            process.exit(1);
        }
        console.log("Vector store initialized.");

        const rawDocuments = [];

        console.log(`\nStarting processing of directory: ${SOURCE_DIRECTORY}`);
        console.log("Looking for .csv, .js, .json files...");

        for await (const filePath of walk(SOURCE_DIRECTORY)) {
            const ext = extname(filePath).toLowerCase();
            let docs = [];

            console.log(`-> Processing file: ${filePath}`);

            try {
                if (ext === ".csv") {
                    docs = await loadCsvData(filePath); // Use custom CSV loader
                } else if (ext === ".js") {
                    docs = await loadCustomJsData(filePath); // Use custom JS loader
                } else if (ext === ".json") {
                    // For JSON, Langchain's JSONLoader is generally good.
                    // It concatenates all string values.
                    const loader = new JSONLoader(filePath);
                    const loadedJsonDocs = await loader.load(); // Returns an array of Document
                    
                    // The JSON example provided is an array with one object.
                    // JSONLoader might create one Document per top-level object if jsonLines is false (default),
                    // or one Document for the whole file if it's a single JSON object/array.
                    // Let's ensure we process the content correctly.
                    // The provided JSON is `[{...}]`. JSONLoader will likely make one doc with content from inside the object.
                    docs = loadedJsonDocs.map(doc => {
                        // Example JSON: [{"contactDetails": [...], "links": [...]}]
                        // JSONLoader will extract text from "contactDetails" and "links" values.
                        // We can add more specific metadata if needed here.
                        return new Document({
                            pageContent: doc.pageContent, // pageContent is already extracted by JSONLoader
                            metadata: { ...doc.metadata, source: filePath, type: 'json_content' }
                        });
                    });
                    console.log(`   Loaded ${docs?.length ?? 0} raw document part(s) from JSON ${filePath}`);
                }

                if (Array.isArray(docs) && docs.length > 0) {
                    const validDocs = docs.filter(d => d && d.pageContent && typeof d.pageContent === 'string' && d.pageContent.trim() !== '');
                    if (validDocs.length > 0) {
                        rawDocuments.push(...validDocs);
                    } else {
                        console.warn(`   No valid, non-empty documents extracted from ${filePath}`);
                    }
                } else if (docs && (!Array.isArray(docs) || docs.length === 0)) {
                     console.warn(`   Loader/parser for ${filePath} returned no processable documents.`);
                }

            } catch (loadError) {
                console.error(`   Error loading or processing file ${filePath}:`, loadError.message, loadError.stack);
            }
        } // End file walk loop

        console.log(`\nTotal raw document parts loaded before cleaning: ${rawDocuments.length}`);

        if (rawDocuments.length === 0) {
            console.log("No documents found or loaded from any files. Exiting.");
            process.exit(0);
        }

        // --- Text Cleaning and Preparation ---
        console.log("\nCleaning and preparing text content...");
        const cleanedContentDocs = [];
        rawDocuments.forEach((doc, index) => {
            const cleaned = cleanText(doc.pageContent);
            if (cleaned) {
                cleanedContentDocs.push(new Document({
                    pageContent: cleaned,
                    metadata: doc.metadata || { source: 'unknown', original_index: index }
                }));
            } else {
                console.warn(`   Content from document (source: ${doc.metadata?.source || 'unknown'}, original_index: ${index}) became empty after cleaning. Original: "${doc.pageContent.substring(0,100)}..."`);
            }
        });
        console.log(`Total documents after cleaning: ${cleanedContentDocs.length}`);

        if (cleanedContentDocs.length === 0) {
            console.log("All document content was removed during cleaning. No data to process further. Exiting.");
            process.exit(0);
        }

        // --- Splitting into Chunks ---
        console.log("\nSplitting documents into chunks...");
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: CHUNK_SIZE,
            chunkOverlap: CHUNK_OVERLAP,
            separators: ["\n\n", "\n", ". ", "? ", "! ", "; ", " ", ""], // Added semicolon as separator
            keepSeparator: false,
        });
        const chunks = await splitter.splitDocuments(cleanedContentDocs);
        console.log(`Split into ${chunks.length} potential chunks.`);

        // --- Filtering and Validating Chunks ---
        console.log("\nFiltering and validating chunks...");
        const validChunks = chunks.filter(chunk => {
            const isValid = isValidChunk(chunk.pageContent);
            if (!isValid) {
                 // console.log(`   Filtered out invalid chunk: "${chunk.pageContent.substring(0,100)}..." (Source: ${chunk.metadata?.source})`);
            }
            return isValid;
        });
        console.log(`Retained ${validChunks.length} valid chunks after filtering.`);

        if (validChunks.length === 0) {
            console.log("No valid chunks to add to the vector store after splitting and filtering. Exiting.");
            process.exit(0);
        }

        // --- Adding Valid Chunks to Vector Store ---
        console.log(`\nAdding ${validChunks.length} valid chunks to AstraDB in batches of ${BATCH_SIZE}...`);
        let addedCount = 0;
        for (let i = 0; i < validChunks.length; i += BATCH_SIZE) {
            const batch = validChunks.slice(i, i + BATCH_SIZE);
            try {
                await vectorStore.addDocuments(batch); // Assumes vectorStore.addDocuments takes Document[]
                addedCount += batch.length;
                console.log(`   Added batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validChunks.length / BATCH_SIZE)}. Total added so far: ${addedCount}`);
            } catch (dbError) {
                console.error(`   Error adding batch starting at index ${i} to AstraDB:`, dbError.message);
                // console.error("DB Error Details:", dbError); // For more detailed error object
                // Optionally, decide if you want to stop or continue on batch errors
            }
        }

        console.log(`\n--- Processing Completed ---`);
        console.log(`Successfully attempted to add ${addedCount} chunks to AstraDB.`);
        if (addedCount < validChunks.length) {
            console.warn(`Note: ${validChunks.length - addedCount} chunks may have failed to add due to batch errors.`);
        }
        process.exit(0); // Success

    } catch (error) {
        console.error("\n--- A critical error occurred during processing ---");
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
        process.exit(1); // Failure
    }
}

processAllFiles();