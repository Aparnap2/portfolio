const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

class ScoringAgent {
  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      console.warn('GOOGLE_API_KEY not found, scoring will use default values');
      this.llm = null;
    } else {
      this.llm = new ChatGoogleGenerativeAI({
        model: 'gemini-1.5-flash', // Use stable model instead of experimental
        apiKey: process.env.GOOGLE_API_KEY
      });
    }
  }

  async process(state) {
    const { lead, enrichedData } = state;

    // If no API key, return default scoring
    if (!this.llm) {
      return {
        ...state,
        score: {
          score: 75,
          confidence: 0.8,
          factors: ['Company size', 'Industry fit', 'Intent signals']
        },
        status: 'scored'
      };
    }

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
      console.error('Scoring error:', error);
      return {
        ...state,
        score: {
          score: 50,
          confidence: 0.5,
          factors: ['API Error']
        },
        status: 'scoring_error'
      };
    }
  }
}

module.exports = { ScoringAgent };
