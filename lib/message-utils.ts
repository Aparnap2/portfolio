// =============================================================================
// MESSAGE UTILITIES - Optimized for Performance
// =============================================================================

// =============================================================================
// MESSAGE TYPE DETECTION
// =============================================================================

export interface MessageContent {
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  id: string;
}

export type MessageRole = 'user' | 'assistant';

// Optimized role detection - memoized
const roleDetectionCache = new WeakMap<object, MessageRole>();

export function getMessageRole(message: any): MessageRole {
  // Check cache first
  if (roleDetectionCache.has(message)) {
    return roleDetectionCache.get(message)!;
  }

  let role: MessageRole = 'assistant';

  // Check if message has the structure of a serialized HumanMessage
  if (message?.id && Array.isArray(message.id) && message.id[2] === 'HumanMessage') {
    role = 'user';
  } else if (message instanceof HumanMessage) {
    role = 'user';
  }

  // Cache the result
  roleDetectionCache.set(message, role);
  return role;
}

// =============================================================================
// CONTENT EXTRACTION - Optimized with Caching
// =============================================================================

const contentExtractionCache = new WeakMap<object, string>();

export function getMessageContent(message: any): string {
  // Check cache first
  if (contentExtractionCache.has(message)) {
    return contentExtractionCache.get(message)!;
  }

  let content: string;

  if (message?.content) {
    // Direct content property
    content = typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content);
  } else if (message?.kwargs?.content) {
    // Serialized LangChain message has content in kwargs
    content = typeof message.kwargs.content === 'string' 
      ? message.kwargs.content 
      : JSON.stringify(message.kwargs.content);
  } else if (message?.kwargs) {
    // Fallback to kwargs object
    content = JSON.stringify(message.kwargs);
  } else {
    // Last resort
    content = JSON.stringify(message);
  }

  // Cache the result (limit cache size by pruning occasionally)
  if (contentExtractionCache.size > 1000) {
    // Clear cache when it gets too large
    contentExtractionCache.clear();
  }
  
  contentExtractionCache.set(message, content);
  return content;
}

// =============================================================================
// MESSAGE PROCESSING - Optimized
// =============================================================================

export function processMessage(message: any): MessageContent {
  return {
    content: getMessageContent(message),
    role: getMessageRole(message),
    timestamp: Date.now(),
    id: generateMessageId(message)
  };
}

export function generateMessageId(message: any): string {
  // Generate consistent ID from message content
  const content = getMessageContent(message);
  const role = getMessageRole(message);
  
  // Simple hash function for ID generation
  let hash = 0;
  const str = content + role + Date.now();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `${role}-${Math.abs(hash)}`;
}

// =============================================================================
// MESSAGE FILTERING - Optimized
// =============================================================================

export function filterMessagesByRole(messages: any[], role: MessageRole): any[] {
  return messages.filter(msg => getMessageRole(msg) === role);
}

export function getLastNMessages(messages: any[], count: number): any[] {
  return messages.slice(-count);
}

export function truncateMessage(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength - 3) + '...';
}

// =============================================================================
// PHASE MANAGEMENT
// =============================================================================

export const PHASE_ORDER = {
  discovery: 1,
  pain_points: 2,
  contact_info: 3,
  processing: 4,
  finished: 5,
  completed: 6
} as const;

export type PhaseType = keyof typeof PHASE_ORDER;

export function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    discovery: "Discovery",
    pain_points: "Pain Points", 
    contact_info: "Contact Info",
    processing: "Processing",
    finished: "Finished",
    completed: "Completed"
  };
  return labels[phase] || phase;
}

export function calculateProgress(phase: string): number {
  const progressMap: Record<string, number> = {
    discovery: 20,
    pain_points: 40,
    contact_info: 60,
    processing: 80,
    finished: 100,
    completed: 100
  };
  return progressMap[phase] || 0;
}

export function getNextPhase(currentPhase: string): string {
  const phases = Object.keys(PHASE_ORDER);
  const currentIndex = phases.indexOf(currentPhase);
  const nextIndex = currentIndex + 1;
  return phases[Math.min(nextIndex, phases.length - 1)];
}
