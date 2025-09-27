import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // For now, generate a mock roadmap based on companyId
    // In a real implementation, you would fetch company data from your database
    const roadmap = await generateAIRoadmap(companyId);

    return NextResponse.json(roadmap);

  } catch (error) {
    console.error('Error generating AI roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI roadmap' },
      { status: 500 }
    );
  }
}

async function generateAIRoadmap(companyId: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
You are an AI strategy consultant. Generate a comprehensive AI transformation roadmap for a company with ID: ${companyId}.

Please provide a detailed JSON response with the following structure:

{
  "executiveSummary": "A 2-3 paragraph executive summary of the AI transformation strategy",
  "quickWins": [
    {
      "title": "Quick win title",
      "description": "Detailed description of the quick win",
      "roi": "Expected ROI percentage",
      "timeline": "Implementation timeline"
    }
  ],
  "timeline": [
    {
      "phase": "Phase name (e.g., Phase 1: Assessment)",
      "duration": "Duration (e.g., 1-3 months)",
      "description": "Detailed description of what happens in this phase"
    }
  ],
  "roi": {
    "year1": "Year 1 ROI projection",
    "timeSavings": "Expected time savings",
    "costReduction": "Expected cost reduction percentage"
  }
}

Make the roadmap realistic, actionable, and tailored to a modern business looking to implement AI solutions.
Include specific technologies, implementation steps, and measurable outcomes.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    try {
      // Clean up the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
    }

    // Fallback: return a structured response based on the text
    return generateFallbackRoadmap(text, companyId);

  } catch (error) {
    console.error('Error calling Google Generative AI:', error);
    // Return a fallback roadmap
    return generateFallbackRoadmap('Error generating AI roadmap', companyId);
  }
}

function generateFallbackRoadmap(aiResponse: string, companyId: string) {
  // Generate a comprehensive fallback roadmap
  return {
    executiveSummary: `AI transformation strategy for company ${companyId}. This comprehensive roadmap outlines the strategic implementation of artificial intelligence solutions to drive business growth, improve operational efficiency, and enhance competitive advantage. The strategy focuses on three key phases: assessment and planning, pilot implementation, and full-scale deployment.`,

    quickWins: [
      {
        title: "Automated Customer Support Chatbot",
        description: "Implement an AI-powered chatbot to handle 60% of customer inquiries automatically, reducing response time from hours to seconds",
        roi: "300%",
        timeline: "2-4 weeks"
      },
      {
        title: "Intelligent Document Processing",
        description: "Use AI to automatically extract and categorize information from documents, reducing manual data entry by 80%",
        roi: "250%",
        timeline: "3-6 weeks"
      },
      {
        title: "Predictive Analytics Dashboard",
        description: "Create real-time dashboards with predictive insights to optimize inventory and sales forecasting",
        roi: "180%",
        timeline: "4-8 weeks"
      }
    ],

    timeline: [
      {
        phase: "Phase 1: Assessment & Planning",
        duration: "1-3 months",
        description: "Conduct comprehensive AI readiness assessment, identify high-impact use cases, develop data strategy, and create implementation roadmap"
      },
      {
        phase: "Phase 2: Pilot Implementation",
        duration: "3-6 months",
        description: "Implement initial AI solutions in controlled environments, train teams, measure results, and refine approach based on learnings"
      },
      {
        phase: "Phase 3: Full-Scale Deployment",
        duration: "6-12 months",
        description: "Roll out AI solutions across the organization, integrate with existing systems, and establish governance and monitoring frameworks"
      },
      {
        phase: "Phase 4: Optimization & Scaling",
        duration: "12+ months",
        description: "Continuously optimize AI models, expand to new use cases, and scale successful implementations across the enterprise"
      }
    ],

    roi: {
      year1: "150-300%",
      timeSavings: "40-60% reduction in manual tasks",
      costReduction: "25-40% operational cost savings"
    }
  };
}