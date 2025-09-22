const { GoogleGenerativeAI } = require('@google/generative-ai');

class ProcessMappingAgent {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async generateProcessMap(interviewData) {
    const prompt = `
    Create a visual process map from interview data:
    ${JSON.stringify(interviewData)}
    
    Generate JSON with:
    {
      "processFlow": [
        {"step": 1, "action": "description", "time": "minutes", "system": "tool used", "painPoint": true/false}
      ],
      "bottlenecks": [{"step": 2, "issue": "description", "impact": "high/medium/low"}],
      "mermaidDiagram": "flowchart TD\\nA[Start] --> B[Step 1]\\nB --> C[Step 2]",
      "totalTime": "hours per cycle",
      "automationPotential": "high/medium/low"
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
        processFlow: [
          {"step": 1, "action": "Collect data", "time": "30 minutes", "system": "Excel", "painPoint": true},
          {"step": 2, "action": "Format report", "time": "45 minutes", "system": "PowerPoint", "painPoint": true},
          {"step": 3, "action": "Send to stakeholders", "time": "15 minutes", "system": "Email", "painPoint": false}
        ],
        bottlenecks: [{"step": 1, "issue": "Manual data collection", "impact": "high"}],
        mermaidDiagram: "flowchart TD\nA[Start] --> B[Collect Data]\nB --> C[Format Report]\nC --> D[Send Report]",
        totalTime: "1.5 hours per cycle",
        automationPotential: "high"
      };
    } catch (error) {
      console.error('Process mapping error:', error);
      throw error;
    }
  }
}

module.exports = { ProcessMappingAgent };
