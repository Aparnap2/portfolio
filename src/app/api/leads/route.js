import { NextRequest, NextResponse } from 'next/server';
import { LeadOrchestrator } from '../../../lib/lead-system/orchestrator';

// Initialize the orchestrator
const orchestrator = new LeadOrchestrator();

// Validation schema for lead data
const validateLeadData = (data) => {
  const errors = [];

  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.length < 1) {
    errors.push('firstName is required and must be a non-empty string');
  }

  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.length < 1) {
    errors.push('lastName is required and must be a non-empty string');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('email is required and must be a valid email format');
  }

  if (!data.company || typeof data.company !== 'string' || data.company.length < 1) {
    errors.push('company is required and must be a non-empty string');
  }

  return errors;
};

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate the request body
    const validationErrors = validateLeadData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Process the lead
    const result = await orchestrator.processLead(body);

    return NextResponse.json(
      {
        success: true,
        leadId: result.leadId,
        status: result.status
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error processing lead:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Lead API endpoint',
      methods: ['POST'],
      description: 'Create a new lead for processing'
    },
    { status: 200 }
  );
}
