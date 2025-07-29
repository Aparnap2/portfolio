import { NextResponse } from 'next/server';

// Helper function for consistent JSON responses
function jsonResponse(status, data, headers = {}) {
  return NextResponse.json(data, {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// Helper function to find a contact by email
async function findContactByEmail(email, apiKey) {
  const searchPayload = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'email',
            operator: 'EQ',
            value: email,
          },
        ],
      },
    ],
    properties: ['email', 'firstname', 'lastname'], // Request specific properties
    limit: 1,
  };

  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchPayload),
  });

  const data = await response.json();
  if (!response.ok || data.total === 0) {
    return null; // Contact not found or API error
  }
  return data.results[0]; // Return the first matching contact
}

export async function POST(req) {
  const hubspotApiKey = process.env.HUBSPOT_API_KEY;

  if (!hubspotApiKey) {
    console.error("HubSpot API key is not set in environment variables.");
    return jsonResponse(500, { error: "Server configuration error: HubSpot API key is missing." });
  }

  let ticketData;
  try {
    ticketData = await req.json();
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON in request body." });
  }

  const { subject, content, contactEmail } = ticketData;

  if (!subject || !content || !contactEmail) {
    return jsonResponse(400, { error: "Subject, content, and contactEmail are required fields." });
  }

  try {
    // 1. Find the contact by email to get their HubSpot ID
    const contact = await findContactByEmail(contactEmail, hubspotApiKey);

    if (!contact) {
      return jsonResponse(404, {
        error: `Contact with email '${contactEmail}' not found in HubSpot. Please create the contact first.`
      });
    }
    const contactId = contact.id;

    // 2. Create the ticket and associate it with the contact
    const hubspotTicketPayload = {
      properties: {
        subject,
        content,
        hs_pipeline: '0', // '0' is typically the default Support Pipeline
        hs_pipeline_stage: '1', // '1' is typically the 'New' stage
      },
      associations: [
        {
          to: { id: contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 16, // 16 is the ID for "Contact to Ticket" association
            },
          ],
        },
      ],
    };

    const response = await fetch('https://api.hubapi.com/crm/v3/objects/tickets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hubspotTicketPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("HubSpot API error while creating ticket:", responseData);
      const errorMessage = responseData.message || `Failed to create ticket in HubSpot. Status: ${response.status}`;
      return jsonResponse(response.status, { error: errorMessage, details: responseData });
    }

    console.log("Successfully created HubSpot ticket:", responseData);
    return jsonResponse(201, { message: "Ticket created successfully in HubSpot.", data: responseData });

  } catch (error) {
    console.error("An unexpected error occurred while creating HubSpot ticket:", error);
    return jsonResponse(500, { error: "An unexpected error occurred.", details: error.message });
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Adjust for your specific domain in production
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
