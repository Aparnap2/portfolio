import { NextRequest, NextResponse } from 'next/server';

// Mock scoring agent response (simulated without Google API)
export async function POST(request) {
  try {
    const body = await request.json();
    const { lead, enrichedData } = body;

    // Simulate scoring processing
    const mockScore = {
      score: 85,
      confidence: 0.9,
      factors: ['Company size', 'Industry fit', 'Intent signals', 'Email domain quality'],
      breakdown: {
        companySize: 25,
        industry: 20,
        intentSignals: 30,
        emailQuality: 10
      }
    };

    return NextResponse.json({
      success: true,
      lead,
      enrichedData,
      score: mockScore,
      processingTime: '0.8s',
      status: 'scored'
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Scoring failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
