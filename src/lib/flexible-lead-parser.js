// src/lib/flexible-lead-parser.js
// Ultra-flexible lead parsing that handles LLM formatting inconsistencies

/**
 * Parse lead information from any text format with maximum flexibility
 */
export function parseLeadFromText(text, context = {}) {
  if (!text || typeof text !== 'string') return null;

  const result = {
    email: null,
    name: null,
    phone: null,
    company: null,
    project_type: null,
    budget: null,
    timeline: null,
    notes: null,
    confidence: 0
  };

  // Normalize text for parsing
  const normalizedText = text.toLowerCase().replace(/[^\w\s@.-]/g, ' ').replace(/\s+/g, ' ').trim();
  const originalText = text.trim();

  // Email extraction with multiple strategies
  result.email = extractEmail(originalText);
  if (result.email) result.confidence += 0.4;

  // Name extraction with fallbacks
  result.name = extractName(originalText, normalizedText);
  if (result.name) result.confidence += 0.3;

  // Phone extraction
  result.phone = extractPhone(originalText);
  if (result.phone) result.confidence += 0.2;

  // Company extraction
  result.company = extractCompany(originalText, normalizedText);
  if (result.company) result.confidence += 0.1;

  // Project details
  result.project_type = extractProjectType(originalText, normalizedText);
  result.budget = extractBudget(originalText);
  result.timeline = extractTimeline(originalText, normalizedText);

  // Extract contextual notes
  result.notes = extractNotes(originalText, context);

  // Clean up results
  Object.keys(result).forEach(key => {
    if (result[key] && typeof result[key] === 'string') {
      result[key] = result[key].trim();
      if (result[key] === '' || result[key].length < 2) {
        result[key] = null;
      }
    }
  });

  // Return if we have minimum viable information
  const hasMinimumInfo = result.email || 
    (result.name && (result.phone || result.company)) ||
    result.confidence >= 0.3;

  return hasMinimumInfo ? result : null;
}

/**
 * Extract email with multiple strategies
 */
function extractEmail(text) {
  const strategies = [
    // Standard email pattern
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    // Email with context
    /(?:email|e-mail|contact|reach me)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    // Malformed emails (common LLM mistakes) - more flexible
    /([a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,})/g,
    // Email in quotes or brackets
    /["'`\[\(]([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["'`\]\)]/g
  ];

  for (const strategy of strategies) {
    const matches = text.match(strategy);
    if (matches) {
      for (const match of matches) {
        // Clean up the email - handle spaced emails
        let email = match.replace(/\s/g, '');
        const emailMatch = email.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          return emailMatch[1].toLowerCase();
        }
      }
    }
  }

  // Special handling for very malformed emails like "john . smith @ company . com"
  const spacedEmailPattern = /([a-zA-Z0-9._%+-]+)\s*\.\s*([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/g;
  const spacedMatch = text.match(spacedEmailPattern);
  if (spacedMatch) {
    const parts = spacedMatch[0].split(/\s+/);
    const reconstructed = parts.join('');
    const emailMatch = reconstructed.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      return emailMatch[1].toLowerCase();
    }
  }

  return null;
}

/**
 * Extract name with multiple strategies and fallbacks
 */
function extractName(originalText, normalizedText) {
  const strategies = [
    // Explicit name patterns
    /(?:i'm|i am|my name is|name is|call me|this is)\s+([a-zA-Z\s]{2,40})/gi,
    /(?:name|called)[\s:]+([a-zA-Z\s]{2,40})/gi,
    /hi,?\s+(?:i'm\s+)?([a-zA-Z\s]{2,40})/gi,
    /hello,?\s+(?:i'm\s+)?([a-zA-Z\s]{2,40})/gi,
    
    // Name in structured format (more flexible)
    /name[\s:]*([a-zA-Z\s]{2,40})/gi,
    /contact[\s:]*([a-zA-Z\s]{2,40})/gi,
    
    // Name after greeting
    /(?:hi|hello|hey),?\s+([a-zA-Z\s]{2,30})/gi,
    
    // French greeting
    /(?:je suis|bonjour.*?je suis)\s+([a-zA-Z\s]{2,40})/gi,
    
    // Informal patterns
    /(?:yo|hey).*?(?:its|it's)\s+([a-zA-Z\s]{2,20})/gi,
    
    // Name before "from"
    /([a-zA-Z\s]{2,30})\s+from\s+[a-zA-Z]/gi
  ];

  for (const strategy of strategies) {
    const match = originalText.match(strategy);
    if (match && match[1]) {
      let name = match[1].trim();
      
      // Clean up common artifacts
      name = name.replace(/\b(here|there|and|with|from|at|the|a|an|is|are|was|were|my|your|our|their|work|for|corp|company|inc|ltd)\b.*$/gi, '').trim();
      name = name.replace(/[^a-zA-Z\s]/g, '').trim();
      
      if (isValidName(name)) {
        return toTitleCase(name);
      }
    }
  }

  // Fallback: Look for capitalized words that could be names
  const words = originalText.split(/\s+/);
  const capitalizedWords = words.filter(word => 
    /^[A-Z][a-z]+$/.test(word) && 
    word.length > 1 && 
    !isCommonWord(word.toLowerCase())
  );

  if (capitalizedWords.length >= 2 && capitalizedWords.length <= 3) {
    const potentialName = capitalizedWords.slice(0, 3).join(' ');
    if (isValidName(potentialName)) {
      return potentialName;
    }
  }

  // Last resort: Look for quoted names
  const quotedMatch = originalText.match(/["']([a-zA-Z\s]{2,30})["']/);
  if (quotedMatch && isValidName(quotedMatch[1])) {
    return toTitleCase(quotedMatch[1]);
  }

  return null;
}

/**
 * Extract phone number with flexible patterns
 */
function extractPhone(text) {
  const strategies = [
    // Explicit phone patterns
    /(?:phone|call|mobile|cell|number|téléphone)[\s:]*(\+?[\d\s\-\(\)\.]{10,})/gi,
    /(?:reach me at|contact me at|office|mobile)[\s:]*(\+?[\d\s\-\(\)\.]{10,})/gi,
    
    // Standard phone formats
    /(\+?1?[\s\-\.]?\(?[0-9]{3}\)?[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4})/g,
    /(\+?[0-9]{1,3}[\s\-\.]?[0-9]{3,4}[\s\-\.]?[0-9]{3,4}[\s\-\.]?[0-9]{3,4})/g,
    
    // Loose phone patterns
    /(\d{3}[\s\-\.]?\d{3}[\s\-\.]?\d{4})/g,
    /(\+\d{1,3}[\s\-\.]?\d{3,4}[\s\-\.]?\d{3,4}[\s\-\.]?\d{3,4})/g,
    
    // International formats
    /(\+33\s?[0-9][\s\-\.]?[0-9]{2}[\s\-\.]?[0-9]{2}[\s\-\.]?[0-9]{2}[\s\-\.]?[0-9]{2})/g,
    /(\+44\s?[0-9]{4}[\s\-\.]?[0-9]{6})/g,
    
    // Parentheses format
    /\((\d{3})\)[\s\-\.]?(\d{3})[\s\-\.]?(\d{4})/g
  ];

  for (const strategy of strategies) {
    const matches = text.match(strategy);
    if (matches) {
      for (const match of matches) {
        let phone = match.replace(/[^\d+]/g, '');
        if (phone.length >= 10 && phone.length <= 15) {
          return phone;
        }
      }
    }
  }

  return null;
}

/**
 * Extract company with flexible patterns
 */
function extractCompany(originalText, normalizedText) {
  const strategies = [
    /(?:company|work at|employed by|from|at)\s+([a-zA-Z\s&.,\-]{2,50})/gi,
    /(?:i work for|working for|employed at)\s+([a-zA-Z\s&.,\-]{2,50})/gi,
    /(?:represent|representing)\s+([a-zA-Z\s&.,\-]{2,50})/gi,
    /company[\s:]*([a-zA-Z\s&.,\-]{2,50})/gi,
    /organization[\s:]*([a-zA-Z\s&.,\-]{2,50})/gi
  ];

  for (const strategy of strategies) {
    const match = originalText.match(strategy);
    if (match && match[1]) {
      let company = match[1].trim();
      
      // Clean up common artifacts
      company = company.replace(/\b(and|with|in|on|the|a|an|is|are|was|were)\b.*$/gi, '').trim();
      company = company.replace(/[^\w\s&.,\-]/g, '').trim();
      
      if (company.length >= 2 && company.length <= 50 && !isCommonWord(company.toLowerCase())) {
        return toTitleCase(company);
      }
    }
  }

  return null;
}

/**
 * Extract project type
 */
function extractProjectType(originalText, normalizedText) {
  const strategies = [
    /(?:project|website|app|application|system|platform|solution)[\s:]*([a-zA-Z\s]{3,30})/gi,
    /(?:need|want|looking for|interested in)[\s:]*(?:a|an)?\s*([a-zA-Z\s]{3,30})(?:\s+(?:website|app|system|platform|solution))/gi,
    /(?:build|create|develop|design)[\s:]*(?:a|an)?\s*([a-zA-Z\s]{3,30})/gi,
    /project type[\s:]*([a-zA-Z\s]{3,30})/gi
  ];

  for (const strategy of strategies) {
    const match = originalText.match(strategy);
    if (match && match[1]) {
      let projectType = match[1].trim();
      if (projectType.length >= 3 && projectType.length <= 30) {
        return toTitleCase(projectType);
      }
    }
  }

  return null;
}

/**
 * Extract budget information
 */
function extractBudget(text) {
  const strategies = [
    /(?:budget|cost|price|spend)[\s:]*(?:is|around|about|like)?\s*\$?([0-9,]+(?:\.[0-9]{2})?)/gi,
    /(?:budget|cost|price)[\s:]*(?:range|between)?\s*\$?([0-9,]+)\s*(?:to|-)\s*\$?([0-9,]+)/gi,
    /\$([0-9,]+(?:\.[0-9]{2})?)/g,
    /budget[\s:]*([0-9,]+)/gi,
    /([0-9,]+)k/gi, // Handle "5k", "10k" format
    /([0-9,]+)\s*(?:dollars|usd|eur|euros)/gi
  ];

  for (const strategy of strategies) {
    const match = text.match(strategy);
    if (match && match[1]) {
      let budget = match[1];
      // Handle "k" suffix
      if (text.toLowerCase().includes(budget.toLowerCase() + 'k')) {
        budget = budget + '000';
      }
      return budget;
    }
  }

  return null;
}

/**
 * Extract timeline information
 */
function extractTimeline(originalText, normalizedText) {
  const strategies = [
    /(?:timeline|deadline|by|need it|complete)[\s:]*(?:by|in|within)?\s*([a-zA-Z0-9\s]{3,20})/gi,
    /(?:asap|urgent|rush|quickly|soon)/gi,
    /(?:weeks?|months?|days?)[\s:]*([0-9]+)/gi,
    /timeline[\s:]*([a-zA-Z0-9\s]{3,20})/gi
  ];

  for (const strategy of strategies) {
    const match = originalText.match(strategy);
    if (match) {
      let timeline = match[1] || match[0];
      if (timeline && timeline.length >= 3 && timeline.length <= 20) {
        return timeline.trim();
      }
    }
  }

  return null;
}

/**
 * Extract contextual notes
 */
function extractNotes(text, context = {}) {
  const contextualInfo = [];
  
  // Look for sentences that contain project details
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    if (lowerSentence.includes('need') || 
        lowerSentence.includes('want') || 
        lowerSentence.includes('looking') ||
        lowerSentence.includes('project') ||
        lowerSentence.includes('help') ||
        lowerSentence.includes('interested') ||
        lowerSentence.includes('require')) {
      contextualInfo.push(sentence.trim());
    }
  }

  // Add context from previous messages if available
  if (context.previousMessages) {
    contextualInfo.push(`Context: ${context.previousMessages.slice(-2).join(' ')}`);
  }

  if (contextualInfo.length > 0) {
    return contextualInfo.join('. ').substring(0, 500);
  }

  return null;
}

/**
 * Utility functions
 */
function isValidName(name) {
  if (!name || name.length < 2 || name.length > 40) return false;
  if (!/^[a-zA-Z\s]+$/.test(name)) return false;
  
  const words = name.split(/\s+/);
  if (words.length > 4) return false;
  
  // Check against common false positives
  const commonWords = [
    'hello', 'thanks', 'please', 'would', 'could', 'should', 'about', 
    'project', 'website', 'application', 'system', 'platform', 'solution',
    'need', 'want', 'looking', 'interested', 'help', 'contact', 'email'
  ];
  
  return !words.some(word => commonWords.includes(word.toLowerCase()));
}

function isCommonWord(word) {
  const commonWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine',
    'yours', 'ours', 'theirs', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'need', 'want', 'like',
    'project', 'website', 'application', 'system', 'help', 'please', 'thanks'
  ];
  
  return commonWords.includes(word.toLowerCase());
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Parse structured lead data (JSON-like format from LLM)
 */
export function parseStructuredLead(data) {
  if (typeof data === 'string') {
    try {
      // Try to parse as JSON
      data = JSON.parse(data);
    } catch {
      // If not JSON, treat as text
      return parseLeadFromText(data);
    }
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const result = {
    email: null,
    name: null,
    phone: null,
    company: null,
    project_type: null,
    budget: null,
    timeline: null,
    notes: null
  };

  // Map common field variations
  const fieldMappings = {
    email: ['email', 'e-mail', 'emailAddress', 'contact_email', 'mail'],
    name: ['name', 'fullName', 'full_name', 'contact_name', 'client_name', 'firstName', 'first_name'],
    phone: ['phone', 'phoneNumber', 'phone_number', 'mobile', 'cell', 'telephone'],
    company: ['company', 'organization', 'org', 'business', 'employer', 'workplace'],
    project_type: ['project_type', 'projectType', 'project', 'type', 'service', 'category'],
    budget: ['budget', 'cost', 'price', 'amount', 'investment', 'spend'],
    timeline: ['timeline', 'deadline', 'timeframe', 'schedule', 'duration', 'when'],
    notes: ['notes', 'description', 'details', 'comments', 'message', 'additional_info']
  };

  // Extract data using field mappings
  Object.keys(fieldMappings).forEach(field => {
    for (const variation of fieldMappings[field]) {
      if (data[variation] && !result[field]) {
        let value = data[variation];
        if (typeof value === 'string') {
          value = value.trim();
          if (value.length > 0) {
            result[field] = value;
            break;
          }
        }
      }
    }
  });

  // Clean up and validate
  if (result.email) {
    const emailMatch = result.email.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    result.email = emailMatch ? emailMatch[1].toLowerCase() : null;
  }

  if (result.phone) {
    result.phone = result.phone.replace(/[^\d+]/g, '');
    if (result.phone.length < 10) result.phone = null;
  }

  // Return if we have minimum viable information
  const hasMinimumInfo = result.email || (result.name && (result.phone || result.company));
  return hasMinimumInfo ? result : null;
}

/**
 * Main parsing function that tries multiple strategies
 */
export function flexibleLeadParse(input, context = {}) {
  console.log('🔍 [FLEXIBLE PARSER] Starting parse operation:', {
    inputType: typeof input,
    inputLength: typeof input === 'string' ? input.length : 'N/A',
    hasContext: Object.keys(context).length > 0
  });
  
  if (!input) {
    console.log('⚠️ [FLEXIBLE PARSER] No input provided');
    return null;
  }

  // Strategy 1: Try structured parsing first
  if (typeof input === 'object' || (typeof input === 'string' && input.trim().startsWith('{'))) {
    console.log('📋 [FLEXIBLE PARSER] Attempting structured parsing...');
    const structured = parseStructuredLead(input);
    if (structured) {
      console.log('✅ [FLEXIBLE PARSER] Structured parsing successful:', {
        hasEmail: !!structured.email,
        hasName: !!structured.name,
        confidence: structured.confidence
      });
      return structured;
    }
    console.log('❌ [FLEXIBLE PARSER] Structured parsing failed');
  }

  // Strategy 2: Text parsing
  console.log('📝 [FLEXIBLE PARSER] Attempting text parsing...');
  const textResult = parseLeadFromText(input, context);
  if (textResult) {
    console.log('✅ [FLEXIBLE PARSER] Text parsing successful:', {
      hasEmail: !!textResult.email,
      hasName: !!textResult.name,
      confidence: textResult.confidence
    });
    return textResult;
  }
  console.log('❌ [FLEXIBLE PARSER] Text parsing failed');

  // Strategy 3: Last resort - extract any email or name-like patterns
  console.log('🆘 [FLEXIBLE PARSER] Attempting last resort extraction...');
  const text = typeof input === 'string' ? input : JSON.stringify(input);
  const email = extractEmail(text);
  const name = extractName(text, text.toLowerCase());
  
  console.log('🔍 [FLEXIBLE PARSER] Last resort results:', {
    foundEmail: !!email,
    foundName: !!name
  });

  if (email || name) {
    const result = {
      email,
      name,
      phone: null,
      company: null,
      project_type: null,
      budget: null,
      timeline: null,
      notes: text.length > 50 ? text.substring(0, 200) + '...' : text,
      confidence: email ? 0.5 : 0.3
    };
    console.log('✅ [FLEXIBLE PARSER] Last resort extraction successful');
    return result;
  }

  console.log('❌ [FLEXIBLE PARSER] All parsing strategies failed');
  return null;
}

export default {
  parseLeadFromText,
  parseStructuredLead,
  flexibleLeadParse
};