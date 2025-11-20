// src/lib/__tests__/data_processor.test.js
import { cleanText, chunkText, generateEmbeddings, processAndEmbed, _resetEmbeddingsModel } from '../data_processor';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Mock the entire module
jest.mock("@langchain/google-genai", () => ({
    GoogleGenerativeAIEmbeddings: jest.fn().mockImplementation(() => ({
        embedDocuments: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]), // Default mock for embedDocuments
    })),
}));

describe('Data Processor', () => {

    let mockEmbedModelInstance;

    beforeEach(() => {
        // Reset the singleton model instance before each test using the exported helper
        _resetEmbeddingsModel();

        // Clear mocks before each test
        GoogleGenerativeAIEmbeddings.mockClear();
        // Re-acquire the instance for subsequent tests if necessary, or ensure it's created fresh
        // This ensures that if getEmbeddingsModel() is called, it creates a new mock instance
        // and we can grab it.

        // To get a fresh instance for each test that calls generateEmbeddings or processAndEmbed:
        // Call a function that uses getEmbeddingsModel() or re-initialize it conceptually.
        // For generateEmbeddings, it calls getEmbeddingsModel internally.
        // The first call to getEmbeddingsModel() in a test will create an instance.
    });

    describe('cleanText', () => {
        it('should remove extra spaces and newlines', () => {
            expect(cleanText('Hello   World\n\nHow are you?')).toBe('Hello World\nHow are you?');
        });
        it('should trim whitespace', () => {
            expect(cleanText('  Test  ')).toBe('Test');
        });
        it('should handle null or undefined input', () => {
            expect(cleanText(null)).toBe('');
            expect(cleanText(undefined)).toBe('');
        });
        it('should handle already clean text', () => {
            expect(cleanText('Clean text.')).toBe('Clean text.');
        });
        it('should replace multiple mixed spaces and tabs with a single space', () => {
            expect(cleanText("Hello \t \t World")).toBe("Hello World");
        });
    });

    describe('chunkText', () => {
        it('should chunk text with overlap', () => {
            const text = 'abcdefghijklmnopqrstuvwxyz'; // 26 chars
            const chunks = chunkText(text, 10, 2); // size 10, overlap 2, step 8
            expect(chunks).toEqual([
                "abcdefghij", // 0-10
                "ijklmnopqr", // 8-18 (starts at 10-2=8, ends at 8+10=18)
                "qrstuvwxyz"  // 16-26 (starts at 16-2=16, ends at 16+10=26)
            ]);
        });
        it('should handle text shorter than chunk size', () => {
            expect(chunkText('short', 10, 2)).toEqual(['short']);
        });
        it('should handle empty text', () => {
            expect(chunkText('', 10, 2)).toEqual([]);
        });
        it('should handle null or undefined text', () => {
            expect(chunkText(null, 10, 2)).toEqual([]);
            expect(chunkText(undefined, 10, 2)).toEqual([]);
        });
        it('should handle overlap equal to or greater than chunk size (should default to 0 overlap)', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            const text = 'abcdefghij';
            expect(chunkText(text, 5, 5)).toEqual(['abcde', 'fghij']); // Overlap becomes 0
            expect(consoleWarnSpy).toHaveBeenCalledWith("Chunk overlap should be less than chunk size. Setting overlap to 0.");
            consoleWarnSpy.mockRestore();
        });
        it('should handle chunks at the end of the string correctly', () => {
            const text = "123456789012345"; // 15 chars
            const chunks = chunkText(text, 10, 2); // step is 8
            // "1234567890" (0-10)
            // "9012345"    (8-15)
            expect(chunks).toEqual(["1234567890", "9012345"]);
        });
    });

    describe('generateEmbeddings', () => {
        it('should call embedDocuments on the model and return embeddings', async () => {
            const chunks = ['chunk1', 'chunk2'];
            const mockEmbeddings = [[0.1, 0.2], [0.3, 0.4]];

            // Call generateEmbeddings, which internally calls getEmbeddingsModel()
            // This will create the first instance of the mock.
            const resultPromise = generateEmbeddings(chunks);

            // Now get the instance
            mockEmbedModelInstance = GoogleGenerativeAIEmbeddings.mock.instances[0];
            expect(mockEmbedModelInstance).toBeDefined(); // Ensure an instance was created
            mockEmbedModelInstance.embedDocuments.mockResolvedValue(mockEmbeddings); // Configure its mock method

            const result = await resultPromise;

            expect(mockEmbedModelInstance.embedDocuments).toHaveBeenCalledWith(chunks);
            expect(result).toEqual(mockEmbeddings);
        });

        it('should return empty array if no chunks provided', async () => {
            const result = await generateEmbeddings([]);
            expect(result).toEqual([]);
             // Ensure embedDocuments is not called if no chunks
            if (GoogleGenerativeAIEmbeddings.mock.instances.length > 0) {
                 mockEmbedModelInstance = GoogleGenerativeAIEmbeddings.mock.instances[0];
                 if (mockEmbedModelInstance) { // It might not be created if getEmbeddingsModel is not called
                    expect(mockEmbedModelInstance.embedDocuments).not.toHaveBeenCalled();
                 }
            }
        });

        it('should return empty array on embedding error and log error', async () => {
            const chunks = ['chunk1'];
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // This call will create an instance
            const resultPromise = generateEmbeddings(chunks);
            mockEmbedModelInstance = GoogleGenerativeAIEmbeddings.mock.instances[0];
            mockEmbedModelInstance.embedDocuments.mockRejectedValue(new Error("Embedding failed"));

            const result = await resultPromise;

            expect(result).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error generating embeddings:", "Embedding failed");
            consoleErrorSpy.mockRestore();
        });
    });

    describe('processAndEmbed', () => {
        it('should process text and return structured data', async () => {
            const text = "This is a test sentence. It is a good sentence.";
            const source = "test-source";
            const mockEmbedding = [0.1, 0.2, 0.3];

            // This call will create an instance
            const resultPromise = processAndEmbed(text, source);
            mockEmbedModelInstance = GoogleGenerativeAIEmbeddings.mock.instances[0];
            // Configure the mock for this specific test case
            mockEmbedModelInstance.embedDocuments.mockImplementation(async (chunks) => {
                return chunks.map(() => [...mockEmbedding]); // Return a new array for each chunk
            });

            const result = await resultPromise;

            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('text');
            expect(result[0]).toHaveProperty('embedding');
            expect(result[0].embedding).toEqual(mockEmbedding);
            expect(result[0]).toHaveProperty('source', source);
            expect(result[0]).toHaveProperty('pageContent', result[0].text); // Langchain convention
            expect(result[0].metadata).toHaveProperty('source', source);
            expect(result[0].metadata.original_text_length).toBe(text.length);
            expect(result[0].metadata.chunk_index).toBe(0);
        });

        it('should return empty array if text is empty or whitespace', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            let result = await processAndEmbed("", "empty-source");
            expect(result).toEqual([]);
            expect(consoleWarnSpy).toHaveBeenCalledWith("No text provided or text is empty for source: empty-source. Skipping processing.");

            result = await processAndEmbed("   \n ", "whitespace-source");
            expect(result).toEqual([]);
            expect(consoleWarnSpy).toHaveBeenCalledWith("No text provided or text is empty for source: whitespace-source. Skipping processing.");
            consoleWarnSpy.mockRestore();
        });

        it('should return empty array if embeddings generation fails and logs error', async () => {
            const text = "Some valid text";
            const source = "error-source";
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const resultPromise = processAndEmbed(text, source);
            mockEmbedModelInstance = GoogleGenerativeAIEmbeddings.mock.instances[0];
            mockEmbedModelInstance.embedDocuments.mockResolvedValue([]); // Simulate mismatch

            const result = await resultPromise;
            expect(result).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Mismatch between number of chunks`));
            consoleErrorSpy.mockRestore();
        });
    });
});
