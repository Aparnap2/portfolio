import { NextRequest, NextResponse } from 'next/server';

// Mock HubSpot integration test (simulated without actual API calls)
export async function POST(request) {
  try {
    const body = await request.json();
    const { lead, enrichedData, score, assignment } = body;

    console.log('🧪 Testing HubSpot Integration (Simulated)');

    // Mock HubSpot contact creation
    const mockHubSpotContact = {
      id: 'hs_' + Date.now(),
      properties: {
        firstname: lead.firstName,
        lastname: lead.lastName,
        email: lead.email,
        company: lead.company,
        lead_score: score.score,
        lead_source: 'Portfolio Website',
        industry: enrichedData.industry,
        company_size: enrichedData.companySize,
        assigned_sales_rep: assignment.repDetails.name,
        lead_priority: score.score >= 80 ? 'High' : score.score >= 60 ? 'Medium' : 'Low'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Mock HubSpot response
    const mockHubSpotResponse = {
      success: true,
      contact: mockHubSpotContact,
      actions: [
        'Contact created in HubSpot',
        'Lead score added to contact record',
        'Sales rep assigned',
        'Follow-up task created'
      ],
      metadata: {
        contactId: mockHubSpotContact.id,
        syncTime: '0.3s',
        status: 'synced'
      }
    };

    console.log('✅ HubSpot sync completed');
    console.log('📧 Contact ID:', mockHubSpotContact.id);
    console.log('🎯 Lead Priority:', mockHubSpotContact.properties.lead_priority);

    return NextResponse.json({
      success: true,
      hubspot: mockHubSpotResponse,
      summary: {
        contactId: mockHubSpotContact.id,
        leadPriority: mockHubSpotContact.properties.lead_priority,
        assignedRep: assignment.repDetails.name,
        syncStatus: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ HubSpot integration failed:', error);
    return NextResponse.json(
      {
        error: 'HubSpot integration failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
