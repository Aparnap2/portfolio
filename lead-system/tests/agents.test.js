const { EnrichmentAgent } = require('../src/agents/enrichment');
const { ScoringAgent } = require('../src/agents/scoring');
const { RoutingAgent } = require('../src/agents/routing');

// Mock Google AI
jest.mock('@langchain/google-genai');

describe('Lead Processing Agents', () => {
  describe('EnrichmentAgent', () => {
    let agent;
    let mockLLM;

    beforeEach(() => {
      mockLLM = {
        invoke: jest.fn()
      };
      agent = new EnrichmentAgent();
      agent.llm = mockLLM;
    });

    test('should enrich lead data successfully', async () => {
      const mockResponse = {
        content: JSON.stringify({
          companySize: 500,
          industry: 'Technology',
          intentSignals: ['visited pricing page'],
          priority: 'high'
        })
      };
      mockLLM.invoke.mockResolvedValue(mockResponse);

      const state = {
        lead: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@techcorp.com',
          company: 'TechCorp'
        }
      };

      const result = await agent.process(state);

      expect(result.enrichedData).toEqual({
        companySize: 500,
        industry: 'Technology',
        intentSignals: ['visited pricing page'],
        priority: 'high'
      });
      expect(result.status).toBe('enriched');
    });

    test('should handle enrichment errors gracefully', async () => {
      mockLLM.invoke.mockRejectedValue(new Error('API Error'));

      const state = {
        lead: { firstName: 'John', email: 'john@test.com' }
      };

      const result = await agent.process(state);

      expect(result.enrichedData).toEqual({ error: 'Enrichment failed' });
      expect(result.status).toBe('enrichment_error');
    });
  });

  describe('ScoringAgent', () => {
    let agent;
    let mockLLM;

    beforeEach(() => {
      mockLLM = {
        invoke: jest.fn()
      };
      agent = new ScoringAgent();
      agent.llm = mockLLM;
    });

    test('should score lead correctly', async () => {
      const mockResponse = {
        content: JSON.stringify({
          score: 85,
          confidence: 0.9,
          factors: ['large company', 'tech industry', 'high intent']
        })
      };
      mockLLM.invoke.mockResolvedValue(mockResponse);

      const state = {
        lead: { email: 'john@bigtech.com' },
        enrichedData: { companySize: 1000, industry: 'Technology' }
      };

      const result = await agent.process(state);

      expect(result.score.score).toBe(85);
      expect(result.score.confidence).toBe(0.9);
      expect(result.status).toBe('scored');
    });

    test('should provide default score on error', async () => {
      mockLLM.invoke.mockRejectedValue(new Error('Scoring failed'));

      const state = {
        lead: { email: 'test@test.com' },
        enrichedData: {}
      };

      const result = await agent.process(state);

      expect(result.score.score).toBe(50);
      expect(result.score.confidence).toBe(0.5);
      expect(result.status).toBe('scoring_error');
    });
  });

  describe('RoutingAgent', () => {
    let agent;
    let mockLLM;

    beforeEach(() => {
      mockLLM = {
        invoke: jest.fn()
      };
      agent = new RoutingAgent();
      agent.llm = mockLLM;
    });

    test('should route lead to appropriate rep', async () => {
      const mockResponse = {
        content: JSON.stringify({
          assignedRep: 'rep1',
          reason: 'Tech expertise match',
          urgency: 'high'
        })
      };
      mockLLM.invoke.mockResolvedValue(mockResponse);

      const state = {
        lead: { company: 'TechCorp' },
        enrichedData: { industry: 'Technology' },
        score: { score: 90, confidence: 0.95 }
      };

      const result = await agent.process(state);

      expect(result.assignment.assignedRep).toBe('rep1');
      expect(result.assignment.urgency).toBe('high');
      expect(result.status).toBe('routed');
    });

    test('should provide default assignment on error', async () => {
      mockLLM.invoke.mockRejectedValue(new Error('Routing failed'));

      const state = {
        lead: {},
        enrichedData: {},
        score: {}
      };

      const result = await agent.process(state);

      expect(result.assignment.assignedRep).toBe('rep1');
      expect(result.assignment.reason).toBe('default assignment');
      expect(result.status).toBe('routing_error');
    });
  });
});
