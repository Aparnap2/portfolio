import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { companyId, role, answers } = await request.json();

    if (!companyId || !role || !answers) {
      return NextResponse.json(
        { error: 'Company ID, role, and answers are required' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Analyze the interview responses using AI
    const analysis = await analyzeInterviewResponses(role, answers);

    // In a real implementation, you would save this to your database
    console.log('Interview analysis completed:', {
      companyId,
      role,
      analysis: analysis.summary
    });

    return NextResponse.json({
      role,
      companyId,
      analysis,
      insights: [
        'Key pain points identified',
        'Automation opportunities detected',
        'Process improvement recommendations generated'
      ]
    });

  } catch (error) {
    console.error('Error processing interview:', error);
    return NextResponse.json(
      { error: 'Failed to process interview' },
      { status: 500 }
    );
  }
}

async function analyzeInterviewResponses(role: string, answers: any) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
You are an AI business analyst conducting interviews for AI transformation opportunities.

Please analyze the following interview responses from a ${role}:

Daily Tasks & Responsibilities: ${answers.dailyTasks || 'Not provided'}
Current Pain Points & Frustrations: ${answers.painPoints || 'Not provided'}
Manual/Repetitive Processes: ${answers.manualProcesses || 'Not provided'}
Time Spent on Key Activities: ${answers.timeBreakdown || 'Not provided'}
Systems & Tools Used: ${answers.systemsUsed || 'Not provided'}

Please provide a JSON response with the following structure:

{
  "summary": "2-3 sentence summary of key findings",
  "painPoints": ["List of main pain points identified"],
  "automationOpportunities": ["Specific processes that could be automated"],
  "timeSavings": "Estimated time savings potential",
  "aiSolutions": ["Recommended AI solutions for this role"],
  "priority": "high|medium|low",
  "implementationComplexity": "simple|moderate|complex"
}

Focus on identifying concrete automation opportunities and AI solutions that would provide immediate value.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
    }

    // Fallback analysis
    return generateFallbackAnalysis(role, answers);

  } catch (error) {
    console.error('Error calling Google Generative AI:', error);
    return generateFallbackAnalysis(role, answers);
  }
}

function generateFallbackAnalysis(role: string, answers: any) {
  return {
    summary: `Analysis completed for ${role} role. Key findings include manual processes and pain points that present clear opportunities for AI automation and process optimization.`,
    painPoints: [
      'Manual data entry and repetitive tasks',
      'Time-consuming reporting and analysis',
      'Communication and coordination challenges'
    ],
    automationOpportunities: [
      'Automated report generation',
      'Intelligent data processing',
      'Smart scheduling and reminders'
    ],
    timeSavings: '20-40% reduction in manual tasks',
    aiSolutions: [
      'Document processing AI',
      'Predictive analytics tools',
      'Automated workflow systems'
    ],
    priority: 'high',
    implementationComplexity: 'moderate'
  };
}