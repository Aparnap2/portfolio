import * as Sentry from "@sentry/nextjs";

interface HubSpotContact {
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  phone?: string;
  lifecyclestage?: string;
  hs_lead_status?: string;
}

interface HubSpotDeal {
  dealname: string;
  amount?: number;
  dealstage?: string;
  pipeline?: string;
  closedate?: string;
  hubspot_owner_id?: string;
}

interface HubSpotAssociation {
  fromObjectId: string;
  toObjectId: string;
  type: number;
}

// HubSpot API endpoints
const HUBSPOT_API_BASE = "https://api.hubapi.com";
const CONTACTS_ENDPOINT = "/crm/v3/objects/contacts";
const DEALS_ENDPOINT = "/crm/v3/objects/deals";
const ASSOCIATIONS_ENDPOINT = "/crm/v3/associations";

// Association types (HubSpot constants)
const CONTACT_TO_DEAL_ASSOCIATION_TYPE = 3;

/**
 * Create or update a HubSpot contact
 */
export async function createOrUpdateHubSpotContact(contact: HubSpotContact) {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.warn("[HubSpot] Access token not configured, skipping contact creation");
    return { success: false, error: "HubSpot not configured" };
  }

  try {
    // First, try to find existing contact by email
    const searchResponse = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: "email",
              operator: "EQ",
              value: contact.email,
            }]
          }],
          properties: ["email", "firstname", "lastname", "company", "phone"],
        }),
      }
    );

    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      // Update existing contact
      const existingContact = searchData.results[0];
      const updateResponse = await fetch(
        `${HUBSPOT_API_BASE}${CONTACTS_ENDPOINT}/${existingContact.id}`,
        {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              ...contact,
              hs_lead_status: "NEW",
              lifecyclestage: "lead",
            },
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(`Failed to update contact: ${updateResponse.statusText}`);
      }

      const updatedContact = await updateResponse.json();
      console.log("[HubSpot] Contact updated successfully");
      return {
        success: true,
        contactId: existingContact.id,
        contact: updatedContact,
      };
    } else {
      // Create new contact
      const createResponse = await fetch(
        `${HUBSPOT_API_BASE}${CONTACTS_ENDPOINT}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              ...contact,
              hs_lead_status: "NEW",
              lifecyclestage: "lead",
            },
          }),
        }
      );

      if (!createResponse.ok) {
        throw new Error(`Failed to create contact: ${createResponse.statusText}`);
      }

      const newContact = await createResponse.json();
      console.log("[HubSpot] Contact created successfully");
      return {
        success: true,
        contactId: newContact.id,
        contact: newContact,
      };
    }
  } catch (error) {
    console.error("[HubSpot] Contact creation failed:", error);
    Sentry.captureException(error, {
      tags: { integration: "hubspot", operation: "create_contact" },
      extra: { contact },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a HubSpot deal
 */
export async function createHubSpotDeal(input: {
  email?: string | null;
  name?: string | null;
  company?: string | null;
  dealValue?: number | null;
  painScore?: number | null;
  auditUrl: string;
  timeline?: string;
  budgetRange?: string;
}) {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.warn("[HubSpot] API key not configured, skipping deal creation");
    return { success: false, error: "HubSpot not configured" };
  }

  try {
    // First create/update the contact
    const nameParts = input.name ? input.name.split(' ') : ['', ''];
    const contactResult = await createOrUpdateHubSpotContact({
      email: input.email || '',
      firstname: nameParts[0],
      lastname: nameParts.slice(1).join(' '),
      company: input.company || undefined,
    });

    if (!contactResult.success) {
      throw new Error(contactResult.error || "Failed to create contact");
    }

    // Create the deal
    const dealData: HubSpotDeal = {
      dealname: `AI Automation Opportunity - ${input.company || input.name || 'New Lead'}`,
      amount: input.dealValue || 0,
      dealstage: "appointmentscheduled", // Initial stage
      pipeline: "default", // Use default pipeline
    };

    const dealResponse = await fetch(
      `${HUBSPOT_API_BASE}${DEALS_ENDPOINT}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            ...dealData,
            description: `Pain Score: ${input.painScore || 0}/100\nTimeline: ${input.timeline || 'Not specified'}\nBudget: ${input.budgetRange || 'Not specified'}\n\nAudit Report: ${input.auditUrl}`,
          },
        }),
      }
    );

    if (!dealResponse.ok) {
      throw new Error(`Failed to create deal: ${dealResponse.statusText}`);
    }

    const deal = await dealResponse.json();

    // Associate deal with contact
    const associationData: HubSpotAssociation = {
      fromObjectId: contactResult.contactId!,
      toObjectId: deal.id,
      type: CONTACT_TO_DEAL_ASSOCIATION_TYPE,
    };

    const associationResponse = await fetch(
      `${HUBSPOT_API_BASE}${ASSOCIATIONS_ENDPOINT}/CONTACT/DEAL/batch/create`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: [associationData],
        }),
      }
    );

    if (!associationResponse.ok) {
      console.warn("[HubSpot] Failed to associate deal with contact:", associationResponse.statusText);
    }

    const portalId = process.env.HUBSPOT_PORTAL_ID || "000000";
    const dealUrl = `https://app.hubspot.com/contacts/${portalId}/deal/${deal.id}`;

    console.log("[HubSpot] Deal created successfully:", deal.id);
    
    return {
      success: true,
      dealId: deal.id,
      dealUrl,
      contactId: contactResult.contactId,
    };
  } catch (error) {
    console.error("[HubSpot] Deal creation failed:", error);
    Sentry.captureException(error, {
      tags: { integration: "hubspot", operation: "create_deal" },
      extra: { input },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a follow-up task in HubSpot
 */
export async function createHubSpotTask(input: {
  contactId: string;
  subject: string;
  notes?: string;
  dueDate?: string;
}) {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    return { success: false, error: "HubSpot not configured" };
  }

  try {
    const taskResponse = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/tasks`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            hs_task_subject: input.subject,
            hs_task_body: input.notes || "",
            hs_task_priority: "HIGH",
            hs_task_status: "NOT_STARTED",
            hs_timestamp: input.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          },
          associations: [{
            to: { id: input.contactId },
            types: [{
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 204, // Task to Contact association
            }],
          }],
        }),
      }
    );

    if (!taskResponse.ok) {
      throw new Error(`Failed to create task: ${taskResponse.statusText}`);
    }

    const task = await taskResponse.json();
    console.log("[HubSpot] Task created successfully:", task.id);

    return {
      success: true,
      taskId: task.id,
    };
  } catch (error) {
    console.error("[HubSpot] Task creation failed:", error);
    Sentry.captureException(error, {
      tags: { integration: "hubspot", operation: "create_task" },
      extra: { input },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
