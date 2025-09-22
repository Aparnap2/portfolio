// src/lib/lead-capture.js
// Decoupled lead capture service - always stores locally, queues external syncs

import { upsertContact } from './hubspot-service.js';
import { sendLeadNotification } from './discord-service.js';
import { queueHubSpotSync, queueDiscordNotification } from './rabbitmq.js';
import { flexibleLeadParse } from './flexible-lead-parser.js';
import { v4 as uuidv4 } from 'uuid';

const CONFIG = {
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
  
  console.log(`🎯 [LEAD CAPTURE] Starting capture ${captureId}:`, {
    email: leadData.email ? leadData.email.substring(0, 10) + '...' : 'none',
    name: leadData.name || 'none',
    phone: leadData.phone ? 'yes' : 'no',
    company: leadData.company || 'none',
    source: leadData.source || 'unknown',
    sessionId: sessionId || 'none'
  });

  try {
    console.log(`📊 [LEAD CAPTURE] ${captureId} - Validating lead data...`);
    if (!leadData.email || !leadData.name) {
      throw new Error('Missing required fields: email and name are mandatory');
    }
    
    // Step 1: Store lead directly in HubSpot
    console.log(`💾 [LEAD CAPTURE] ${captureId} - Storing in HubSpot...`);
    const hubspotResult = await storeLeadInHubSpot(leadData, captureId);
    
    // Step 2: Queue external syncs asynchronously (failures here don't affect capture)
    console.log(`📤 [LEAD CAPTURE] ${captureId} - Queuing external syncs...`);
    await queueExternalSyncs(hubspotResult, captureId);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ [LEAD CAPTURE] ${captureId} completed successfully:`, {
      processingTime: `${processingTime}ms`,
      leadId: hubspotResult.id,
      qualified: hubspotResult.isQualified,
      score: hubspotResult.leadScore
    });
    
    return {
      success: true,
      leadId: hubspotResult.id,
      captureId,
      message: `Thanks ${leadData.name}! I've captured your information and will follow up within 24 hours.`,
      processingTime: Date.now() - startTime,
      qualified: hubspotResult.isQualified
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [LEAD CAPTURE] ${captureId} failed:`, {
      error: error.message,
      processingTime: `${processingTime}ms`,
      email: leadData.email,
      stack: error.stack?.split('\n')[0]
    });
    
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
 * Store lead directly in HubSpot (replaces local database storage)
 */
async function storeLeadInHubSpot(leadData, captureId) {
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

  try {
    // Use HubSpot upsert (create or update)
    const hubspotResult = await upsertContact({
      email,
      firstname: name.split(' ')[0],
      lastname: name.split(' ').slice(1).join(' '),
      company,
      phone,
      project_type,
      budget,
      timeline,
      notes,
      source,
      capture_id: captureId
    });

    console.log(`✅ Lead stored in HubSpot:`, hubspotResult.id);
    
    return {
      id: hubspotResult.id,
      email,
      name,
      company,
      phone,
      project_type,
      budget,
      timeline,
      notes,
      source,
      isQualified: hubspotResult.isQualified,
      leadScore: hubspotResult.leadScore,
      hubspotData: hubspotResult.hubspotData,
      storedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error storing lead in HubSpot:', error);
    throw error;
  }
}

/**
 * Queue external syncs (Discord notifications via RabbitMQ)
 */
async function queueExternalSyncs(lead, captureId) {
  const promises = [];

  // Queue Discord notification if enabled
  if (CONFIG.enableDiscordNotifications) {
    promises.push(
      queueDiscordNotification({
        type: 'new_lead',
        lead,
        capture_id: captureId,
        priority: lead.isQualified ? 'high' : 'normal'
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
 * Extract lead information using flexible parsing (recommended)
 */
export function extractLeadInfoFlexible(input, context = {}) {
  try {
    // Use the flexible parser for maximum compatibility
    const result = flexibleLeadParse(input, context);
    
    if (result) {
      console.log('🔍 Flexible parser extracted:', {
        email: result.email ? '✓' : '✗',
        name: result.name ? '✓' : '✗',
        phone: result.phone ? '✓' : '✗',
        company: result.company ? '✓' : '✗',
        confidence: result.confidence || 'N/A'
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Flexible lead parsing failed:', error);
    return null;
  }
}

/**
 * Extract lead information from message and context with flexible parsing (legacy)
 */
export function extractLeadInfo(message, history = []) {
  // Combine current message with recent history for context
  const allContent = [message, ...history.slice(-3).map(h => h.content || '')].join(' ');
  
  const extracted = {
    email: null,
    name: null,
    phone: null,
    company: null,
    project_type: null,
    budget: null,
    timeline: null,
    notes: null
  };

  // Enhanced email extraction - multiple patterns
  const emailPatterns = [
    /(?:mailto:)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    /(?:email|e-mail|contact)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
  ];

  for (const pattern of emailPatterns) {
    const matches = allContent.match(pattern);
    if (matches) {
      // Extract just the email part, removing any prefixes
      const emailMatch = matches[0].match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        extracted.email = emailMatch[1].toLowerCase();
        break;
      }
    }
  }

  // Enhanced name extraction - multiple patterns and fallbacks
  const namePatterns = [
    /(?:i'm|i am|my name is|name is|call me|this is)\s+([a-zA-Z\s]{2,40})/gi,
    /(?:name|called)[\s:]+([a-zA-Z\s]{2,40})/gi,
    /hi,?\s+(?:i'm\s+)?([a-zA-Z\s]{2,40})/gi,
    /hello,?\s+(?:i'm\s+)?([a-zA-Z\s]{2,40})/gi
  ];

  for (const pattern of namePatterns) {
    const match = allContent.match(pattern);
    if (match && match[1]) {
      let name = match[1].trim();
      // Clean up common artifacts
      name = name.replace(/\b(here|there|and|with|from|at|the|a|an)\b.*$/gi, '').trim();
      if (name.length >= 2 && name.length <= 40 && /^[a-zA-Z\s]+$/.test(name)) {
        extracted.name = name;
        break;
      }
    }
  }

  // Fallback: Look for standalone names (2-3 words, all letters)
  if (!extracted.name) {
    const words = message.split(/\s+/).filter(w => /^[a-zA-Z]+$/.test(w) && w.length > 1);
    if (words.length >= 2 && words.length <= 3) {
      const potentialName = words.join(' ');
      // Avoid common false positives
      const commonWords = ['hello', 'thanks', 'please', 'would', 'could', 'should', 'about', 'project'];
      if (!commonWords.some(word => potentialName.toLowerCase().includes(word))) {
        extracted.name = potentialName;
      }
    }
  }

  // Enhanced phone extraction
  const phonePatterns = [
    /(?:phone|call|mobile|cell|number)[\s:]*(\+?[\d\s\-\(\)\.]{10,})/gi,
    /(?:reach me at|contact me at)[\s:]*(\+?[\d\s\-\(\)\.]{10,})/gi,
    /(\+?1?[\s\-\.]?\(?[0-9]{3}\)?[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4})/g,
    /(\+?[0-9]{1,3}[\s\-\.]?[0-9]{3,4}[\s\-\.]?[0-9]{3,4}[\s\-\.]?[0-9]{3,4})/g
  ];

  for (const pattern of phonePatterns) {
    const match = allContent.match(pattern);
    if (match && match[1]) {
      let phone = match[1].replace(/[^\d+]/g, '');
      if (phone.length >= 10) {
        extracted.phone = phone;
        break;
      }
    }
  }

  // Enhanced company extraction
  const companyPatterns = [
    /(?:company|work at|employed by|from|at)\s+([a-zA-Z\s&.,\-]{2,50})/gi,
    /(?:i work for|working for|employed at)\s+([a-zA-Z\s&.,\-]{2,50})/gi,
    /(?:represent|representing)\s+([a-zA-Z\s&.,\-]{2,50})/gi
  ];

  for (const pattern of companyPatterns) {
    const match = allContent.match(pattern);
    if (match && match[1]) {
      let company = match[1].trim();
      // Clean up common artifacts
      company = company.replace(/\b(and|with|in|on|the|a|an|is|are|was|were)\b.*$/gi, '').trim();
      if (company.length >= 2 && company.length <= 50) {
        extracted.company = company;
        break;
      }
    }
  }

  // Project type extraction
  const projectPatterns = [
    /(?:project|website|app|application|system|platform|solution)[\s:]*([a-zA-Z\s]{3,30})/gi,
    /(?:need|want|looking for|interested in)[\s:]*(?:a|an)?\s*([a-zA-Z\s]{3,30})(?:\s+(?:website|app|system|platform|solution))/gi,
    /(?:build|create|develop|design)[\s:]*(?:a|an)?\s*([a-zA-Z\s]{3,30})/gi
  ];

  for (const pattern of projectPatterns) {
    const match = allContent.match(pattern);
    if (match && match[1]) {
      let projectType = match[1].trim();
      if (projectType.length >= 3 && projectType.length <= 30) {
        extracted.project_type = projectType;
        break;
      }
    }
  }

  // Budget extraction
  const budgetPatterns = [
    /(?:budget|cost|price|spend)[\s:]*(?:is|around|about)?\s*\$?([0-9,]+(?:\.[0-9]{2})?)/gi,
    /(?:budget|cost|price)[\s:]*(?:range|between)?\s*\$?([0-9,]+)\s*(?:to|-)\s*\$?([0-9,]+)/gi,
    /\$([0-9,]+(?:\.[0-9]{2})?)/g
  ];

  for (const pattern of budgetPatterns) {
    const match = allContent.match(pattern);
    if (match && match[1]) {
      extracted.budget = match[1];
      break;
    }
  }

  // Timeline extraction
  const timelinePatterns = [
    /(?:timeline|deadline|by|need it|complete)[\s:]*(?:by|in|within)?\s*([a-zA-Z0-9\s]{3,20})/gi,
    /(?:asap|urgent|rush|quickly|soon)/gi,
    /(?:weeks?|months?|days?)[\s:]*([0-9]+)/gi
  ];

  for (const pattern of timelinePatterns) {
    const match = allContent.match(pattern);
    if (match) {
      let timeline = (match[1] && match[1].trim()) || match[0];
      if (timeline && timeline.length >= 3 && timeline.length <= 20) {
        extracted.timeline = timeline.trim();
        break;
      }
    }
  }

  // Extract notes from context (anything that seems like additional info)
  const contextualInfo = [];
  
  // Look for sentences that contain project details
  const sentences = allContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes('need') || 
        sentence.toLowerCase().includes('want') || 
        sentence.toLowerCase().includes('looking') ||
        sentence.toLowerCase().includes('project') ||
        sentence.toLowerCase().includes('help')) {
      contextualInfo.push(sentence.trim());
    }
  }

  if (contextualInfo.length > 0) {
    extracted.notes = contextualInfo.join('. ').substring(0, 500);
  }

  // Clean up extracted data
  Object.keys(extracted).forEach(key => {
    if (extracted[key] && typeof extracted[key] === 'string') {
      extracted[key] = extracted[key].trim();
      if (extracted[key] === '') extracted[key] = null;
    }
  });

  // Return lead info if we have at least email OR (name and some other info)
  const hasMinimumInfo = extracted.email || 
    (extracted.name && (extracted.phone || extracted.company || extracted.project_type));

  if (hasMinimumInfo) {
    // If we have email but no name, try to extract name from email
    if (extracted.email && !extracted.name) {
      const emailName = extracted.email.split('@')[0];
      if (emailName.includes('.')) {
        const parts = emailName.split('.');
        extracted.name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      } else if (emailName.length > 2) {
        extracted.name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
    }

    // Filter out null values
    const result = {};
    Object.keys(extracted).forEach(key => {
      if (extracted[key] !== null) {
        result[key] = extracted[key];
      }
    });

    return result;
  }

  return null;
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

  // First try flexible parsing
  const context = {
    previousMessages: history.slice(-3).map(h => h.content || ''),
    metadata
  };
  
  const extractedLead = extractLeadInfoFlexible(message, context);
  if (extractedLead) {
    return { should_capture: true, lead_info: extractedLead };
  }

  // Fallback to legacy extraction
  const legacyExtracted = extractLeadInfo(message, history);
  if (legacyExtracted) {
    return { should_capture: true, lead_info: legacyExtracted };
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
  extractLeadInfoFlexible,
  shouldCaptureLead,
  generateLeadCapturePrompt,
  healthCheck
};