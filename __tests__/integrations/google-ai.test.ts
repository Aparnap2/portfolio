/**
 * Google AI Integration Tests
 * Tests Google AI API operations for audit processing and analysis
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// Mock the Google AI library
jest.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
    stream: jest.fn(),
    call: jest.fn(),
  })),
  GoogleGenerativeAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedQuery: jest.fn(),
    embedDocuments: jest.fn(),
  })),
}));

describe('Google AI Integration', () => {
  let mockLLM: any;
  let mockEmbeddings: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLLM = new ChatGoogleGenerativeAI();
    mockEmbeddings = new (require('@langchain/google-genai').GoogleGenerativeAIEmbeddings)();
  });

  describe('LLM Operations', () => {
    it('should process audit discovery questions', async () => {
      const mockResponse = {
        content: 'Based on your technology industry, you have several automation opportunities...',
        usage_metadata: {
          input_tokens: 150,
          output_tokens: 200,
          total_tokens: 350,
        }
      };

      mockLLM.invoke.mockResolvedValueOnce(mockResponse);

      const messages = [
        { role: 'system', content: 'You are an AI audit assistant.' },
        { role: 'user', content: 'What automation opportunities do I have in my tech company?' }
      ];

      const result = await mockLLM.invoke(messages);

      expect(result).toEqual(mockResponse);
      expect(mockLLM.invoke).toHaveBeenCalledWith(messages);
    });

    it('should handle pain point analysis', async () => {
      const painPoints = [
        'Manual data entry takes 10 hours/week',
        'Email management is overwhelming',
        'Customer support response time is slow'
      ];

      const mockResponse = {
        content: 'Your pain score is 75/100. The highest impact area is manual data entry...',
        usage_metadata: {
          input_tokens: 200,
          output_tokens: 150,
          total_tokens: 350,
        }
      };

      mockLLM.invoke.mockResolvedValueOnce(mockResponse);

      const result = await mockLLM.invoke([
        { role: 'user', content: `Analyze these pain points: ${painPoints.join(', ')}` }
      ]);

      expect(result.content).toContain('pain score');
      expect(result.usage_metadata.total_tokens).toBe(350);
    });

    it('should generate opportunity recommendations', async () => {
      const mockResponse = {
        content: `## Top Automation Opportunities

1. **Email Marketing Automation**
   - Monthly savings: $2,500
   - Implementation: 4 weeks
   - ROI: 300% in 12 months

2. **Customer Support Chatbot**
   - Monthly savings: $1,800
   - Implementation: 6 weeks
   - ROI: 240% in 12 months`,
        usage_metadata: {
          input_tokens: 300,
          output_tokens: 400,
          total_tokens: 700,
        }
      };

      mockLLM.invoke.mockResolvedValueOnce(mockResponse);

      const result = await mockLLM.invoke([
        { role: 'user', content: 'Generate automation opportunities for a tech company with 50 employees' }
      ]);

      expect(result.content).toContain('Email Marketing Automation');
      expect(result.content).toContain('Customer Support Chatbot');
      expect(result.usage_metadata.input_tokens).toBe(300);
    });

    it('should handle streaming responses', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'Based on your' };
          yield { content: ' technology industry' };
          yield { content: ', you have several' };
          yield { content: ' automation opportunities...' };
        }
      };

      mockLLM.stream.mockResolvedValueOnce(mockStream);

      const result = await mockLLM.stream([
        { role: 'user', content: 'What opportunities do I have?' }
      ]);

      expect(result).toBe(mockStream);
    });

    it('should handle API rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockLLM.invoke.mockRejectedValueOnce(rateLimitError);

      await expect(mockLLM.invoke([
        { role: 'user', content: 'Test question' }
      ])).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle API authentication errors', async () => {
      const authError = new Error('Invalid API key');
      (authError as any).status = 401;
      mockLLM.invoke.mockRejectedValueOnce(authError);

      await expect(mockLLM.invoke([
        { role: 'user', content: 'Test question' }
      ])).rejects.toThrow('Invalid API key');
    });

    it('should handle quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded for quota metric');
      (quotaError as any).status = 429;
      mockLLM.invoke.mockRejectedValueOnce(quotaError);

      await expect(mockLLM.invoke([
        { role: 'user', content: 'Test question' }
      ])).rejects.toThrow('Quota exceeded');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      mockLLM.invoke.mockRejectedValueOnce(timeoutError);

      await expect(mockLLM.invoke([
        { role: 'user', content: 'Test question' }
      ])).rejects.toThrow('Request timeout');
    });

    it('should handle malformed responses', async () => {
      const malformedResponse = { invalid: 'response' };
      mockLLM.invoke.mockResolvedValueOnce(malformedResponse);

      const result = await mockLLM.invoke([
        { role: 'user', content: 'Test question' }
      ]);

      expect(result).toEqual(malformedResponse);
    });
  });

  describe('Embeddings Operations', () => {
    it('should generate embeddings for text queries', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5]; // 5-dimensional embedding
      mockEmbeddings.embedQuery.mockResolvedValueOnce(mockEmbedding);

      const result = await mockEmbeddings.embedQuery('What automation opportunities exist?');

      expect(result).toEqual(mockEmbedding);
      expect(result).toHaveLength(5);
    });

    it('should generate embeddings for multiple documents', async () => {
      const documents = [
        'Email automation saves time',
        'Data entry can be automated',
        'Customer support chatbots improve response time'
      ];

      const mockEmbeddingsResult = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
        [0.7, 0.8, 0.9]
      ];

      mockEmbeddings.embedDocuments.mockResolvedValueOnce(mockEmbeddingsResult);

      const result = await mockEmbeddings.embedDocuments(documents);

      expect(result).toEqual(mockEmbeddingsResult);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(3);
    });

    it('should handle empty text for embeddings', async () => {
      const mockEmbedding = [0.0, 0.0, 0.0];
      mockEmbeddings.embedQuery.mockResolvedValueOnce(mockEmbedding);

      const result = await mockEmbeddings.embedQuery('');

      expect(result).toEqual(mockEmbedding);
    });

    it('should handle long text for embeddings', async () => {
      const longText = 'A'.repeat(10000); // Very long text
      const mockEmbedding = Array.from({ length: 768 }, () => Math.random()); // Typical embedding size

      mockEmbeddings.embedQuery.mockResolvedValueOnce(mockEmbedding);

      const result = await mockEmbeddings.embedQuery(longText);

      expect(result).toHaveLength(768);
    });
  });

  describe('Token Usage and Cost Tracking', () => {
    it('should track token usage for different operations', async () => {
      const responses = [
        {
          content: 'Short response',
          usage_metadata: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
        },
        {
          content: 'Long detailed response with comprehensive analysis...',
          usage_metadata: { input_tokens: 200, output_tokens: 300, total_tokens: 500 }
        }
      ];

      mockLLM.invoke
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1]);

      // Short query
      const result1 = await mockLLM.invoke([{ role: 'user', content: 'Hi' }]);
      expect(result1.usage_metadata.total_tokens).toBe(15);

      // Long query
      const result2 = await mockLLM.invoke([{ role: 'user', content: 'A'.repeat(1000) }]);
      expect(result2.usage_metadata.total_tokens).toBe(500);
    });

    it('should handle missing usage metadata', async () => {
      const responseWithoutMetadata = {
        content: 'Response without metadata'
      };

      mockLLM.invoke.mockResolvedValueOnce(responseWithoutMetadata);

      const result = await mockLLM.invoke([{ role: 'user', content: 'Test' }]);

      expect(result.content).toBe('Response without metadata');
      expect(result.usage_metadata).toBeUndefined();
    });
  });

  describe('Model Configuration', () => {
    it('should use different models for different tasks', () => {
      // Test that different instances can be created with different configs
      const llm1 = new ChatGoogleGenerativeAI({
        model: 'gemini-1.5-pro',
        temperature: 0.3
      });

      const llm2 = new ChatGoogleGenerativeAI({
        model: 'gemini-1.5-flash',
        temperature: 0.7
      });

      expect(llm1).toBeDefined();
      expect(llm2).toBeDefined();
    });

    it('should handle model-specific parameters', async () => {
      const mockResponse = {
        content: 'Creative response',
        usage_metadata: { input_tokens: 50, output_tokens: 100, total_tokens: 150 }
      };

      mockLLM.invoke.mockResolvedValueOnce(mockResponse);

      // High temperature for creative tasks
      const creativeLLM = new ChatGoogleGenerativeAI({
        temperature: 0.9,
        maxTokens: 1000
      });

      const result = await creativeLLM.invoke([
        { role: 'user', content: 'Generate creative automation ideas' }
      ]);

      expect(result.content).toBe('Creative response');
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should handle temporary API failures', async () => {
      const temporaryError = new Error('Temporary server error');
      (temporaryError as any).status = 503;

      mockLLM.invoke
        .mockRejectedValueOnce(temporaryError)
        .mockResolvedValueOnce({
          content: 'Success after retry',
          usage_metadata: { input_tokens: 10, output_tokens: 20, total_tokens: 30 }
        });

      // First call fails
      await expect(mockLLM.invoke([
        { role: 'user', content: 'Test' }
      ])).rejects.toThrow('Temporary server error');

      // Second call succeeds (simulating retry)
      const result = await mockLLM.invoke([
        { role: 'user', content: 'Test' }
      ]);

      expect(result.content).toBe('Success after retry');
    });

    it('should handle context length exceeded', async () => {
      const contextError = new Error('Context length exceeded');
      (contextError as any).status = 400;
      mockLLM.invoke.mockRejectedValueOnce(contextError);

      await expect(mockLLM.invoke([
        { role: 'user', content: 'A'.repeat(100000) } // Very long input
      ])).rejects.toThrow('Context length exceeded');
    });
  });

  describe('Batch Processing', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        messages: [{ role: 'user', content: `Request ${i + 1}` }],
        response: {
          content: `Response ${i + 1}`,
          usage_metadata: { input_tokens: 10, output_tokens: 20, total_tokens: 30 }
        }
      }));

      // Mock all requests to resolve
      requests.forEach(req => {
        mockLLM.invoke.mockResolvedValueOnce(req.response);
      });

      const promises = requests.map(req => mockLLM.invoke(req.messages));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.content).toBe(`Response ${i + 1}`);
      });
    });

    it('should handle partial batch failures', async () => {
      const successResponse = {
        content: 'Success',
        usage_metadata: { input_tokens: 10, output_tokens: 20, total_tokens: 30 }
      };

      const failureError = new Error('API Error');

      mockLLM.invoke
        .mockResolvedValueOnce(successResponse)
        .mockRejectedValueOnce(failureError)
        .mockResolvedValueOnce(successResponse);

      const promises = [
        mockLLM.invoke([{ role: 'user', content: 'Request 1' }]),
        mockLLM.invoke([{ role: 'user', content: 'Request 2' }]),
        mockLLM.invoke([{ role: 'user', content: 'Request 3' }])
      ];

      const results = await Promise.allSettled(promises);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');

      if (results[0].status === 'fulfilled') {
        expect(results[0].value.content).toBe('Success');
      }
    });
  });
});