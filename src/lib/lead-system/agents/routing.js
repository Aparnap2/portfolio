const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

class RoutingAgent {
  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      console.warn('GOOGLE_API_KEY not found, routing will use default assignment');
      this.llm = null;
    } else {
      this.llm = new ChatGoogleGenerativeAI({
        model: 'gemini-1.5-flash', // Use stable model instead of experimental
        apiKey: process.env.GOOGLE_API_KEY
      });
    }

    // Mock sales team data
    this.salesTeam = [
      { id: 'rep1', name: 'Alice Johnson', territory: 'North', expertise: ['tech', 'saas'], capacity: 10 },
      { id: 'rep2', name: 'Bob Smith', territory: 'South', expertise: ['finance', 'enterprise'], capacity: 8 },
      { id: 'rep3', name: 'Carol Davis', territory: 'West', expertise: ['healthcare', 'startup'], capacity: 12 }
    ];
  }

  async process(state) {
    const { lead, enrichedData, score } = state;

    // If no API key, return default routing
    if (!this.llm) {
      return {
        ...state,
        assignment: {
          assignedRep: 'rep1',
          reason: 'Default assignment - Alice Johnson (North territory)',
          urgency: 'medium'
        },
        status: 'routed'
      };
    }

    const routingPrompt = `
    Assign this lead to the best sales rep:
    Lead: ${JSON.stringify(lead)}
    Enriched Data: ${JSON.stringify(enrichedData)}
    Score: ${JSON.stringify(score)}

    Sales Team: ${JSON.stringify(this.salesTeam)}

    Consider:
    - Territory match
    - Expertise alignment
    - Current capacity
    - Lead priority

    Return JSON with:
    - assignedRep (rep id)
    - reason (why this rep)
    - urgency (high/medium/low)
    `;

    try {
      const response = await this.llm.invoke(routingPrompt);
      const assignment = JSON.parse(response.content);

      return {
        ...state,
        assignment,
        status: 'routed'
      };
    } catch (error) {
      console.error('Routing error:', error);
      return {
        ...state,
        assignment: {
          assignedRep: 'rep1',
          reason: 'Default assignment due to API error',
          urgency: 'medium'
        },
        status: 'routing_error'
      };
    }
  }
}

module.exports = { RoutingAgent };
