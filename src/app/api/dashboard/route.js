import { NextRequest, NextResponse } from 'next/server';
import { LeadOrchestrator } from '../../../lib/lead-system/orchestrator';

// Initialize the orchestrator
const orchestrator = new LeadOrchestrator();

export async function GET(request) {
  try {
    // Get dashboard statistics
    const stats = await orchestrator.getDashboardStats();

    return NextResponse.json(
      {
        success: true,
        data: stats
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return NextResponse.json(
    {
      message: 'Dashboard API endpoint',
      methods: ['GET'],
      description: 'Get dashboard statistics and analytics'
    },
    { status: 200 }
  );
}
