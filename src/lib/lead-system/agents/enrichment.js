const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

class EnrichmentAgent {
  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      console.warn('GOOGLE_API_KEY not found, enrichment will use mock data');
      this.llm = null;
    } else {
      this.llm = new ChatGoogleGenerativeAI({
        model: 'gemini-1.5-flash', // Use stable model instead of experimental
        apiKey: process.env.GOOGLE_API_KEY
      });
    }
  }

  async process(state) {
    const { lead } = state;

    // If no API key, return mock enrichment data
    if (!this.llm) {
      return {
        ...state,
        enrichedData: {
          companySize: '10-50 employees',
          industry: 'Technology',
          intentSignals: ['Website visit', 'Content download'],
          priority: 'medium'
        },
        status: 'enriched'
      };
    }

    // Basic enrichment using AI
    const enrichmentPrompt = `
    Analyze this lead and provide enrichment data:
    Name: ${lead.firstName} ${lead.lastName}
    Email: ${lead.email}
    Company: ${lead.company}

    Return JSON with:
    - companySize (estimate)
    - industry (best guess)
    - intentSignals (array of signals)
    - priority (high/medium/low)
    `;

    try {
      const response = await this.llm.invoke(enrichmentPrompt);
      const enrichedData = JSON.parse(response.content);

      return {
        ...state,
        enrichedData,
        status: 'enriched'
      };
    } catch (error) {
      console.error('Enrichment error:', error);
      return {
        ...state,
        enrichedData: {
          companySize: 'Unknown',
          industry: 'Unknown',
          intentSignals: ['API Error'],
          priority: 'low'
        },
        status: 'enrichment_error'
      };
    }
  }
}

module.exports = { EnrichmentAgent };
