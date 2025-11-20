// src/lib/data_processor.js
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
// Ensure GOOGLE_API_KEY is set in your .env file for the embeddings model to be picked up automatically.

const DEFAULT_CHUNK_SIZE = 1000; // Default size of text chunks in characters
const DEFAULT_CHUNK_OVERLAP = 200; // Default overlap between chunks in characters

let embeddingsModelInstance;

/**
 * Initializes and returns a singleton instance of GoogleGenerativeAIEmbeddings.
 * @returns {GoogleGenerativeAIEmbeddings} The embeddings model instance.
 */
function getEmbeddingsModel() {
    if (!embeddingsModelInstance) {
        embeddingsModelInstance = new GoogleGenerativeAIEmbeddings({
            modelName: "embedding-001", // Or "text-embedding-004" - "embedding-001" is current GA model
            taskType: "RETRIEVAL_DOCUMENT", // Specifies the use case for embeddings
            // The API key is typically handled by the library if GOOGLE_API_KEY environment variable is set.
            // apiKey: process.env.GOOGLE_API_KEY
        });
        console.log("GoogleGenerativeAIEmbeddings model initialized (embedding-001).");
    }
    return embeddingsModelInstance;
}

/**
 * Cleans text by removing excessive whitespace and newlines.
 * @param {string} text - The input text.
 * @returns {string} The cleaned text.
 */
export function cleanText(text) {
    if (!text || typeof text !== 'string') return "";
    let cleaned = text;
    // Replace multiple spaces with a single space
    cleaned = cleaned.replace(/\s\s+/g, ' ');
    // Replace multiple newlines with a single newline.
    // Consider if specific sequences like `\r\n` also need normalization to `\n` first.
    cleaned = cleaned.replace(/\n\n+/g, '\n');
    // Trim leading/trailing whitespace (including newlines)
    cleaned = cleaned.trim();
    return cleaned;
}

/**
 * Splits text into chunks of a specified size with a given overlap.
 * @param {string} text - The text to chunk.
 * @param {number} chunkSize - The maximum size of each chunk.
 * @param {number} chunkOverlap - The overlap between consecutive chunks.
 * @returns {string[]} An array of text chunks.
 */
export function chunkText(text, chunkSize = DEFAULT_CHUNK_SIZE, chunkOverlap = DEFAULT_CHUNK_OVERLAP) {
    const chunks = [];
    if (!text || typeof text !== 'string' || text.length === 0) {
        return chunks;
    }
    if (chunkOverlap >= chunkSize) {
        console.warn("Chunk overlap should be less than chunk size. Setting overlap to 0.");
        chunkOverlap = 0;
    }

    for (let i = 0; i < text.length; i += (chunkSize - chunkOverlap)) {
        const chunk = text.substring(i, i + chunkSize);
        chunks.push(chunk);
    }
    // Ensure no empty strings are returned if text is very short or due to logic, though substring handles end of string.
    return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Generates embeddings for an array of text chunks.
 * @param {string[]} textChunks - An array of text chunks.
 * @returns {Promise<Array<number[]>>} A promise that resolves to an array of embedding vectors. Returns empty if input is empty or error.
 */
export async function generateEmbeddings(textChunks) {
    if (!textChunks || textChunks.length === 0) {
        console.log("No text chunks provided to generateEmbeddings.");
        return [];
    }
    try {
        const model = getEmbeddingsModel();
        console.log(`Generating embeddings for ${textChunks.length} chunk(s).`);
        const embeddings = await model.embedDocuments(textChunks);
        console.log("Embeddings generated successfully.");
        return embeddings;
    } catch (error) {
        console.error("Error generating embeddings:", error.message || error);
        // Depending on requirements, you might want to throw the error
        // or return a partially successful result if some embeddings were generated.
        return []; // Return empty array on error for simplicity here
    }
}

/**
 * Orchestrates the cleaning, chunking, and embedding of raw text.
 * @param {string} text - The raw text to process.
 * @param {string} source - An identifier for the source of the text (e.g., 'linkedin-profile').
 * @param {object} metadata - Optional additional metadata to associate with each chunk.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of objects, each containing text, embedding, source, and metadata.
 */
export async function processAndEmbed(text, source, metadata = {}) {
    if (!text || typeof text !== 'string' || text.trim() === "") {
        console.warn(`No text provided or text is empty for source: ${source}. Skipping processing.`);
        return [];
    }

    const cleanedText = cleanText(text);
    if (cleanedText.length === 0) {
        console.warn(`Cleaned text is empty for source: ${source}. Original length: ${text.length}. Skipping further processing.`);
        return [];
    }

    const chunks = chunkText(cleanedText, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP);

    if (chunks.length === 0) {
        console.warn(`Text from source '${source}' resulted in zero chunks after cleaning and chunking. Cleaned text length: ${cleanedText.length}.`);
        return [];
    }

    console.log(`Processing source '${source}': Cleaned text length ${cleanedText.length}, Chunks created: ${chunks.length}`);
    const embeddings = await generateEmbeddings(chunks);

    if (embeddings.length !== chunks.length) {
        console.error(`Mismatch between number of chunks (${chunks.length}) and embeddings (${embeddings.length}) for source '${source}'. This may be due to an error during embedding generation for some chunks.`);
        // Handle this case: either return partial results, an empty array, or throw an error.
        // For now, returning empty to signify failure in consistent processing.
        return [];
    }

    return chunks.map((chunk, index) => ({
        text: chunk, // The actual text content of the chunk
        embedding: embeddings[index], // The numerical embedding vector
        source: source, // Identifier for the data source
        pageContent: chunk, // Langchain convention often uses pageContent for the text
        metadata: { // Store any additional relevant information
            ...metadata, // Include any initially provided metadata
            source: source,
            original_text_length: text.length, // Length of the original document
            cleaned_text_length: cleanedText.length, // Length of the cleaned document
            chunk_index: index, // Index of this chunk
            total_chunks: chunks.length, // Total number of chunks from this document
            chunk_size: chunk.length // Actual length of this chunk
        }
    }));
}

// Example Usage (for local testing - ensure GOOGLE_API_KEY is in .env)
/*
(async () => {
    console.log("Starting data_processor.js example usage...");

    const sampleText = "This is a long sample text designed to test the chunking and embedding functionalities of the data_processor module. It needs to be sufficiently long to be split into multiple chunks. Let's repeat some content to ensure its length: Content repetition one. Content repetition two. Content repetition three. Now, we add a bit more unique text to see how the final chunks are handled. This is the final unique part of the text, making sure it's processed correctly. ".repeat(5);

    const processedData = await processAndEmbed(sampleText, "test-source-example", { document_id: "doc123" });

    if (processedData.length > 0) {
        console.log(`\nSuccessfully processed and embedded sampleText. Number of chunks: ${processedData.length}`);
        console.log("First chunk text (first 50 chars):", processedData[0].text.substring(0, 50) + "...");
        console.log("First chunk embedding (first 3 dimensions):", processedData[0].embedding ? processedData[0].embedding.slice(0, 3) : "N/A");
        console.log("First chunk metadata:", processedData[0].metadata);
        if (processedData.length > 1) {
            console.log("Last chunk text (first 50 chars):", processedData[processedData.length-1].text.substring(0,50) + "...");
        }
    } else {
        console.log("\nProcessing and embedding sampleText failed or produced no data.");
    }

    const shortText = "This is a short text, likely shorter than the chunk size.";
    const processedShortData = await processAndEmbed(shortText, "short-test-source");
     if (processedShortData.length > 0) {
        console.log(`\nProcessed shortText. Number of chunks: ${processedShortData.length}`);
        console.log("Short text chunk data (first 50 chars):", processedShortData[0].text.substring(0,50) + "...");
        console.log("Short text metadata:", processedShortData[0].metadata);

    } else {
        console.log("\nProcessing shortText failed or produced no data.");
    }

    const noText = "";
    const processedNoText = await processAndEmbed(noText, "no-text-source");
    if(processedNoText.length === 0) console.log("\nCorrectly handled empty text input for 'no-text-source'.");

    const whitespaceText = "   \n\n   ";
    const processedWhitespaceText = await processAndEmbed(whitespaceText, "whitespace-text-source");
    if(processedWhitespaceText.length === 0) console.log("\nCorrectly handled whitespace-only text input for 'whitespace-text-source'.");

    console.log("\nFinished data_processor.js example usage.");
})();
*/

// For testing purposes, to reset the singleton instance
export const _resetEmbeddingsModel = () => {
    embeddingsModelInstance = undefined;
};
