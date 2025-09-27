import { NextRequest, NextResponse } from 'next/server';

// Mock routing agent response (simulated without Google API)
export async function POST(request) {
  try {
    const body = await request.json();
    const { lead, enrichedData, score } = body;

    // Mock sales team data
    const salesTeam = [
      { id: 'rep1', name: 'Alice Johnson', territory: 'North', expertise: ['tech', 'saas'], capacity: 10 },
      { id: 'rep2', name: 'Bob Smith', territory: 'South', expertise: ['finance', 'enterprise'], capacity: 8 },
      { id: 'rep3', name: 'Carol Davis', territory: 'West', expertise: ['healthcare', 'startup'], capacity: 12 }
    ];

    // Simulate routing processing
    const mockAssignment = {
      assignedRep: 'rep1',
      repDetails: salesTeam[0],
      reason: 'Best match for technology industry with high lead score',
      urgency: 'high',
      estimatedResponseTime: '2 hours'
    };

    return NextResponse.json({
      success: true,
      lead,
      enrichedData,
      score,
      assignment: mockAssignment,
      salesTeam,
      processingTime: '0.6s',
      status: 'routed'
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Routing failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
