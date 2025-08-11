import dotenv from "dotenv";
dotenv.config({ path: ".env" }); // Ensure .env has ASTRA_DB_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_COLLECTION

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { join, extname, basename } from 'path';
import { readdir, readFile } from 'fs/promises';
import { parse as csvParseSync } from 'csv-parse/sync'; // Robust CSV parsing
import { getVectorStore } from '../src/lib/astradb.js'; // Your AstraDB connection
import { Document } from "@langchain/core/documents";

// --- Configuration ---
const SOURCE_DIRECTORY = "src/data"; // <--- SET YOUR DATA DIRECTORY
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200; // Increased overlap can sometimes help context
const BATCH_SIZE = 50;
const MIN_CHUNK_LENGTH = 50; // Increased minimum length
const MIN_WORD_COUNT = 10;   // Increased minimum word count

// --- Text Cleaning Utility ---
const cleanText = (text, context = "general") => {
    if (typeof text !== 'string') return '';
    let cleaned = text;

    // Normalize Unicode to handle various character representations
    cleaned = cleaned.normalize('NFKC');

    // Remove common ligatures (optional, but can help normalization)
    // cleaned = cleaned.replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl'); // Add more if needed

    cleaned = cleaned
        .replace(/<[^>]*>/g, ' ')       // Remove HTML tags
        .replace(/```[\s\S]*?```/g, '[CODE_BLOCK]') // Replace markdown code blocks with a placeholder
        .replace(/`[^`]+`/g, '[INLINE_CODE]')     // Replace inline markdown code with a placeholder
        // URLs: Consider your use case. Stripping them loses info.
        // Replacing with a placeholder '[URL]' might be better for some RAG tasks.
        // For now, keeping removal as per original script's intent.
        .replace(/http\S+/g, '')
        .replace(/\\n/g, ' ')            // Replace literal '\n' (often in JSON strings) with space
        .replace(/\s+/g, ' ')            // Normalize whitespace (multiple spaces to single)
        .trim();

    // Context-specific cleaning (example)
    if (context === "skills_list") {
        // If "ame" is a known prefix in skills data:
        cleaned = cleaned.replace(/^ame\s+/i, '');
    }

    // Remove or replace characters that might be problematic for LLMs or vectorization
    // Be cautious here not to remove essential punctuation for meaning.
    // This regex is more conservative than the original, keeping more symbols.
    // cleaned = cleaned.replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, ''); // Keeps letters, numbers, punctuation, spaces

    return cleaned.trim();
};

// --- Chunk Validation Utility ---
const isValidChunk = (text) => {
    if (!text || typeof text !== 'string') return false;
    const cleanedText = text.trim();
    if (cleanedText.length === 0) return false;

    const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;
    return (
        cleanedText.length >= MIN_CHUNK_LENGTH &&
        wordCount >= MIN_WORD_COUNT &&
        !/^\d+$/.test(cleanedText) &&          // Not purely numeric
        !/^[^\w]+$/.test(cleanedText) &&       // Not purely punctuation/symbols (allows alphanumeric)
        cleanedText.toLowerCase() !== '[code_block]' && // Avoid chunks that are only placeholders
        cleanedText.toLowerCase() !== '[inline_code]'
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
                // Process only specified extensions
                const ext = extname(entry.name).toLowerCase();
                if (['.csv', '.js', '.json', '.txt'].includes(ext)) { // Added .txt as common
                    yield { filePath: res, fileName: entry.name };
                }
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error.message);
    }
}

// --- Specific Data Loaders ---

// Loader for GitHub Repository JSON structure
async function loadGitHubRepoJson(filePath, fileName) {
    console.log(`   Attempting GitHub Repo JSON load for: ${fileName}`);
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        
        // Handle if JSON is an array of repos or a single repo object
        const repos = Array.isArray(jsonData) ? jsonData : [jsonData];
        const documents = [];

        for (const repo of repos) {
            if (repo.type !== 'repository' && !repo.name) { // Basic check
                console.warn(`   Skipping non-repository object in ${fileName}`);
                continue;
            }

            let pageContent = `Repository Name: ${repo.name || 'N/A'}.\n`;
            pageContent += `Owner: ${repo.owner ? (typeof repo.owner === 'string' ? repo.owner.substring(repo.owner.lastIndexOf('/') + 1) : 'N/A') : 'N/A'}.\n`;
            pageContent += `Description: ${repo.description || 'No description provided'}.\n`;
            if (repo.website) pageContent += `Website: ${repo.website}.\n`;
            pageContent += `Private: ${repo.private}.\n`;
            pageContent += `Has Issues: ${repo.has_issues}. Has Wiki: ${repo.has_wiki}. Has Downloads: ${repo.has_downloads}.\n`;

            if (repo.labels && repo.labels.length > 0) {
                pageContent += "Labels:\n";
                repo.labels.forEach(label => {
                    pageContent += `  - Label: ${label.name || 'Unnamed'} (${label.color || 'no color'}). Description: ${label.description || 'No description'}.\n`;
                });
            }
            // Add other fields as needed

            const cleanedContent = cleanText(pageContent, "github_repo");
            if (cleanedContent) {
                documents.push(new Document({
                    pageContent: cleanedContent,
                    metadata: {
                        source: filePath,
                        file_name: fileName,
                        file_type: 'github_repository',
                        repo_name: repo.name || 'N/A',
                        repo_owner: repo.owner ? (typeof repo.owner === 'string' ? repo.owner.substring(repo.owner.lastIndexOf('/') + 1) : 'N/A') : 'N/A',
                        processed_timestamp: new Date().toISOString(),
                    }
                }));
            }
        }
        console.log(`   Successfully parsed ${documents.length} repository entries from ${fileName}`);
        return documents;
    } catch (error) {
        console.error(`   Error parsing GitHub Repo JSON file ${fileName}:`, error.message);
        return [];
    }
}

// Loader for Twitter Likes JS structure (window.YTD.like.part0 = [...])
async function loadTwitterLikesJs(filePath, fileName) {
    console.log(`   Attempting Twitter Likes JS load for: ${fileName}`);
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        // More robust regex to find the array, handling potential variations
        const assignmentMatch = fileContent.match(/window\.YTD\.like\.part\d+\s*=\s*(\[[\s\S]*?\])\s*;?/i);
        if (!assignmentMatch || !assignmentMatch[1]) {
            console.warn(`   Could not find 'window.YTD.like.partX = [...]' structure in ${fileName}.`);
            return [];
        }
        const arrayString = assignmentMatch[1];
        let dataArray;
        try {
            dataArray = JSON.parse(arrayString); // The array part should be valid JSON
        } catch (parseError) {
            console.error(`   Error parsing the extracted array from JS file ${fileName} as JSON:`, parseError.message);
            return [];
        }

        const documents = [];
        if (Array.isArray(dataArray)) {
            dataArray.forEach((item, index) => {
                if (item && item.like && typeof item.like.fullText === 'string') {
                    let textContent = `Liked tweet: "${item.like.fullText}"`;
                    if(item.like.expandedUrl) {
                        // Decide how to handle URLs. Here, we are keeping it for context.
                        // The main cleanText might still remove it based on its rules.
                        textContent += ` (Link: ${item.like.expandedUrl})`;
                    }
                    
                    const cleanedContent = cleanText(textContent, "twitter_like");
                    if (cleanedContent) {
                        documents.push(new Document({
                            pageContent: cleanedContent,
                            metadata: {
                                source: filePath,
                                file_name: fileName,
                                file_type: 'twitter_like',
                                tweet_id: item.like.tweetId || 'N/A',
                                item_index: index,
                                processed_timestamp: new Date().toISOString(),
                            }
                        }));
                    }
                }
            });
            console.log(`   Successfully parsed ${documents.length} like entries from ${fileName}`);
        } else {
            console.warn(`   Data extracted from ${fileName} is not an array.`);
        }
        return documents;
    } catch (error) {
        console.error(`   Error processing Twitter Likes JS file ${fileName}:`, error.message);
        return [];
    }
}

// Robust CSV Loader
async function loadCsvData(filePath, fileName) {
    console.log(`   Attempting CSV load for: ${fileName}`);
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        const records = csvParseSync(fileContent, {
            columns: true, // Assumes first row is header
            skip_empty_lines: true,
            trim: true,
            bom: true, // Handle UTF-8 BOM
        });

        const documents = [];
        records.forEach((record, index) => {
            let rowText = "";
            const headers = Object.keys(record);
            let hasData = false;
            const recordMetadata = {};

            headers.forEach(header => {
                const cleanedHeader = header.trim();
                if (record[header] && record[header].trim()) {
                    // Special handling for "skills" or similar lists that might have "ame" prefix
                    const cleaningContext = cleanedHeader.toLowerCase().includes('skill') ? "skills_list" : "general";
                    const cleanedValue = cleanText(record[header], cleaningContext);
                    
                    if (cleanedValue) {
                        rowText += `${cleanedHeader}: ${cleanedValue}. `;
                        recordMetadata[`csv_col_${cleanedHeader.replace(/\s+/g, '_')}`] = cleanedValue.substring(0, 200); // Add cell value to metadata (truncated)
                        hasData = true;
                    }
                }
            });

            if (hasData) {
                 const finalCleanedRowText = cleanText(rowText.trim(), "csv_row"); // Clean the whole assembled row text
                 if(finalCleanedRowText) {
                    documents.push(new Document({
                        pageContent: finalCleanedRowText,
                        metadata: {
                            source: filePath,
                            file_name: fileName,
                            file_type: 'csv_record',
                            row_number: index + 1, // 1-based index for row
                            ...recordMetadata, // Add individual cell values if needed
                            processed_timestamp: new Date().toISOString(),
                        }
                    }));
                 }
            }
        });
        console.log(`   Successfully parsed ${documents.length} data entries from CSV ${fileName}`);
        return documents;
    } catch (error) {
        console.error(`   Error parsing CSV file ${fileName}:`, error.message);
        // Fallback: Try to load as plain text if CSV parsing fails completely
        console.warn(`   Falling back to plain text load for ${fileName}`);
        return loadTextData(filePath, fileName, 'csv_parse_fallback');
    }
}

// Generic Text File Loader
async function loadTextData(filePath, fileName, fileType = 'text_file') {
    console.log(`   Attempting plain text load for: ${fileName}`);
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        const cleanedContent = cleanText(fileContent);
        if (cleanedContent) {
            return [new Document({
                pageContent: cleanedContent,
                metadata: {
                    source: filePath,
                    file_name: fileName,
                    file_type: fileType,
                    processed_timestamp: new Date().toISOString(),
                }
            })];
        }
        return [];
    } catch (error) {
        console.error(`   Error reading text file ${fileName}:`, error.message);
        return [];
    }
}

// Generic JSON Loader (Improved Fallback)
async function loadGenericJson(filePath, fileName) {
    console.log(`   Attempting Generic JSON load for: ${fileName}`);
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        
        // Convert JSON object/array to a somewhat structured string
        // This is a basic attempt; more sophisticated flattening might be needed for complex structures
        const stringifyRecursive = (obj, prefix = "") => {
            let str = "";
            if (typeof obj === 'string') return `${prefix}${obj}\n`;
            if (typeof obj === 'number' || typeof obj === 'boolean') return `${prefix}${obj.toString()}\n`;
            if (Array.isArray(obj)) {
                obj.forEach((item, i) => {
                    str += stringifyRecursive(item, `${prefix}[${i}] `);
                });
            } else if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        str += stringifyRecursive(obj[key], `${prefix}${key}: `);
                    }
                }
            }
            return str;
        };
        
        const textContent = stringifyRecursive(jsonData);
        const cleanedContent = cleanText(textContent);

        if (cleanedContent) {
            return [new Document({
                pageContent: cleanedContent,
                metadata: {
                    source: filePath,
                    file_name: fileName,
                    file_type: 'generic_json',
                    processed_timestamp: new Date().toISOString(),
                }
            })];
        }
        return [];
    } catch (error) {
        console.error(`   Error parsing generic JSON file ${fileName}:`, error.message);
        return [];
    }
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

        const allProcessedDocs = [];

        console.log(`\nStarting processing of directory: ${SOURCE_DIRECTORY}`);
        console.log("Looking for .csv, .js, .json, .txt files...");

        for await (const { filePath, fileName } of walk(SOURCE_DIRECTORY)) {
            const ext = extname(fileName).toLowerCase();
            let docs = [];

            console.log(`-> Processing file: ${fileName} (Path: ${filePath})`);

            try {
                // Determine loader based on filename patterns or extension
                if (fileName.match(/followed2.*\.json$/i) || fileName.match(/repo.*\.json$/i)) { // Example specific patterns for GitHub JSON
                    docs = await loadGitHubRepoJson(filePath, fileName);
                } else if (fileName.match(/like.*\.js$/i) && fileName.includes("YTD")) { // Example for Twitter likes
                    docs = await loadTwitterLikesJs(filePath, fileName);
                } else if (ext === ".csv") {
                    docs = await loadCsvData(filePath, fileName);
                } else if (ext === ".json") {
                    docs = await loadGenericJson(filePath, fileName); // Fallback generic JSON
                } else if (ext === ".js") {
                    // Add a generic JS parser if needed, or log skip
                    console.warn(`   Skipping generic JS file ${fileName} as no specific parser is implemented.`);
                } else if (ext === ".txt") {
                    docs = await loadTextData(filePath, fileName);
                }

                if (Array.isArray(docs) && docs.length > 0) {
                    // Filter out any documents that became empty after initial loading/cleaning
                    const validDocs = docs.filter(d => d && d.pageContent && d.pageContent.trim() !== '');
                    if (validDocs.length > 0) {
                        allProcessedDocs.push(...validDocs);
                        console.log(`   + Added ${validDocs.length} documents from ${fileName}`);
                    } else {
                        console.warn(`   No valid, non-empty documents extracted from ${fileName} after initial processing.`);
                    }
                } else if (docs && (!Array.isArray(docs) || docs.length === 0)) {
                     console.warn(`   Loader for ${fileName} returned no processable documents.`);
                }

            } catch (loadError) {
                console.error(`   Error loading or processing file ${fileName}:`, loadError.message, loadError.stack);
            }
        } // End file walk loop

        console.log(`\nTotal documents loaded before splitting: ${allProcessedDocs.length}`);

        if (allProcessedDocs.length === 0) {
            console.log("No documents found or loaded from any files. Exiting.");
            process.exit(0);
        }

        // --- Splitting into Chunks ---
        // Note: Splitting is done *after* all documents are loaded and individually cleaned.
        // This ensures consistent metadata propagation.
        console.log("\nSplitting documents into chunks...");
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: CHUNK_SIZE,
            chunkOverlap: CHUNK_OVERLAP,
            // separators: ["\n\n", "\n", ". ", "? ", "! ", "; ", " ", ""], // Default good, or customize
            keepSeparator: false, // Usually false is fine
        });
        const chunks = await splitter.splitDocuments(allProcessedDocs); // allProcessedDocs are already Document instances
        console.log(`Split into ${chunks.length} potential chunks.`);

        // --- Filtering and Validating Chunks ---
        console.log("\nFiltering and validating chunks...");
        const validChunks = chunks.filter(chunk => {
            // The pageContent of chunks from splitDocuments is already cleaned if the input Documents were.
            // We just need to validate the chunk based on length/content criteria.
            const isValid = isValidChunk(chunk.pageContent);
            if (!isValid && chunk.pageContent.length > 0) { // Log only if it had content but failed validation
                 // console.log(`   Filtered out invalid chunk (len: ${chunk.pageContent.length}, words: ${chunk.pageContent.split(/\s+/).filter(Boolean).length}): "${chunk.pageContent.substring(0,100)}..." (Source: ${chunk.metadata?.file_name})`);
            }
            return isValid;
        });
        console.log(`Retained ${validChunks.length} valid chunks after filtering.`);

        if (validChunks.length === 0) {
            console.log("No valid chunks to add to the vector store after splitting and filtering. Exiting.");
            process.exit(0);
        }

        // --- Adding Valid Chunks to Vector Store ---
        // Before adding, you can inspect some chunks:
        console.log("\n--- Sample Chunks for Review ---");
        for(let i = 0; i < Math.min(3, validChunks.length); i++) {
            console.log(`Chunk ${i+1} Metadata: ${JSON.stringify(validChunks[i].metadata)}`);
            console.log(`Chunk ${i+1} Content: "${validChunks[i].pageContent.substring(0, 200)}..."\n`);
        }
        console.log("--------------------------------\n");


        console.log(`Adding ${validChunks.length} valid chunks to AstraDB in batches of ${BATCH_SIZE}...`);
        let addedCount = 0;
        for (let i = 0; i < validChunks.length; i += BATCH_SIZE) {
            const batch = validChunks.slice(i, i + BATCH_SIZE);
            try {
                await vectorStore.addDocuments(batch);
                addedCount += batch.length;
                console.log(`   Added batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validChunks.length / BATCH_SIZE)}. Total added so far: ${addedCount}`);
            } catch (dbError) {
                console.error(`   Error adding batch starting at index ${i} to AstraDB:`, dbError.message);
                 if (dbError.stack) console.error(dbError.stack); // More detailed error
                 // Consider how to handle batch errors: stop, retry, or skip.
            }
        }

        console.log(`\n--- Processing Completed ---`);
        console.log(`Successfully attempted to add ${addedCount} chunks to AstraDB.`);
        if (addedCount < validChunks.length) {
            console.warn(`Note: ${validChunks.length - addedCount} chunks may have failed to add due to batch errors.`);
        }
        process.exit(0);

    } catch (error) {
        console.error("\n--- A critical error occurred during processing ---");
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
        process.exit(1);
    }
}

processAllFiles();