const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

class ScoringAgent {
  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      apiKey: process.env.GOOGLE_API_KEY
    });
  }

  async process(state) {
    const { lead, enrichedData } = state;
    
    const scoringPrompt = `
    Score this lead from 0-100 based on:
    Lead: ${JSON.stringify(lead)}
    Enriched Data: ${JSON.stringify(enrichedData)}
    
    Consider:
    - Company size (larger = higher score)
    - Industry fit
    - Intent signals
    - Email domain quality
    
    Return JSON with:
    - score (0-100)
    - confidence (0-1)
    - factors (array of scoring factors)
    `;

    try {
      const response = await this.llm.invoke(scoringPrompt);
      const scoreData = JSON.parse(response.content);
      
      return {
        ...state,
        score: scoreData,
        status: 'scored'
      };
    } catch (error) {
      return {
        ...state,
        score: { score: 50, confidence: 0.5, factors: ['default'] },
        status: 'scoring_error'
      };
    }
  }
}

module.exports = { ScoringAgent };
