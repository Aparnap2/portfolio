const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

class EnrichmentAgent {
  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      apiKey: process.env.GOOGLE_API_KEY
    });
  }

  async process(state) {
    const { lead } = state;
    
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
      return {
        ...state,
        enrichedData: { error: 'Enrichment failed' },
        status: 'enrichment_error'
      };
    }
  }
}

module.exports = { EnrichmentAgent };
