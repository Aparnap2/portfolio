import { app, discoveryNode, painPointsNode, qualificationNode, shouldContinue } from '@/lib/audit-workflow';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

describe('Audit Workflow Integration', () => {
  describe('Workflow State Transitions', () => {
    it('should start with discovery phase', async () => {
      const initialState = {
        messages: [],
        currentPhase: 'discovery' as const,
      };

      const result = await app.invoke(initialState);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toBeInstanceOf(AIMessage);
      expect(result.messages[0].content).toContain('3-step AI opportunity assessment');
      expect(result.messages[0].content).toContain('industry');
      expect(result.messages[0].content).toContain('employees');
    });

    it('should transition from discovery to pain_points', async () => {
      const state = {
        messages: [new AIMessage('What industry are you in?')],
        currentPhase: 'discovery' as const,
      };

      const result = await app.invoke(state);

      expect(result).toHaveProperty('discoveryData');
      expect(result.discoveryData?.industry).toBe('Technology');
      expect(result.discoveryData?.companySize).toBe('11-50');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toContain('pain points');
    });

    it('should transition from pain_points to qualification', async () => {
      const state = {
        messages: [new AIMessage('What are your main pain points?')],
        currentPhase: 'pain_points' as const,
      };

      const result = await app.invoke(state);

      expect(result).toHaveProperty('painPointsData');
      expect(result.painPointsData?.manualTasks).toBe('Manual data entry');
      expect(result.painPointsData?.bottlenecks).toBe('Slow processes');
      expect(result.painPointsData?.dataSilos).toBe('Disconnected systems');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toContain('budget');
      expect(result.messages[0].content).toContain('timeline');
    });

    it('should transition from qualification to finish', async () => {
      const state = {
        messages: [new AIMessage('What is your budget and timeline?')],
        currentPhase: 'qualification' as const,
      };

      const result = await app.invoke(state);

      expect(result).toHaveProperty('qualificationData');
      expect(result.qualificationData?.budget).toBe('$50,000');
      expect(result.qualificationData?.timeline).toBe('3 months');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toContain('assessment report');
    });

    it('should handle finish state with complete data', async () => {
      const state = {
        messages: [new AIMessage('Preparing your report...')],
        currentPhase: 'finish' as const,
        discoveryData: { industry: 'Technology', companySize: '11-50' },
        painPointsData: {
          manualTasks: 'Manual data entry',
          bottlenecks: 'Slow processes',
          dataSilos: 'Disconnected systems'
        },
        qualificationData: { budget: '$50,000', timeline: '3 months' },
      };

      const result = await app.invoke(state);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toContain('summary of your AI opportunity assessment');
      expect(result.messages[0].content).toContain('Technology');
      expect(result.messages[0].content).toContain('$50,000');
      expect(result.messages[0].content).toContain('Manual data entry');
    });
  });

  describe('Workflow Decision Logic', () => {
    it('shouldContinue should return correct next phase based on state', () => {
      // Empty state should start with discovery
      expect(shouldContinue({ messages: [], currentPhase: 'discovery' as const })).toBe('discovery');

      // Discovery complete should move to pain_points
      const discoveryComplete = {
        messages: [],
        currentPhase: 'discovery' as const,
        discoveryData: { industry: 'tech', companySize: '50' },
      };
      expect(shouldContinue(discoveryComplete)).toBe('pain_points');

      // Pain points complete should move to qualification
      const painPointsComplete = {
        ...discoveryComplete,
        currentPhase: 'pain_points' as const,
        painPointsData: { manualTasks: 'data entry', bottlenecks: 'slow', dataSilos: 'systems' },
      };
      expect(shouldContinue(painPointsComplete)).toBe('qualification');

      // Qualification complete should move to finish
      const qualificationComplete = {
        ...painPointsComplete,
        currentPhase: 'qualification' as const,
        qualificationData: { budget: '$10k', timeline: '3 months' },
      };
      expect(shouldContinue(qualificationComplete)).toBe('finish');
    });
  });

  describe('Individual Node Functions', () => {
    it('discoveryNode should return expected structure', async () => {
      const state = {
        messages: [new HumanMessage('We are a tech company')],
        currentPhase: 'discovery' as const,
      };

      const result = await discoveryNode(state);

      expect(result).toHaveProperty('discoveryData');
      expect(result).toHaveProperty('messages');
      expect(result.discoveryData?.industry).toBe('Technology');
      expect(result.discoveryData?.companySize).toBe('11-50');
      expect(result.messages[0]).toBeInstanceOf(AIMessage);
      expect(result.messages[0].content).toContain('pain points');
    });

    it('painPointsNode should return expected structure', async () => {
      const state = {
        messages: [new HumanMessage('Manual tasks are slow')],
        currentPhase: 'pain_points' as const,
      };

      const result = await painPointsNode(state);

      expect(result).toHaveProperty('painPointsData');
      expect(result).toHaveProperty('messages');
      expect(result.painPointsData?.manualTasks).toBe('Manual data entry');
      expect(result.painPointsData?.bottlenecks).toBe('Slow processes');
      expect(result.painPointsData?.dataSilos).toBe('Disconnected systems');
      expect(result.messages[0]).toBeInstanceOf(AIMessage);
      expect(result.messages[0].content).toContain('budget');
    });

    it('qualificationNode should return expected structure', async () => {
      const state = {
        messages: [new HumanMessage('Budget is $50k')],
        currentPhase: 'qualification' as const,
      };

      const result = await qualificationNode(state);

      expect(result).toHaveProperty('qualificationData');
      expect(result).toHaveProperty('messages');
      expect(result.qualificationData?.budget).toBe('$50,000');
      expect(result.qualificationData?.timeline).toBe('3 months');
      expect(result.messages[0]).toBeInstanceOf(AIMessage);
      expect(result.messages[0].content).toContain('assessment report');
    });
  });
});