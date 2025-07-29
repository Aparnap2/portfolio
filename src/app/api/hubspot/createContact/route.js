import { NextResponse } from 'next/server';

// Helper function for consistent JSON responses
function jsonResponse(status, data, headers = {}) {
  return NextResponse.json(data, {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export async function POST(req) {
  const hubspotApiKey = process.env.HUBSPOT_API_KEY;

  if (!hubspotApiKey) {
    console.error("HubSpot API key is not set in environment variables.");
    return jsonResponse(500, { error: "Server configuration error: HubSpot API key is missing." });
  }

  let contactData;
  try {
    contactData = await req.json();
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON in request body." });
  }

  const { email, firstname, lastname, phone } = contactData;

  if (!email) {
    return jsonResponse(400, { error: "Email is a required field." });
  }

  const hubspotContactPayload = {
    properties: {
      email,
      firstname: firstname || '',
      lastname: lastname || '',
      phone: phone || '',
    },
  };

  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hubspotContactPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("HubSpot API error:", responseData);
      // Pass HubSpot's error message to the client if available
      const errorMessage = responseData.message || `Failed to create contact in HubSpot. Status: ${response.status}`;
      return jsonResponse(response.status, { error: errorMessage, details: responseData });
    }

    console.log("Successfully created HubSpot contact:", responseData);
    return jsonResponse(201, { message: "Contact created successfully in HubSpot.", data: responseData });

  } catch (error) {
    console.error("An unexpected error occurred while creating HubSpot contact:", error);
    return jsonResponse(500, { error: "An unexpected error occurred.", details: error.message });
  }
}

// Add OPTIONS handler for CORS preflight requests if your frontend is on a different domain
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
