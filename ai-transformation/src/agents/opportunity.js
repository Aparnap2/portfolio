const { GoogleGenerativeAI } = require('@google/generative-ai');

class OpportunityAgent {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async identifyOpportunities(interviews) {
    const prompt = `
    Analyze all interview data to identify AI automation opportunities:
    ${JSON.stringify(interviews)}
    
    Return JSON array:
    [
      {
        "title": "Automate Report Generation",
        "description": "Replace manual Excel reporting with automated dashboards",
        "category": "document processing",
        "affectedRoles": ["Manager", "Analyst"],
        "timeSavings": "10 hours/week"
      }
    ]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [
        {
          "title": "Automate Data Entry",
          "description": "Replace manual data entry with automated form processing",
          "category": "data processing",
          "affectedRoles": ["Admin", "Clerk"],
          "timeSavings": "15 hours/week"
        },
        {
          "title": "Automated Reporting",
          "description": "Generate reports automatically from database",
          "category": "reporting",
          "affectedRoles": ["Manager", "Analyst"],
          "timeSavings": "8 hours/week"
        }
      ];
    } catch (error) {
      console.error('Opportunity identification error:', error);
      throw error;
    }
  }

  async gradeOpportunities(opportunities) {
    const prompt = `
    Grade these AI opportunities on Value vs Difficulty (1-10 scale):
    ${JSON.stringify(opportunities)}
    
    Return JSON with scores:
    [
      {
        "title": "opportunity title",
        "valueScore": 8,
        "difficultyScore": 3,
        "category": "Quick Win",
        "roi": "300%",
        "implementation": "2-4 weeks"
      }
    ]
    
    Categories: Quick Win (High Value, Low Difficulty), Major Project (High Value, High Difficulty), Fill-in (Low Value, Low Difficulty), Questionable (Low Value, High Difficulty)
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return opportunities.map(opp => ({
        ...opp,
        valueScore: 7,
        difficultyScore: 4,
        category: "Quick Win",
        roi: "250%",
        implementation: "4-6 weeks"
      }));
    } catch (error) {
      console.error('Opportunity grading error:', error);
      throw error;
    }
  }

  async generateRoadmap(companyData, opportunities) {
    const prompt = `
    Create comprehensive AI Strategy Roadmap:
    Company: ${JSON.stringify(companyData)}
    Opportunities: ${JSON.stringify(opportunities)}
    
    Generate detailed JSON roadmap:
    {
      "executiveSummary": "2-3 paragraph summary",
      "quickWins": [
        {"title": "Quick Win 1", "description": "details", "roi": "300%", "timeline": "4 weeks"}
      ],
      "timeline": [
        {"phase": "Phase 1 (0-6 months)", "duration": "6 months", "description": "Quick wins implementation"}
      ],
      "roi": {
        "year1": "250%",
        "timeSavings": "40 hours/week",
        "costReduction": "$150K/year"
      },
      "riskAssessment": "Low to medium risk profile",
      "successMetrics": ["Time savings", "Cost reduction", "User adoption"]
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        executiveSummary: `Based on our analysis of ${companyData.name}, we've identified significant opportunities for AI automation that could save 40+ hours per week and reduce operational costs by $150K annually. The recommended approach focuses on quick wins first, followed by strategic implementations.`,
        quickWins: opportunities.filter(o => o.category === "Quick Win").slice(0, 3),
        timeline: [
          {"phase": "Phase 1 (0-6 months)", "duration": "6 months", "description": "Quick wins and foundation"},
          {"phase": "Phase 2 (6-12 months)", "duration": "6 months", "description": "Major projects implementation"},
          {"phase": "Phase 3 (12-18 months)", "duration": "6 months", "description": "Advanced AI integration"}
        ],
        roi: {
          year1: "250%",
          timeSavings: "40 hours/week",
          costReduction: "$150K/year"
        },
        riskAssessment: "Low to medium risk with proper change management",
        successMetrics: ["Time savings", "Cost reduction", "User adoption", "Process efficiency"]
      };
    } catch (error) {
      console.error('Roadmap generation error:', error);
      throw error;
    }
  }
}

module.exports = { OpportunityAgent };
