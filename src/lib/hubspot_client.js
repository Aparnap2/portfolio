import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

const redis = Redis.fromEnv();
const log = {
  info: (...args) => console.log("[HUBSPOT]", ...args),
  warn: (...args) => console.warn("[HUBSPOT]", ...args),
  error: (...args) => console.error("[HUBSPOT]", ...args),
};

class HubSpotClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = "https://api.hubapi.com/crm/v3/objects";
    this.associationsURL = "https://api.hubapi.com/crm/v4/associations";
  }

  // Validate access token by testing a simple API call
  async validateToken() {
    try {
      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        log.info('HubSpot token validation successful');
        return true;
      } else if (response.status === 401) {
        log.error('HubSpot token validation failed: Invalid or expired token');
        return false;
      } else {
        log.warn(`HubSpot token validation failed with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      log.error('HubSpot token validation error:', error.message);
      return false;
    }
  }

  // Generic API request method with error handling and retry logic
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        if (response.ok) {
          // Handle 204 No Content responses
          const text = await response.text();
          return text ? JSON.parse(text) : { success: true };
        }

        // Handle authentication errors specifically
        if (response.status === 401) {
          log.error('HubSpot authentication failed. Token may be invalid or expired.');
          throw new Error('HubSpot authentication failed: Invalid or expired token');
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 60;
          log.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          attempt++;
          continue;
        }

        // Handle other HTTP errors
        const errorText = await response.text();
        log.error(`HubSpot API error (${response.status}):`, errorText);
        throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);

      } catch (error) {
        // Don't retry authentication errors
        if (error.message.includes('authentication') || error.message.includes('401')) {
          throw error;
        }
        
        if (attempt === maxRetries - 1) {
          throw error;
        }

        // Exponential backoff for network errors
        const delay = Math.pow(2, attempt) * 1000;
        log.warn(`Network error. Retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }

    throw new Error('Max retries exceeded');
  }

  // Create or update a contact
  async createOrUpdateContact(contactData) {
    try {
      // First, try to find existing contact by email
      const existingContact = await this.findContactByEmail(contactData.email);

      if (existingContact) {
        log.info(`Updating existing contact: ${contactData.email}`);
        return await this.updateContact(existingContact.id, contactData);
      } else {
        log.info(`Creating new contact: ${contactData.email}`);
        return await this.createContact(contactData);
      }
    } catch (error) {
      log.error('Error in createOrUpdateContact:', error);
      throw error;
    }
  }

  // Find contact by email
  async findContactByEmail(email) {
    try {
      const searchURL = `https://api.hubapi.com/crm/v3/objects/contacts/search`;

      const searchBody = {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }],
        properties: ['email', 'firstname', 'lastname', 'company', 'phone'],
        limit: 1
      };

      const response = await fetch(searchURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchBody)
      });

      if (response.ok) {
        const text = await response.text();
        const result = text ? JSON.parse(text) : { results: [] };
        return result.results.length > 0 ? result.results[0] : null;
      }

      return null;
    } catch (error) {
      log.error('Error finding contact by email:', error);
      return null;
    }
  }

  // Create a new contact
  async createContact(contactData) {
    const properties = {
      email: contactData.email,
      firstname: contactData.firstname || contactData.name?.split(' ')[0] || '',
      lastname: contactData.lastname || contactData.name?.split(' ').slice(1).join(' ') || '',
      company: contactData.company || '',
      phone: contactData.phone || '',
      industry: contactData.industry || '',
      jobtitle: contactData.jobtitle || '',
      website: contactData.website || '',
      address: contactData.address || '',
      lifecyclestage: contactData.lifecyclestage || 'lead',
      hs_lead_status: contactData.hs_lead_status || 'NEW',
      // Custom fields for additional information
      message: contactData.message || '',
      requirements: contactData.requirements || '',
      budget: contactData.budget || '',
      timeline: contactData.timeline || '',
      company_size: contactData.company_size || '',
      current_challenges: contactData.current_challenges || '',
      conversation_summary: contactData.conversation_summary || '',
      lead_score: contactData.lead_score?.toString() || '0',
      lead_source: contactData.lead_source || 'AI Chatbot',
      lead_source_detail: contactData.lead_source_detail || 'Website Chat'
    };

    return await this.makeRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify({ properties })
    });
  }

  // Update an existing contact
  async updateContact(contactId, contactData) {
    const properties = {
      ...(contactData.firstname && { firstname: contactData.firstname }),
      ...(contactData.lastname && { lastname: contactData.lastname }),
      ...(contactData.company && { company: contactData.company }),
      ...(contactData.phone && { phone: contactData.phone }),
      ...(contactData.industry && { industry: contactData.industry }),
      ...(contactData.jobtitle && { jobtitle: contactData.jobtitle }),
      ...(contactData.website && { website: contactData.website }),
      ...(contactData.address && { address: contactData.address }),
      ...(contactData.requirements && { requirements: contactData.requirements }),
      ...(contactData.budget && { budget: contactData.budget }),
      ...(contactData.timeline && { timeline: contactData.timeline }),
      ...(contactData.company_size && { company_size: contactData.company_size }),
      ...(contactData.current_challenges && { current_challenges: contactData.current_challenges }),
      ...(contactData.conversation_summary && { conversation_summary: contactData.conversation_summary }),
      ...(contactData.lead_score && { lead_score: contactData.lead_score.toString() }),
      ...(contactData.message && { message: contactData.message }),
      lastmodifieddate: new Date().toISOString()
    };

    return await this.makeRequest(`/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties })
    });
  }

  // Create a company
  async createCompany(companyData) {
    const properties = {
      name: companyData.name || '',
      domain: companyData.domain || '',
      industry: companyData.industry || '',
      size: companyData.size || companyData.company_size || '',
      phone: companyData.phone || '',
      website: companyData.website || '',
      address: companyData.address || '',
      description: companyData.description || '',
      annualrevenue: companyData.annualrevenue || '',
      lifecyclestage: companyData.lifecyclestage || 'lead'
    };

    return await this.makeRequest('/companies', {
      method: 'POST',
      body: JSON.stringify({ properties })
    });
  }

  // Create a deal
  async createDeal(dealData) {
    const properties = {
      dealname: dealData.dealname || `New Opportunity - ${dealData.company || 'Unknown Company'}`,
      amount: dealData.amount || '',
      closedate: dealData.closedate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      pipeline: dealData.pipeline || 'default',
      dealstage: dealData.dealstage || 'appointmentscheduled',
      hubspot_owner_id: dealData.hubspot_owner_id || '',
      description: dealData.description || dealData.conversation_summary || '',
      lead_source: dealData.lead_source || 'AI Chatbot',
      lead_source_detail: dealData.lead_source_detail || 'Website Chat Conversation'
    };

    return await this.makeRequest('/deals', {
      method: 'POST',
      body: JSON.stringify({ properties })
    });
  }

  // Associate contact with company
  async associateContactWithCompany(contactId, companyId) {
    try {
      const associationURL = `${this.associationsURL}/companies/${companyId}/contacts/${contactId}`;

      const response = await fetch(associationURL, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 1 // Company to Contact association type
        }])
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Association failed: ${response.status}`);
      }
    } catch (error) {
      log.error('Error associating contact with company:', error);
      throw error;
    }
  }

  // Associate deal with contact
  async associateDealWithContact(dealId, contactId) {
    try {
      const associationURL = `${this.associationsURL}/deals/${dealId}/contacts/${contactId}`;

      const response = await fetch(associationURL, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 3 // Deal to Contact association type
        }])
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Association failed: ${response.status}`);
      }
    } catch (error) {
      log.error('Error associating deal with contact:', error);
      throw error;
    }
  }

  // Batch operations for efficiency
  async batchCreateContacts(contacts) {
    const inputs = contacts.map(contact => ({
      properties: {
        email: contact.email,
        firstname: contact.firstname || contact.name?.split(' ')[0] || '',
        lastname: contact.lastname || contact.name?.split(' ').slice(1).join(' ') || '',
        company: contact.company || '',
        phone: contact.phone || '',
        lifecyclestage: 'lead',
        lead_source: 'AI Chatbot'
      }
    }));

    return await this.makeRequest('/contacts/batch/create', {
      method: 'POST',
      body: JSON.stringify({ inputs })
    });
  }
}

// Singleton instance
let hubSpotClientInstance = null;

function getHubSpotClient() {
  if (!hubSpotClientInstance) {
    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is required');
    }
    hubSpotClientInstance = new HubSpotClient(accessToken);
  }
  return hubSpotClientInstance;
}

// Main lead capture function with enhanced logic
export async function captureLeadToHubSpot(leadData) {
  const requestId = uuidv4();
  log.info(`[${requestId}] Starting lead capture for:`, leadData.email);

  try {
    // Validate required environment variables first
    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is not configured');
    }

    const client = getHubSpotClient();

    // Validate token before proceeding
    const tokenValid = await client.validateToken();
    if (!tokenValid) {
      log.error(`[${requestId}] HubSpot token validation failed, skipping lead capture`);
      throw new Error('HubSpot authentication failed: Token validation failed');
    }

    // Parse name components
    const nameParts = (leadData.name || '').split(' ');
    const firstname = nameParts[0] || '';
    const lastname = nameParts.slice(1).join(' ') || '';

    // Prepare contact data
    const contactData = {
      email: leadData.email,
      firstname,
      lastname,
      company: leadData.company || '',
      phone: leadData.phone || '',
      industry: leadData.industry || '',
      requirements: leadData.requirements || '',
      budget: leadData.budget || '',
      timeline: leadData.timeline || '',
      company_size: leadData.company_size || '',
      current_challenges: leadData.current_challenges || '',
      conversation_summary: leadData.conversation_summary || '',
      lead_score: leadData.lead_score || 0,
      message: `Requirements: ${leadData.requirements || 'N/A'} | Budget: ${leadData.budget || 'N/A'} | Timeline: ${leadData.timeline || 'N/A'}`,
      lead_source: 'AI Chatbot',
      lead_source_detail: 'Intelligent Lead Capture',
      lifecyclestage: 'lead'
    };

    // Create or update contact
    const contact = await client.createOrUpdateContact(contactData);
    log.info(`[${requestId}] Contact created/updated:`, contact.id);

    // Create company if provided and different from contact's company
    if (leadData.company && leadData.company.length > 2) {
      try {
        const companyData = {
          name: leadData.company,
          domain: extractDomainFromCompany(leadData.company),
          industry: leadData.industry || '',
          size: leadData.company_size || ''
        };

        const company = await client.createCompany(companyData);
        log.info(`[${requestId}] Company created:`, company.id);

        // Associate contact with company
        await client.associateContactWithCompany(contact.id, company.id);
        log.info(`[${requestId}] Contact associated with company`);

        // Create deal if qualified lead
        if (leadData.lead_score >= 50) {
          const dealData = {
            dealname: `AI Automation Opportunity - ${leadData.company}`,
            amount: extractAmountFromBudget(leadData.budget),
            description: leadData.conversation_summary || `Lead interested in AI automation solutions. Requirements: ${leadData.requirements}`,
            conversation_summary: leadData.conversation_summary
          };

          const deal = await client.createDeal(dealData);
          log.info(`[${requestId}] Deal created:`, deal.id);

          // Associate deal with contact
          await client.associateDealWithContact(deal.id, contact.id);
          log.info(`[${requestId}] Deal associated with contact`);
        }

      } catch (companyError) {
        log.warn(`[${requestId}] Company creation failed (continuing with contact only):`, companyError.message);
      }
    }

    // Cache lead data for analytics
    await cacheLeadData(requestId, leadData, contact.id);

    log.info(`[${requestId}] Lead capture completed successfully`);
    return `✅ Thanks ${leadData.name || leadData.email}! I've captured your information and Aparna will follow up within 24 hours.`;

  } catch (error) {
    log.error(`[${requestId}] Lead capture failed:`, error);

    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('Authentication') || error.message.includes('UNAUTHORIZED')) {
      log.error(`[${requestId}] HubSpot authentication failed. Check your HUBSPOT_ACCESS_TOKEN.`);
    }

    // Fallback: Store locally for later processing
    try {
      await redis.setex(`failed_lead:${requestId}`, 7 * 24 * 60 * 60, JSON.stringify({
        ...leadData,
        error: error.message,
        timestamp: new Date().toISOString(),
        hubspotAuthError: error.message.includes('401') || error.message.includes('Authentication')
      }));

      log.info(`[${requestId}] Failed lead cached for retry`);
      return `✅ Thanks ${leadData.name || leadData.email}! I've captured your information and will follow up soon.`;
    } catch (redisError) {
      log.error(`[${requestId}] Critical: Failed to cache lead locally:`, redisError);
      return `Thank you for your information! I've noted your details and will be in touch soon.`;
    }
  }
}

// Helper functions
function extractDomainFromCompany(companyName) {
  if (!companyName) return '';

  // Simple domain extraction - could be enhanced
  const cleanName = companyName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '');

  return `${cleanName}.com`;
}

function extractAmountFromBudget(budget) {
  if (!budget) return '';

  // Extract numeric value from budget string
  const numbers = budget.match(/\d+/g);
  if (!numbers) return '';

  const amount = parseInt(numbers[0]);

  // Determine if it's in thousands
  if (budget.toLowerCase().includes('k')) {
    return (amount * 1000).toString();
  }

  return amount.toString();
}

// Cache lead data for analytics and follow-up
async function cacheLeadData(requestId, leadData, contactId) {
  try {
    const cacheKey = `lead:${requestId}`;
    const analyticsKey = `lead_analytics:${new Date().toISOString().split('T')[0]}`;

    await Promise.all([
      // Detailed lead data
      redis.setex(cacheKey, 30 * 24 * 60 * 60, JSON.stringify({
        ...leadData,
        contactId,
        requestId,
        capturedAt: new Date().toISOString()
      })),

      // Daily analytics
      redis.hincrby(analyticsKey, 'total_leads', 1),
      redis.hincrby(analyticsKey, 'qualified_leads', leadData.lead_score >= 50 ? 1 : 0),
      redis.expire(analyticsKey, 30 * 24 * 60 * 60) // 30 days
    ]);
  } catch (error) {
    log.warn('Failed to cache lead data:', error);
    // Continue without caching - won't break the flow
  }
}

// Export the singleton client for external use
export { getHubSpotClient };