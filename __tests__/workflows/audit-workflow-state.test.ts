import { app, shouldContinue, AppState } from '@/lib/audit-workflow';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

describe('Audit Workflow State Transitions', () => {
  describe('Complete Workflow Flow', () => {
    it('should handle full discovery → pain_points → qualification → completion flow', async () => {
      // Start state
      let state: AppState = {
        messages: [],
        currentPhase: 'discovery',
      };

      // Step 1: Initial discovery question
      let result = await app.invoke(state);
      expect(result.messages[0].content).toContain('3-step AI opportunity assessment');
      expect(result.messages[0].content).toContain('industry');

      // Step 2: User provides discovery info
      state = {
        ...state,
        messages: [result.messages[0], new HumanMessage('We are a SaaS company with 50 employees working in marketing automation')],
      };

      result = await app.invoke(state);
      expect(result.discoveryData?.industry).toBe('Technology');
      expect(result.discoveryData?.companySize).toBe('11-50');
      expect(result.messages[result.messages.length - 1].content).toContain('pain points');

      // Step 3: User provides pain points
      state = {
        ...state,
        messages: [...state.messages, result.messages[result.messages.length - 1], new HumanMessage('Manual data entry takes 10 hours per week, approvals create bottlenecks, and our CRM and accounting systems are disconnected')],
        discoveryData: result.discoveryData,
      };

      result = await app.invoke(state);
      expect(result.painPointsData?.manualTasks).toBe('Manual data entry');
      expect(result.painPointsData?.bottlenecks).toBe('Slow processes');
      expect(result.painPointsData?.dataSilos).toBe('Disconnected systems');
      expect(result.messages[result.messages.length - 1].content).toContain('budget');

      // Step 4: User provides qualification info
      state = {
        ...state,
        messages: [...state.messages, result.messages[result.messages.length - 1], new HumanMessage('Our budget is $50,000 and we need this implemented within 3 months')],
        discoveryData: result.discoveryData,
        painPointsData: result.painPointsData,
      };

      result = await app.invoke(state);
      expect(result.qualificationData?.budget).toBe('$50,000');
      expect(result.qualificationData?.timeline).toBe('3 months');
      expect(result.messages[result.messages.length - 1].content).toContain('assessment report');

      // Step 5: Generate final report
      state = {
        ...state,
        messages: [...state.messages, result.messages[result.messages.length - 1]],
        discoveryData: result.discoveryData,
        painPointsData: result.painPointsData,
        qualificationData: result.qualificationData,
        currentPhase: 'finish',
      };

      result = await app.invoke(state);
      expect(result.messages[result.messages.length - 1].content).toContain('summary of your AI opportunity assessment');
      expect(result.messages[result.messages.length - 1].content).toContain('Technology');
      expect(result.messages[result.messages.length - 1].content).toContain('$50,000');
    });
  });

  describe('State Decision Logic', () => {
    it('should correctly determine next phase based on completion status', () => {
      // No data - should stay in discovery
      const emptyState: AppState = {
        messages: [],
        currentPhase: 'discovery',
      };
      expect(shouldContinue(emptyState)).toBe('discovery');

      // Discovery complete - should move to pain_points
      const discoveryComplete: AppState = {
        messages: [],
        currentPhase: 'discovery',
        discoveryData: { industry: 'tech', companySize: '50' },
      };
      expect(shouldContinue(discoveryComplete)).toBe('pain_points');

      // Pain points complete - should move to qualification
      const painPointsComplete: AppState = {
        ...discoveryComplete,
        currentPhase: 'pain_points',
        painPointsData: {
          manualTasks: 'data entry',
          bottlenecks: 'approvals',
          dataSilos: 'disconnected systems',
        },
      };
      expect(shouldContinue(painPointsComplete)).toBe('qualification');

      // All complete - should move to finish
      const allComplete: AppState = {
        ...painPointsComplete,
        currentPhase: 'qualification',
        qualificationData: { budget: '$50k', timeline: '3 months' },
      };
      expect(shouldContinue(allComplete)).toBe('finish');
    });

    it('should handle partial completion correctly', () => {
      // Partial discovery - should stay in discovery
      const partialDiscovery: AppState = {
        messages: [],
        currentPhase: 'discovery',
        discoveryData: { industry: 'tech' }, // Missing companySize
      };
      expect(shouldContinue(partialDiscovery)).toBe('discovery');

      // Partial pain points - should stay in pain_points
      const partialPainPoints: AppState = {
        messages: [],
        currentPhase: 'pain_points',
        discoveryData: { industry: 'tech', companySize: '50' },
        painPointsData: { manualTasks: 'data entry' }, // Missing others
      };
      expect(shouldContinue(partialPainPoints)).toBe('pain_points');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid currentPhase gracefully', async () => {
      const invalidState = {
        messages: [new HumanMessage('Hello')],
        currentPhase: 'invalid_phase' as any,
      };

      const result = await app.invoke(invalidState);
      // Should default to discovery behavior
      expect(result.discoveryData?.industry).toBe('Technology');
    });

    it('should handle empty messages array', async () => {
      const emptyMessagesState: AppState = {
        messages: [],
        currentPhase: 'discovery',
      };

      const result = await app.invoke(emptyMessagesState);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toBeInstanceOf(AIMessage);
    });

    it('should handle messages with non-string content', async () => {
      const complexMessageState = {
        messages: [
          { content: { text: 'Complex content' }, _getType: () => 'human' },
        ],
        currentPhase: 'discovery' as const,
      };

      const result = await app.invoke(complexMessageState);
      // Should still work with the mock logic
      expect(result).toHaveProperty('discoveryData');
    });
  });

  describe('State Persistence and Recovery', () => {
    it('should maintain state across multiple invocations', async () => {
      let state: AppState = {
        messages: [],
        currentPhase: 'discovery',
      };

      // First invocation
      let result = await app.invoke(state);
      expect(result.discoveryData?.industry).toBe('Technology');

      // Second invocation with accumulated state
      state = {
        messages: [new AIMessage('What industry?'), new HumanMessage('Tech industry')],
        currentPhase: 'discovery',
        discoveryData: result.discoveryData,
      };

      result = await app.invoke(state);
      expect(result.discoveryData?.industry).toBe('Technology'); // Should persist
      expect(result.painPointsData?.manualTasks).toBe('Manual data entry'); // Should add new data
    });

    it('should handle state recovery from partial completion', async () => {
      // Simulate recovering from a saved state
      const recoveredState: AppState = {
        messages: [
          new AIMessage('What are your pain points?'),
          new HumanMessage('Manual tasks and bottlenecks'),
        ],
        currentPhase: 'pain_points',
        discoveryData: { industry: 'Technology', companySize: '11-50' },
        painPointsData: { manualTasks: 'Manual data entry', bottlenecks: 'Slow processes' },
      };

      const result = await app.invoke(recoveredState);
      expect(result.qualificationData?.budget).toBe('$50,000');
      expect(result.qualificationData?.timeline).toBe('3 months');
    });
  });
});