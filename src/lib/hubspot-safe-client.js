/**
 * HubSpot Client with Fallback Properties
 *
 * This client handles HubSpot properties that may not exist
 * by gracefully falling back to available standard properties.
 */

import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

const redis = Redis.fromEnv();
const log = {
  info: (...args) => console.log("[HUBSPOT_SAFE]", ...args),
  warn: (...args) => console.warn("[HUBSPOT_SAFE]", ...args),
  error: (...args) => console.error("[HUBSPOT_SAFE]", ...args),
};

class HubSpotSafeClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = "https://api.hubapi.com/crm/v3/objects";
    this.associationsURL = "https://api.hubapi.com/crm/v4/associations";
  }

  // Validate access token
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

  // Generic API request method with error handling
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
          const text = await response.text();
          return text ? JSON.parse(text) : { success: true };
        }

        // Handle authentication errors
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

  // Map custom properties to standard HubSpot properties
  mapProperties(contactData) {
    const mapped = {};

    // Standard HubSpot properties
    const standardProperties = {
      email: contactData.email,
      firstname: contactData.firstname || contactData.name?.split(' ')[0] || '',
      lastname: contactData.lastname || contactData.name?.split(' ').slice(1).join(' ') || '',
      company: contactData.company || '',
      phone: contactData.phone || '',
      jobtitle: contactData.jobtitle || '',
      website: contactData.website || '',
      description: contactData.conversation_summary || contactData.message || '',
      notes: contactData.requirements || '',
      industry: contactData.industry || '',
      address: contactData.address || '',
      city: contactData.city || '',
      state: contactData.state || '',
      zip: contactData.zip || '',
      country: contactData.country || '',
      lifecyclestage: contactData.lifecyclestage || 'lead',
      hs_lead_status: contactData.hs_lead_status || 'NEW'
    };

    // Map standard properties
    for (const [key, value] of Object.entries(standardProperties)) {
      if (value) {
        mapped[key] = value;
      }
    }

    // Handle custom properties - store in notes or description if they exist
    const customProperties = {
      budget: contactData.budget,
      timeline: contactData.timeline,
      company_size: contactData.company_size,
      current_challenges: contactData.current_challenges,
      requirements: contactData.requirements,
      lead_source: contactData.lead_source || 'AI Chatbot',
      lead_source_detail: contactData.lead_source_detail || 'Website Chat',
      lead_score: contactData.lead_score,
      conversation_summary: contactData.conversation_summary
    };

    // Add custom properties to description if they exist
    const customProps = Object.entries(customProperties)
      .filter(([key, value]) => value && value.toString().trim())
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

    if (customProps && mapped.description) {
      mapped.description += `\n\nAdditional Information:\n${customProps}`;
    } else if (customProps) {
      mapped.description = `Additional Information:\n${customProps}`;
    }

    return mapped;
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
    try {
      const properties = this.mapProperties(contactData);

      log.info('Creating new contact with mapped properties:', {
        email: properties.email,
        name: `${properties.firstname} ${properties.lastname}`,
        company: properties.company
      });

      const response = await this.makeRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify({ properties })
      });

      log.info('Contact created successfully:', response.id);
      return response;
    } catch (error) {
      log.error('Error creating contact:', error);
      throw error;
    }
  }

  // Update an existing contact
  async updateContact(contactId, contactData) {
    try {
      const properties = this.mapProperties(contactData);

      // Only update properties that have values
      const updateProperties = Object.fromEntries(
        Object.entries(properties).filter(([key, value]) => value)
      );

      log.info('Updating contact:', contactId, 'with properties:', Object.keys(updateProperties));

      const response = await this.makeRequest(`/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties: updateProperties })
      });

      log.info('Contact updated successfully:', contactId);
      return response;
    } catch (error) {
      log.error('Error updating contact:', error);
      throw error;
    }
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

  // Create a company
  async createCompany(companyData) {
    try {
      const properties = {
        name: companyData.name || '',
        domain: this.extractDomainFromCompany(companyData.name),
        description: companyData.description || '',
        industry: companyData.industry || '',
        numberofemployees: companyData.company_size || '',
        phone: companyData.phone || '',
        website: companyData.website || '',
        lifecyclestage: 'lead'
      };

      log.info('Creating company:', companyData.name);

      const response = await this.makeRequest('/companies', {
        method: 'POST',
        body: JSON.stringify({ properties })
      });

      log.info('Company created successfully:', response.id);
      return response;
    } catch (error) {
      log.error('Error creating company:', error);
      throw error;
    }
  }

  // Create a deal
  async createDeal(dealData) {
    try {
      const properties = {
        dealname: dealData.dealname || `New Opportunity - ${dealData.company || 'Unknown Company'}`,
        amount: dealData.amount || '',
        closedate: dealData.closedate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        pipeline: dealData.pipeline || 'default',
        dealstage: dealData.dealstage || 'appointmentscheduled',
        description: dealData.description || '',
        source: dealData.lead_source || 'AI Chatbot'
      };

      log.info('Creating deal:', properties.dealname);

      const response = await this.makeRequest('/deals', {
        method: 'POST',
        body: JSON.stringify({ properties })
      });

      log.info('Deal created successfully:', response.id);
      return response;
    } catch (error) {
      log.error('Error creating deal:', error);
      throw error;
    }
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
        log.info(`Contact ${contactId} associated with company ${companyId}`);
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
        log.info(`Deal ${dealId} associated with contact ${contactId}`);
        return await response.json();
      } else {
        throw new Error(`Association failed: ${response.status}`);
      }
    } catch (error) {
      log.error('Error associating deal with contact:', error);
      throw error;
    }
  }

  // Helper function to extract domain from company name
  extractDomainFromCompany(companyName) {
    if (!companyName) return '';

    // Simple domain extraction
    const cleanName = companyName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '');

    return `${cleanName}.com`;
  }

  // Main lead capture function with safe property mapping
  async captureLeadToHubSpotSafe(leadData) {
    const requestId = uuidv4();
    log.info(`[${requestId}] Starting SAFE lead capture for:`, leadData.email);

    try {
      // Validate required environment variables first
      const accessToken = this.accessToken;
      if (!accessToken) {
        throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is required');
      }

      // Validate token before proceeding
      const tokenValid = await this.validateToken();
      if (!tokenValid) {
        log.error(`[${requestId}] HubSpot token validation failed, skipping lead capture`);
        throw new Error('HubSpot authentication failed: Token validation failed');
      }

      // Create or update contact
      const contact = await this.createOrUpdateContact(leadData);
      log.info(`[${requestId}] Contact created/updated:`, contact.id);

      // Create company if provided and different from contact's company
      if (leadData.company && leadData.company.length > 2) {
        try {
          const companyData = {
            name: leadData.company,
            industry: leadData.industry || '',
            size: leadData.company_size || ''
          };

          const company = await this.createCompany(companyData);
          log.info(`[${requestId}] Company created:`, company.id);

          // Associate contact with company
          await this.associateContactWithCompany(contact.id, company.id);
          log.info(`[${requestId}] Contact associated with company`);

          // Create deal if qualified lead
          if (leadData.lead_score >= 50) {
            const dealData = {
              dealname: `AI Automation Opportunity - ${leadData.company}`,
              amount: this.extractAmountFromBudget(leadData.budget),
              description: leadData.conversation_summary || `Lead interested in AI automation solutions. Requirements: ${leadData.requirements}`,
              lead_source: 'AI Chatbot'
            };

            const deal = await this.createDeal(dealData);
            log.info(`[${requestId}] Deal created:`, deal.id);

            // Associate deal with contact
            await this.associateDealWithContact(deal.id, contact.id);
            log.info(`[${requestId}] Deal associated with contact`);
          }

        } catch (companyError) {
          log.warn(`[${requestId}] Company creation failed (continuing with contact only):`, companyError.message);
        }
      }

      // Cache lead data for analytics
      await this.cacheLeadData(requestId, leadData, contact.id);

      log.info(`[${requestId}] SAFE lead capture completed successfully`);
      return `✅ Thanks ${leadData.name || leadData.email}! I've captured your information and Aparna will follow up within 24 hours.`;

    } catch (error) {
      log.error(`[${requestId}] SAFE lead capture failed:`, error);

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

  // Helper function to extract amount from budget string
  extractAmountFromBudget(budget) {
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
  async cacheLeadData(requestId, leadData, contactId) {
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
      // Continue without caching - won't break flow
    }
  }
}

// Singleton instance
let hubSpotSafeClientInstance = null;

function getHubSpotSafeClient() {
  if (!hubSpotSafeClientInstance) {
    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is required');
    }
    hubSpotSafeClientInstance = new HubSpotSafeClient(accessToken);
  }
  return hubSpotSafeClientInstance;
}

// Main lead capture function with enhanced logic
export async function captureLeadToHubSpotSafe(leadData) {
  const client = getHubSpotSafeClient();
  return await client.captureLeadToHubSpotSafe(leadData);
}

// Export singleton client for external use
export { getHubSpotSafeClient };