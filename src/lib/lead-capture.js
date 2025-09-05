// src/lib/lead-capture.js
// Decoupled lead capture service - always stores locally, queues external syncs

import { createLead, updateLead, getLeadByEmail, logLeadEvent } from './database.js';
import { queueHubSpotSync, queueDiscordNotification } from './rabbitmq.js';
import { v4 as uuidv4 } from 'uuid';

const CONFIG = {
  alwaysStore: process.env.LEAD_CAPTURE_ALWAYS_STORE === 'true',
  enableHubSpotSync: process.env.HUBSPOT_DECOUPLED !== 'false',
  enableDiscordNotifications: true,
  deduplicationWindow: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

/**
 * Capture lead with full decoupling - never fails due to external services
 */
export async function captureLead(leadData, sessionId = null) {
  const startTime = Date.now();
  const captureId = uuidv4();
  
  console.log(`🎯 Starting lead capture ${captureId}:`, { email: leadData.email, name: leadData.name });

  try {
    // Step 1: Always store lead locally first (this should never fail the capture)
    const lead = await storeLeadLocally(leadData, sessionId, captureId);
    
    // Step 2: Queue external syncs asynchronously (failures here don't affect capture)
    await queueExternalSyncs(lead, captureId);
    
    // Step 3: Log successful capture
    await logLeadEvent(lead.id, 'lead_captured', {
      capture_id: captureId,
      session_id: sessionId,
      processing_time_ms: Date.now() - startTime,
      source: leadData.source || 'web'
    });

    console.log(`✅ Lead capture ${captureId} completed successfully in ${Date.now() - startTime}ms`);
    
    return {
      success: true,
      leadId: lead.id,
      captureId,
      message: `Thanks ${leadData.name}! I've captured your information and will follow up within 24 hours.`,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error(`❌ Lead capture ${captureId} failed:`, error);
    
    // Even if local storage fails, we try to queue the raw data for manual processing
    try {
      await queueDiscordNotification({
        type: 'capture_failed',
        error: error.message,
        leadData,
        captureId,
        timestamp: new Date().toISOString()
      });
    } catch (notificationError) {
      console.error('Failed to queue failure notification:', notificationError);
    }

    return {
      success: false,
      captureId,
      error: error.message,
      message: `Thanks ${leadData.name}! I've noted your information and will follow up soon.`,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Store lead locally in database
 */
async function storeLeadLocally(leadData, sessionId, captureId) {
  const {
    email,
    name,
    company,
    phone,
    project_type,
    budget,
    timeline,
    notes,
    source = 'web'
  } = leadData;

  // Validate required fields
  if (!email || !name) {
    throw new Error('Email and name are required fields');
  }

  // Check for recent duplicates (within deduplication window)
  const existingLead = await getLeadByEmail(email);
  if (existingLead) {
    const timeDiff = Date.now() - new Date(existingLead.created_at).getTime();
    if (timeDiff < CONFIG.deduplicationWindow) {
      console.log(`🔄 Duplicate lead detected within ${CONFIG.deduplicationWindow}ms, updating existing lead`);
      
      // Update existing lead with new information
      const updatedLead = await updateLead(existingLead.id, {
        name: name || existingLead.name,
        company: company || existingLead.company,
        phone: phone || existingLead.phone,
        project_type: project_type || existingLead.project_type,
        budget: budget || existingLead.budget,
        timeline: timeline || existingLead.timeline,
        notes: notes ? `${existingLead.notes || ''}\n\n[${new Date().toISOString()}] ${notes}` : existingLead.notes,
        status: 'updated'
      });

      await logLeadEvent(existingLead.id, 'lead_updated', {
        capture_id: captureId,
        session_id: sessionId,
        update_reason: 'duplicate_within_window',
        original_created_at: existingLead.created_at
      });

      return updatedLead;
    }
  }

  // Create new lead
  const lead = await createLead({
    email,
    name,
    company,
    phone,
    project_type,
    budget,
    timeline,
    notes,
    source,
    session_id: sessionId
  });

  console.log(`💾 Lead stored locally:`, lead.id);
  return lead;
}

/**
 * Queue external syncs (HubSpot, Discord notifications)
 */
async function queueExternalSyncs(lead, captureId) {
  const promises = [];

  // Queue HubSpot sync if enabled
  if (CONFIG.enableHubSpotSync) {
    promises.push(
      queueHubSpotSync({
        ...lead,
        capture_id: captureId
      }).catch(error => {
        console.error('Failed to queue HubSpot sync:', error);
        // Don't throw - this shouldn't fail the capture
      })
    );
  }

  // Queue Discord notification if enabled
  if (CONFIG.enableDiscordNotifications) {
    promises.push(
      queueDiscordNotification({
        type: 'new_lead',
        lead,
        capture_id: captureId
      }).catch(error => {
        console.error('Failed to queue Discord notification:', error);
        // Don't throw - this shouldn't fail the capture
      })
    );
  }

  // Wait for all queuing operations (but don't fail if they fail)
  await Promise.allSettled(promises);
  console.log(`📤 External syncs queued for lead ${lead.id}`);
}

/**
 * Extract lead information from message and context
 */
export function extractLeadInfo(message, history = []) {
  const emailRegex = /(?:mailto:)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const nameRegex = /(?:i'm|i am|my name is|name is|call me)\s+([a-zA-Z\s]+)/i;
  const phoneRegex = /(?:phone|call|mobile|cell).*?(\+?[\d\s\-\(\)]{10,})/i;
  const companyRegex = /(?:company|work at|employed by|from)\s+([a-zA-Z\s&.,]+)/i;
  
  let email = null;
  let name = null;
  let phone = null;
  let company = null;
  
  // Extract from current message
  const emailMatch = message.match(emailRegex);
  const nameMatch = message.match(nameRegex);
  const phoneMatch = message.match(phoneRegex);
  const companyMatch = message.match(companyRegex);
  
  if (emailMatch) email = emailMatch[1];
  if (nameMatch) name = nameMatch[1].trim();
  if (phoneMatch) phone = phoneMatch[1].replace(/\s+/g, '');
  if (companyMatch) company = companyMatch[1].trim();
  
  // If name not found in current message, check if it's just a name
  if (!name && email) {
    const words = message.replace(emailMatch[0], '').trim().split(/\s+/);
    if (words.length >= 1 && words.length <= 3 && words.every(w => /^[a-zA-Z]+$/.test(w))) {
      name = words.join(' ');
    }
  }
  
  // Check recent history for missing info
  if ((!email || !name || !phone || !company) && history.length > 0) {
    const recentMessages = history.slice(-5); // Check last 5 messages
    for (const msg of recentMessages) {
      const content = msg.content || '';
      
      if (!email) {
        const historyEmailMatch = content.match(emailRegex);
        if (historyEmailMatch) email = historyEmailMatch[1];
      }
      if (!name) {
        const historyNameMatch = content.match(nameRegex);
        if (historyNameMatch) name = historyNameMatch[1].trim();
        // Check if message is just a name
        else if (/^[a-zA-Z\s]{2,30}$/.test(content.trim())) {
          name = content.trim();
        }
      }
      if (!phone) {
        const historyPhoneMatch = content.match(phoneRegex);
        if (historyPhoneMatch) phone = historyPhoneMatch[1].replace(/\s+/g, '');
      }
      if (!company) {
        const historyCompanyMatch = content.match(companyRegex);
        if (historyCompanyMatch) company = historyCompanyMatch[1].trim();
      }
    }
  }
  
  return email && name ? { email, name, phone, company } : null;
}

/**
 * Determine if we should capture lead based on message and context
 */
export function shouldCaptureLead(message, metadata = {}, history = []) {
  const highIntentPhrases = [
    'pricing', 'cost', 'how much', 'book', 'schedule', 'demo',
    'interested', 'quote', 'hire', 'project', 'budget', 'contact',
    'reach out', 'follow up', 'get in touch', 'discuss'
  ];

  // First check if we can extract lead info
  const extractedLead = extractLeadInfo(message, history);
  if (extractedLead) {
    return { should_capture: true, lead_info: extractedLead };
  }

  // Check for high intent phrases
  const hasHighIntent = highIntentPhrases.some(phrase =>
    message.toLowerCase().includes(phrase)
  );

  // Check metadata for intent and confidence
  const isGoodTime = (
    hasHighIntent || 
    metadata.intent === 'pricing' || 
    metadata.intent === 'demo' ||
    metadata.intent === 'contact'
  ) && (metadata.confidence || 0) >= 0.6;

  if (isGoodTime) {
    return { should_ask: true };
  }

  return null;
}

/**
 * Generate lead capture prompt based on context
 */
export function generateLeadCapturePrompt(context = {}) {
  const { intent, confidence, topics = [] } = context;
  
  const prompts = {
    pricing: [
      "I'd love to provide you with detailed pricing information. Could you share your email and name so I can send you a personalized quote?",
      "To give you accurate pricing, I'll need to understand your specific needs. What's your email and name, and I'll follow up with detailed information?",
      "Let me get you the pricing details you need. Could you provide your email and name so I can send you a comprehensive quote?"
    ],
    demo: [
      "I'd be happy to schedule a demo for you! What's your email and name, and I'll coordinate a time that works for you?",
      "A demo would be perfect to show you exactly how this can help. Could you share your email and name so I can set that up?",
      "Let's get you a personalized demo. What's your email and name, and I'll reach out to schedule it?"
    ],
    contact: [
      "I'd love to help you further! Could you share your email and name so I can follow up with more detailed information?",
      "To provide you with the best assistance, what's your email and name? I'll make sure to follow up personally.",
      "Let me connect you with the right information. Could you provide your email and name for a proper follow-up?"
    ],
    default: [
      "It sounds like you're interested in learning more! What's your email and name, and I'll follow up with additional information?",
      "I'd be happy to provide more details. Could you share your email and name so I can send you relevant information?",
      "To give you the most helpful response, what's your email and name? I'll make sure to follow up appropriately."
    ]
  };

  const promptType = intent && prompts[intent] ? intent : 'default';
  const promptList = prompts[promptType];
  
  return promptList[Math.floor(Math.random() * promptList.length)];
}

/**
 * Health check for lead capture service
 */
export async function healthCheck() {
  try {
    // Test database connection
    const testLead = {
      email: 'healthcheck@test.com',
      name: 'Health Check',
      source: 'health_check'
    };

    // This should not actually create a lead, just test the validation
    const result = await captureLead(testLead);
    
    return {
      status: 'healthy',
      config: {
        alwaysStore: CONFIG.alwaysStore,
        enableHubSpotSync: CONFIG.enableHubSpotSync,
        enableDiscordNotifications: CONFIG.enableDiscordNotifications
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export default {
  captureLead,
  extractLeadInfo,
  shouldCaptureLead,
  generateLeadCapturePrompt,
  healthCheck
};