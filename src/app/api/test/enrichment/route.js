import { NextRequest, NextResponse } from 'next/server';

// Mock enrichment agent response (simulated without Google API)
export async function POST(request) {
  try {
    const body = await request.json();
    const { lead } = body;

    // Simulate enrichment processing
    const mockEnrichment = {
      companySize: '50-200 employees',
      industry: 'Technology',
      intentSignals: ['Website visit', 'Content download', 'Email engagement'],
      priority: 'high'
    };

    return NextResponse.json({
      success: true,
      lead,
      enrichedData: mockEnrichment,
      processingTime: '1.2s',
      status: 'enriched'
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Enrichment failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
