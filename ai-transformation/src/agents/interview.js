const { GoogleGenerativeAI } = require('@google/generative-ai');

class InterviewAgent {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async analyzeResponses(answers, role) {
    const prompt = `
    Analyze interview responses from ${role}:
    Daily Tasks: ${answers.dailyTasks}
    Pain Points: ${answers.painPoints}
    Manual Processes: ${answers.manualProcesses}
    Time Breakdown: ${answers.timeBreakdown}
    Systems Used: ${answers.systemsUsed}
    
    Extract and return JSON with:
    {
      "processes": [{"name": "process", "timeSpent": "hours", "painLevel": "high/medium/low"}],
      "painPoints": [{"issue": "description", "impact": "high/medium/low", "frequency": "daily/weekly"}],
      "automationOpportunities": [{"task": "description", "effort": "low/medium/high", "impact": "high/medium/low"}],
      "systemsUsed": ["system1", "system2"],
      "timeWasters": [{"activity": "description", "timeSpent": "hours/day"}]
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
        processes: [{"name": "Manual reporting", "timeSpent": "2 hours", "painLevel": "high"}],
        painPoints: [{"issue": "Data entry", "impact": "high", "frequency": "daily"}],
        automationOpportunities: [{"task": "Report generation", "effort": "medium", "impact": "high"}],
        systemsUsed: ["Excel", "Email"],
        timeWasters: [{"activity": "Manual data entry", "timeSpent": "2 hours/day"}]
      };
    } catch (error) {
      console.error('Interview analysis error:', error);
      throw error;
    }
  }

  async generateFollowUp(processedInterview) {
    const prompt = `
    Based on this interview analysis:
    ${JSON.stringify(processedInterview)}
    
    Generate 5 targeted follow-up questions to get more specific details.
    Return JSON array: ["question1", "question2", "question3", "question4", "question5"]
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
        "How much time do you spend on manual data entry daily?",
        "What systems do you wish could talk to each other?",
        "What's the most frustrating part of your current process?",
        "How often do you have to redo work due to errors?",
        "What would save you the most time if automated?"
      ];
    } catch (error) {
      console.error('Follow-up generation error:', error);
      throw error;
    }
  }
}

module.exports = { InterviewAgent };
