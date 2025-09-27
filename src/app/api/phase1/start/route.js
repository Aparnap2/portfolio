import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { companyInfo } = await request.json();

    if (!companyInfo || !companyInfo.name) {
      return NextResponse.json(
        { error: 'Company information is required' },
        { status: 400 }
      );
    }

    // Generate a unique company ID
    const companyId = uuidv4();

    // Create company profile
    const companyData = {
      companyId,
      ...companyInfo,
      createdAt: new Date().toISOString(),
      phase: 'phase1',
      status: 'education_started'
    };

    // In a real implementation, you would save this to your database
    // For now, we'll return the company data
    console.log('Company profile created:', companyData);

    return NextResponse.json({
      companyId,
      message: 'Phase 1 started successfully',
      nextSteps: [
        'Complete leadership education sessions',
        'Review AI readiness assessment',
        'Identify key stakeholders for interviews'
      ]
    });

  } catch (error) {
    console.error('Error starting Phase 1:', error);
    return NextResponse.json(
      { error: 'Failed to start Phase 1' },
      { status: 500 }
    );
  }
}