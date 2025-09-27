import { NextRequest, NextResponse } from 'next/server';
import { LeadOrchestrator } from '../../../../lib/lead-system/orchestrator';

// Initialize the orchestrator
const orchestrator = new LeadOrchestrator();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Lead ID is required'
        },
        { status: 400 }
      );
    }

    // Get lead status
    const lead = await orchestrator.getLeadStatus(id);

    if (!lead) {
      return NextResponse.json(
        {
          error: 'Lead not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(lead, { status: 200 });

  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Lead ID is required'
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update lead status
    await orchestrator.updateLeadStatus(id, body);

    return NextResponse.json(
      {
        success: true,
        message: 'Lead updated successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}
