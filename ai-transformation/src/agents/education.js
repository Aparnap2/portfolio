const { GoogleGenerativeAI } = require('@google/generative-ai');

class EducationAgent {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async createEducationPlan(companyInfo) {
    const prompt = `
    Create a customized AI education plan for leadership team:
    Company: ${companyInfo.name}
    Industry: ${companyInfo.industry}
    Size: ${companyInfo.size} employees
    Current tech level: ${companyInfo.techLevel}
    Challenges: ${companyInfo.currentChallenges}
    
    Generate a JSON response with:
    {
      "keyConcepts": ["concept1", "concept2"],
      "industryUseCases": ["usecase1", "usecase2"],
      "roiExpectations": "timeline and expected returns",
      "misconceptions": ["myth1", "myth2"],
      "recommendedParticipants": ["CEO", "CTO", "COO"],
      "duration": "2-3 hours"
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback response
      return {
        keyConcepts: ["AI fundamentals", "Business process automation", "ROI measurement"],
        industryUseCases: [`${companyInfo.industry} automation`, "Predictive analytics"],
        roiExpectations: "15-25% efficiency gains within 6 months",
        misconceptions: ["AI will replace all jobs", "AI is too expensive"],
        recommendedParticipants: ["CEO", "CTO", "COO"],
        duration: "2-3 hours"
      };
    } catch (error) {
      console.error('Education plan generation error:', error);
      throw error;
    }
  }

  async generateWorkshopContent(companyInfo) {
    const prompt = `
    Create a 2-hour leadership workshop agenda for AI alignment:
    Company: ${companyInfo.name}
    Industry: ${companyInfo.industry}
    
    Generate a JSON response with:
    {
      "agenda": [
        {"time": "0:00-0:30", "topic": "AI Overview", "activities": ["presentation", "discussion"]},
        {"time": "0:30-1:00", "topic": "Industry Applications", "activities": ["case studies"]},
        {"time": "1:00-1:30", "topic": "Vision Setting", "activities": ["workshop exercise"]},
        {"time": "1:30-2:00", "topic": "Next Steps", "activities": ["action planning"]}
      ],
      "materials": ["slides", "worksheets"],
      "outcomes": ["aligned vision", "commitment to proceed"]
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
        agenda: [
          {"time": "0:00-0:30", "topic": "AI Overview", "activities": ["presentation"]},
          {"time": "0:30-1:00", "topic": "Industry Applications", "activities": ["case studies"]},
          {"time": "1:00-1:30", "topic": "Vision Setting", "activities": ["workshop"]},
          {"time": "1:30-2:00", "topic": "Next Steps", "activities": ["planning"]}
        ],
        materials: ["presentation slides", "planning worksheets"],
        outcomes: ["AI vision alignment", "leadership buy-in"]
      };
    } catch (error) {
      console.error('Workshop content generation error:', error);
      throw error;
    }
  }
}

module.exports = { EducationAgent };
