/**
 * HubSpot Service - Direct HubSpot API integration for lead management
 * Replaces all database functionality with HubSpot CRM integration
 */

import { Client } from '@hubspot/api-client';

const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
});

const LEAD_SCORE_THRESHOLDS = {
  BUDGET: {
    'under-5k': 10,
    '5k-10k': 20,
    '10k-25k': 30,
    '25k-50k': 40,
    '50k+': 50,
    '100k+': 60
  },
  TIMELINE: {
    'asap': 30,
    'within-1-month': 25,
    'within-3-months': 20,
    'within-6-months': 15,
    'flexible': 10
  },
  PROJECT_TYPE: {
    'ai-saas': 25,
    'web-app': 20,
    'mobile-app': 20,
    'consulting': 15,
    'other': 10
  }
};

/**
 * Calculate lead score based on prospect data
 */
function calculateLeadScore(leadData) {
  let score = 0;
  
  // Budget score
  if (leadData.budget && LEAD_SCORE_THRESHOLDS.BUDGET[leadData.budget]) {
    score += LEAD_SCORE_THRESHOLDS.BUDGET[leadData.budget];
  }
  
  // Timeline score
  if (leadData.timeline && LEAD_SCORE_THRESHOLDS.TIMELINE[leadData.timeline]) {
    score += LEAD_SCORE_THRESHOLDS.TIMELINE[leadData.timeline];
  }
  
  // Project type score
  if (leadData.project_type && LEAD_SCORE_THRESHOLDS.PROJECT_TYPE[leadData.project_type]) {
    score += LEAD_SCORE_THRESHOLDS.PROJECT_TYPE[leadData.project_type];
  }
  
  // Contact completeness bonus
  if (leadData.phone) score += 10;
  if (leadData.company) score += 15;
  if (leadData.notes && leadData.notes.length > 50) score += 10;
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Check if contact exists in HubSpot by email
 */
export async function contactExists(email) {
  try {
    const response = await hubspotClient.crm.contacts.basicApi.getById(
      email,
      ['email'],
      undefined,
      undefined,
      false,
      'email'
    );
    return response;
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Search for contact by email
 */
export async function findContactByEmail(email) {
  console.log('🔍 [HUBSPOT] Searching for contact by email:', email?.substring(0, 10) + '...');
  
  try {
    const searchRequest = {
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: email
        }]
      }],
      properties: ['email', 'firstname', 'lastname', 'company', 'phone', 'notes'],
      limit: 1
    };
    
    const response = await hubspotClient.crm.contacts.searchApi.doSearch(searchRequest);
    const found = response.results?.[0] || null;
    console.log('🔍 [HUBSPOT] Search result:', {
      found: !!found,
      contactId: found?.id || 'none'
    });
    return found;
  } catch (error) {
    console.error('❌ [HUBSPOT] Search failed:', {
      error: error.message,
      statusCode: error.statusCode
    });
    return null;
  }
}

/**
 * Create new contact in HubSpot
 */
export async function createContact(leadData) {
  console.log('🔵 [HUBSPOT] Creating new contact:', {
    email: leadData.email,
    name: leadData.name,
    hasCompany: !!leadData.company,
    hasPhone: !!leadData.phone
  });
  
  const leadScore = calculateLeadScore(leadData);
  console.log('📊 [HUBSPOT] Calculated lead score:', leadScore);
  
  const contactProperties = {
    email: leadData.email,
    firstname: leadData.name?.split(' ')[0] || '',
    lastname: leadData.name?.split(' ').slice(1).join(' ') || '',
    company: leadData.company,
    phone: leadData.phone,
    notes: leadData.notes,
    lead_source__c: 'AI Chatbot',
    project_type__c: leadData.project_type,
    budget_range__c: leadData.budget,
    timeline__c: leadData.timeline,
    lead_score__c: leadScore,
    confidence_score__c: leadData.confidence || 0,
    last_chat_session__c: new Date().toISOString(),
    status__c: leadScore >= 60 ? 'qualified' : 'new'
  };

  console.log('📤 [HUBSPOT] Sending create request with properties:', contactProperties);
  
  try {
    const response = await hubspotClient.crm.contacts.basicApi.create({
      properties: contactProperties
    });
    
    console.log('✅ [HUBSPOT] Contact created successfully:', {
      id: response.id,
      email: response.properties.email,
      score: leadScore,
      qualified: leadScore >= 60
    });
    
    return {
      id: response.id,
      email: response.properties.email,
      name: `${response.properties.firstname} ${response.properties.lastname}`.trim(),
      leadScore,
      isQualified: leadScore >= 60,
      hubspotData: response
    };
  } catch (error) {
    console.error('❌ [HUBSPOT] Create contact failed:', {
      error: error.message,
      statusCode: error.statusCode,
      category: error.category,
      context: error.context
    });
    throw new Error(`Failed to create HubSpot contact: ${error.message}`);
  }
}

/**
 * Update existing contact in HubSpot
 */
export async function updateContact(contactId, leadData) {
  const leadScore = calculateLeadScore(leadData);
  
  const updateProperties = {
    firstname: leadData.name?.split(' ')[0],
    lastname: leadData.name?.split(' ').slice(1).join(' '),
    company: leadData.company,
    phone: leadData.phone,
    notes: leadData.notes,
    project_type__c: leadData.project_type,
    budget_range__c: leadData.budget,
    timeline__c: leadData.timeline,
    lead_score__c: leadScore,
    confidence_score__c: leadData.confidence || 0,
    last_chat_session__c: new Date().toISOString(),
    status__c: leadScore >= 60 ? 'qualified' : 'new'
  };

  // Remove undefined values
  Object.keys(updateProperties).forEach(key => {
    if (updateProperties[key] === undefined) {
      delete updateProperties[key];
    }
  });

  try {
    const response = await hubspotClient.crm.contacts.basicApi.update(contactId, {
      properties: updateProperties
    });
    
    console.log('✅ Contact updated in HubSpot:', contactId);
    
    return {
      id: response.id,
      leadScore,
      isQualified: leadScore >= 60,
      hubspotData: response
    };
  } catch (error) {
    console.error('❌ Error updating contact:', error);
    throw new Error(`Failed to update HubSpot contact: ${error.message}`);
  }
}

/**
 * Create or update contact (upsert)
 */
export async function upsertContact(leadData) {
  console.log('🔄 [HUBSPOT] Starting upsert operation for:', {
    email: leadData.email,
    name: leadData.name,
    source: leadData.source || 'unknown'
  });
  
  try {
    // First, try to find existing contact
    const existingContact = await findContactByEmail(leadData.email);
    
    if (existingContact) {
      console.log('🔄 [HUBSPOT] Found existing contact, updating...', existingContact.id);
      return await updateContact(existingContact.id, leadData);
    } else {
      console.log('➕ [HUBSPOT] No existing contact found, creating new...');
      return await createContact(leadData);
    }
  } catch (error) {
    console.error('❌ [HUBSPOT] Upsert operation failed:', {
      error: error.message,
      email: leadData.email,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Get all contacts (for debugging/admin)
 */
export async function getAllContacts(limit = 100) {
  try {
    const response = await hubspotClient.crm.contacts.basicApi.getPage(limit);
    return response.results;
  } catch (error) {
    console.error('❌ Error getting contacts:', error);
    throw new Error(`Failed to get contacts: ${error.message}`);
  }
}

/**
 * Get contact by ID
 */
export async function getContactById(contactId) {
  try {
    const response = await hubspotClient.crm.contacts.basicApi.getById(
      contactId,
      ['email', 'firstname', 'lastname', 'company', 'phone', 'lead_score__c', 'status__c']
    );
    return response;
  } catch (error) {
    console.error('❌ Error getting contact:', error);
    throw new Error(`Failed to get contact: ${error.message}`);
  }
}

export default {
  createContact,
  updateContact,
  upsertContact,
  findContactByEmail,
  contactExists,
  getAllContacts,
  getContactById,
  calculateLeadScore
};