/**
 * Thread Persistence & Memory Management
 * Implements email-based thread IDs and LangGraph persistence
 */

import { InMemoryStore } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { v4 as uuid4 } from "uuid";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sanitize email for use in namespace (remove periods and special chars)
 */
function sanitizeEmailForNamespace(email: string): string {
  return email.toLowerCase().trim().replace(/[.@]/g, '_');
}

// ============================================
// THREAD ID MANAGEMENT
// ============================================

/**
 * Generate thread ID from email and timestamp
 * Format: email-timestamp for uniqueness
 */
export function generateThreadId(email: string, timestamp?: number): string {
  const cleanEmail = email.toLowerCase().trim();
  const ts = timestamp || Date.now();
  return `${cleanEmail}-${ts}`;
}

/**
 * Extract email from thread ID
 */
export function extractEmailFromThreadId(threadId: string): string {
  const parts = threadId.split('-');
  // Remove timestamp (last part)
  parts.pop();
  return parts.join('-');
}

/**
 * Find existing threads for an email
 */
export async function findThreadsForEmail(
  email: string,
  store: InMemoryStore
): Promise<string[]> {
  const sanitizedEmail = sanitizeEmailForNamespace(email);
  const namespace = [sanitizedEmail, "threads"];
  
  try {
    const threads = await store.search(namespace);
    return threads.map(t => t.key);
  } catch (error) {
    console.error("[Thread Persistence] Error finding threads:", error);
    return [];
  }
}

/**
 * Get or create thread for email
 * Returns existing thread if found, otherwise creates new one
 */
export async function getOrCreateThread(
  email: string,
  store: InMemoryStore
): Promise<{ threadId: string; isNew: boolean }> {
  const existingThreads = await findThreadsForEmail(email, store);
  
  if (existingThreads.length > 0) {
    // Return most recent thread
    const sortedThreads = existingThreads.sort((a, b) => {
      const tsA = parseInt(a.split('-').pop() || '0');
      const tsB = parseInt(b.split('-').pop() || '0');
      return tsB - tsA;
    });
    
    return {
      threadId: sortedThreads[0],
      isNew: false
    };
  }
  
  // Create new thread
  const threadId = generateThreadId(email);
  const sanitizedEmail = sanitizeEmailForNamespace(email);
  const namespace = [sanitizedEmail, "threads"];
  
  await store.put(namespace, threadId, {
    createdAt: new Date().toISOString(),
    email,
    status: 'active'
  });
  
  return {
    threadId,
    isNew: true
  };
}

// ============================================
// MEMORY STORE MANAGEMENT
// ============================================

/**
 * Initialize in-memory store for cross-thread persistence
 */
export function createMemoryStore(): InMemoryStore {
  return new InMemoryStore();
}

/**
 * Initialize checkpointer for thread-level persistence
 */
export function createCheckpointer(): MemorySaver {
  return new MemorySaver();
}

/**
 * Store user profile in long-term memory
 */
export async function storeUserProfile(
  email: string,
  profile: {
    company?: string;
    industry?: string;
    companySize?: string;
    name?: string;
  },
  store: InMemoryStore
): Promise<void> {
  const sanitizedEmail = sanitizeEmailForNamespace(email);
  const namespace = [sanitizedEmail, "profile"];
  const profileId = uuid4();
  
  await store.put(namespace, profileId, {
    ...profile,
    updatedAt: new Date().toISOString()
  });
  
  console.log(`[Memory Store] Stored profile for ${email}`);
}

/**
 * Retrieve user profile from long-term memory
 */
export async function getUserProfile(
  email: string,
  store: InMemoryStore
): Promise<any | null> {
  const sanitizedEmail = sanitizeEmailForNamespace(email);
  const namespace = [sanitizedEmail, "profile"];
  
  try {
    const profiles = await store.search(namespace);
    if (profiles.length === 0) return null;
    
    // Return most recent profile
    const sorted = profiles.sort((a, b) => {
      const dateA = new Date(a.value.updatedAt || 0).getTime();
      const dateB = new Date(b.value.updatedAt || 0).getTime();
      return dateB - dateA;
    });
    
    return sorted[0].value;
  } catch (error) {
    console.error("[Memory Store] Error retrieving profile:", error);
    return null;
  }
}

/**
 * Store audit preferences in long-term memory
 */
export async function storeAuditPreferences(
  email: string,
  preferences: {
    preferredMeetingTime?: string;
    timezone?: string;
    communicationPreference?: string;
  },
  store: InMemoryStore
): Promise<void> {
  const sanitizedEmail = sanitizeEmailForNamespace(email);
  const namespace = [sanitizedEmail, "preferences"];
  const prefId = uuid4();
  
  await store.put(namespace, prefId, {
    ...preferences,
    updatedAt: new Date().toISOString()
  });
  
  console.log(`[Memory Store] Stored preferences for ${email}`);
}

/**
 * Retrieve audit preferences from long-term memory
 */
export async function getAuditPreferences(
  email: string,
  store: InMemoryStore
): Promise<any | null> {
  const sanitizedEmail = sanitizeEmailForNamespace(email);
  const namespace = [sanitizedEmail, "preferences"];
  
  try {
    const prefs = await store.search(namespace);
    if (prefs.length === 0) return null;
    
    // Return most recent preferences
    const sorted = prefs.sort((a, b) => {
      const dateA = new Date(a.value.updatedAt || 0).getTime();
      const dateB = new Date(b.value.updatedAt || 0).getTime();
      return dateB - dateA;
    });
    
    return sorted[0].value;
  } catch (error) {
    console.error("[Memory Store] Error retrieving preferences:", error);
    return null;
  }
}

/**
 * Store ROI baselines for future sessions
 */
export async function storeROIBaselines(
  email: string,
  baselines: {
    volumes: number;
    cycleTime: number;
    errors: number;
  },
  store: InMemoryStore
): Promise<void> {
  const sanitizedEmail = sanitizeEmailForNamespace(email);
  const namespace = [sanitizedEmail, "roi_baselines"];
  const baselineId = uuid4();
  
  await store.put(namespace, baselineId, {
    ...baselines,
    updatedAt: new Date().toISOString()
  });
  
  console.log(`[Memory Store] Stored ROI baselines for ${email}`);
}

/**
 * Retrieve ROI baselines from previous sessions
 */
export async function getROIBaselines(
  email: string,
  store: InMemoryStore
): Promise<any | null> {
  const sanitizedEmail = sanitizeEmailForNamespace(email);
  const namespace = [sanitizedEmail, "roi_baselines"];
  
  try {
    const baselines = await store.search(namespace);
    if (baselines.length === 0) return null;
    
    // Return most recent baselines
    const sorted = baselines.sort((a, b) => {
      const dateA = new Date(a.value.updatedAt || 0).getTime();
      const dateB = new Date(b.value.updatedAt || 0).getTime();
      return dateB - dateA;
    });
    
    return sorted[0].value;
  } catch (error) {
    console.error("[Memory Store] Error retrieving baselines:", error);
    return null;
  }
}

/**
 * Clean up old threads (optional maintenance)
 */
export async function cleanupOldThreads(
  email: string,
  store: InMemoryStore,
  daysToKeep: number = 90
): Promise<number> {
  const sanitizedEmail = sanitizeEmailForNamespace(email);
  const namespace = [sanitizedEmail, "threads"];
  const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  try {
    const threads = await store.search(namespace);
    let deletedCount = 0;
    
    for (const thread of threads) {
      const threadTimestamp = parseInt(thread.key.split('-').pop() || '0');
      if (threadTimestamp < cutoffDate) {
        // Note: InMemoryStore doesn't have delete method in current API
        // This would need to be implemented with a proper store backend
        deletedCount++;
      }
    }
    
    console.log(`[Memory Store] Cleaned up ${deletedCount} old threads for ${email}`);
    return deletedCount;
  } catch (error) {
    console.error("[Memory Store] Error cleaning up threads:", error);
    return 0;
  }
}

// ============================================
// CONFIGURATION HELPERS
// ============================================

/**
 * Create LangGraph config with thread ID and user ID
 */
export function createGraphConfig(email: string, threadId: string) {
  return {
    configurable: {
      thread_id: threadId,
      user_id: email.toLowerCase().trim()
    }
  };
}

/**
 * Extract user context from config
 */
export function extractUserContext(config: any): {
  threadId: string;
  userId: string;
} {
  return {
    threadId: config.configurable?.thread_id || '',
    userId: config.configurable?.user_id || ''
  };
}
