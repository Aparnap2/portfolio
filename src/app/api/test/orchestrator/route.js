import { NextRequest, NextResponse } from 'next/server';

// Mock full orchestrator workflow (simulated without database)
export async function POST(request) {
  try {
    const body = await request.json();
    const { lead } = body;

    console.log('🧪 Testing Full Lead Orchestrator Workflow');
    console.log('📥 Input Lead:', lead);

    // Step 1: Enrichment
    const enrichmentResult = {
      companySize: '50-200 employees',
      industry: 'Technology',
      intentSignals: ['Website visit', 'Content download', 'Email engagement'],
      priority: 'high'
    };

    // Step 2: Scoring
    const scoringResult = {
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

    // Step 3: Routing
    const salesTeam = [
      { id: 'rep1', name: 'Alice Johnson', territory: 'North', expertise: ['tech', 'saas'], capacity: 10 },
      { id: 'rep2', name: 'Bob Smith', territory: 'South', expertise: ['finance', 'enterprise'], capacity: 8 },
      { id: 'rep3', name: 'Carol Davis', territory: 'West', expertise: ['healthcare', 'startup'], capacity: 12 }
    ];

    const routingResult = {
      assignedRep: 'rep1',
      repDetails: salesTeam[0],
      reason: 'Best match for technology industry with high lead score',
      urgency: 'high',
      estimatedResponseTime: '2 hours'
    };

    // Simulate workflow timing
    const workflowResult = {
      leadId: 'sim_' + Date.now(),
      lead,
      enrichedData: enrichmentResult,
      score: scoringResult,
      assignment: routingResult,
      status: 'completed',
      processingTime: '2.6s',
      steps: [
        { step: 'enrichment', duration: '1.2s', status: 'success' },
        { step: 'scoring', duration: '0.8s', status: 'success' },
        { step: 'routing', duration: '0.6s', status: 'success' }
      ]
    };

    console.log('✅ Workflow completed successfully');
    console.log('📊 Final Score:', scoringResult.score);
    console.log('👤 Assigned to:', routingResult.repDetails.name);

    return NextResponse.json({
      success: true,
      workflow: workflowResult,
      summary: {
        leadScore: scoringResult.score,
        assignedRep: routingResult.repDetails.name,
        urgency: routingResult.urgency,
        processingTime: workflowResult.processingTime
      }
    });

  } catch (error) {
    console.error('❌ Orchestrator workflow failed:', error);
    return NextResponse.json(
      {
        error: 'Orchestrator workflow failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
