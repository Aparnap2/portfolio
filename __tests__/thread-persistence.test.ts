/**
 * Thread Persistence Tests
 * TDD tests for email-based thread IDs and memory management
 */

import { InMemoryStore } from "@langchain/langgraph";
import {
  generateThreadId,
  extractEmailFromThreadId,
  findThreadsForEmail,
  getOrCreateThread,
  storeUserProfile,
  getUserProfile,
  storeAuditPreferences,
  getAuditPreferences,
  createGraphConfig,
  extractUserContext,
} from "@/lib/workflows/thread-persistence";

describe("Thread ID Management", () => {
  describe("generateThreadId", () => {
    it("should generate unique thread ID from email", async () => {
      const email = "test@example.com";
      const threadId1 = generateThreadId(email);
      
      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const threadId2 = generateThreadId(email);

      expect(threadId1).toContain(email);
      expect(threadId1).not.toEqual(threadId2);
      expect(threadId1).toMatch(/test@example\.com-\d+/);
    });

    it("should normalize email to lowercase", () => {
      const email = "Test@Example.COM";
      const threadId = generateThreadId(email);

      expect(threadId).toContain("test@example.com");
      expect(threadId).not.toContain("Test@Example.COM");
    });

    it("should use provided timestamp", () => {
      const email = "test@example.com";
      const timestamp = 1234567890;
      const threadId = generateThreadId(email, timestamp);

      expect(threadId).toBe(`${email}-${timestamp}`);
    });
  });

  describe("extractEmailFromThreadId", () => {
    it("should extract email from thread ID", () => {
      const email = "test@example.com";
      const threadId = generateThreadId(email);
      const extracted = extractEmailFromThreadId(threadId);

      expect(extracted).toBe(email);
    });

    it("should handle emails with hyphens", () => {
      const email = "test-user@example.com";
      const threadId = generateThreadId(email);
      const extracted = extractEmailFromThreadId(threadId);

      expect(extracted).toBe(email);
    });
  });
});

describe("Thread Management with Store", () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  describe("getOrCreateThread", () => {
    it("should create new thread for new email", async () => {
      const email = "newuser@example.com";
      const result = await getOrCreateThread(email, store);

      expect(result.isNew).toBe(true);
      expect(result.threadId).toContain(email.toLowerCase());
    });

    it("should return existing thread for known email", async () => {
      const email = "existing@example.com";

      // Create first thread
      const result1 = await getOrCreateThread(email, store);
      expect(result1.isNew).toBe(true);

      // Small delay to ensure store is updated
      await new Promise(resolve => setTimeout(resolve, 10));

      // Get existing thread
      const result2 = await getOrCreateThread(email, store);
      expect(result2.isNew).toBe(false);
      expect(result2.threadId).toBe(result1.threadId);
    });

    it("should return most recent thread when multiple exist", async () => {
      const email = "multi@example.com";

      // Create multiple threads
      const thread1 = await getOrCreateThread(email, store);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      
      // Manually create another thread with later timestamp
      const sanitizedEmail = email.replace(/[.@]/g, '_');
      const namespace = [sanitizedEmail, "threads"];
      const newThreadId = generateThreadId(email, Date.now() + 1000);
      await store.put(namespace, newThreadId, {
        createdAt: new Date().toISOString(),
        email,
        status: 'active'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await getOrCreateThread(email, store);
      expect(result.threadId).toBe(newThreadId);
    });
  });

  describe("findThreadsForEmail", () => {
    it("should find all threads for an email", async () => {
      const email = "user@example.com";
      const sanitizedEmail = email.replace(/[.@]/g, '_');
      const namespace = [sanitizedEmail, "threads"];

      // Create multiple threads
      const threadId1 = generateThreadId(email, 1000);
      const threadId2 = generateThreadId(email, 2000);

      await store.put(namespace, threadId1, { createdAt: new Date().toISOString() });
      await store.put(namespace, threadId2, { createdAt: new Date().toISOString() });

      await new Promise(resolve => setTimeout(resolve, 10));

      const threads = await findThreadsForEmail(email, store);

      expect(threads.length).toBeGreaterThanOrEqual(2);
      expect(threads).toContain(threadId1);
      expect(threads).toContain(threadId2);
    });

    it("should return empty array for email with no threads", async () => {
      const email = "nothread@example.com";
      const threads = await findThreadsForEmail(email, store);

      expect(threads).toEqual([]);
    });
  });
});

describe("User Profile Management", () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  describe("storeUserProfile", () => {
    it("should store user profile", async () => {
      const email = "user@example.com";
      const profile = {
        company: "Acme Corp",
        industry: "Technology",
        companySize: "50-100",
        name: "John Doe",
      };

      await storeUserProfile(email, profile, store);
      await new Promise(resolve => setTimeout(resolve, 10));

      const retrieved = await getUserProfile(email, store);
      expect(retrieved).toMatchObject(profile);
      expect(retrieved.updatedAt).toBeDefined();
    });

    it("should update existing profile", async () => {
      const email = "user2@example.com";
      const profile1 = { company: "Old Corp", industry: "Tech" };
      const profile2 = { company: "New Corp", industry: "Finance" };

      await storeUserProfile(email, profile1, store);
      await new Promise(resolve => setTimeout(resolve, 10));
      await storeUserProfile(email, profile2, store);
      await new Promise(resolve => setTimeout(resolve, 10));

      const retrieved = await getUserProfile(email, store);
      expect(retrieved.company).toBe("New Corp");
      expect(retrieved.industry).toBe("Finance");
    });
  });

  describe("getUserProfile", () => {
    it("should return null for non-existent profile", async () => {
      const email = "nonexistent@example.com";
      const profile = await getUserProfile(email, store);

      expect(profile).toBeNull();
    });

    it("should return most recent profile", async () => {
      const email = "user3@example.com";

      await storeUserProfile(email, { company: "Old Corp" }, store);
      await new Promise(resolve => setTimeout(resolve, 10));
      await storeUserProfile(email, { company: "New Corp" }, store);
      await new Promise(resolve => setTimeout(resolve, 10));

      const profile = await getUserProfile(email, store);
      expect(profile.company).toBe("New Corp");
    });
  });
});

describe("Audit Preferences Management", () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  describe("storeAuditPreferences", () => {
    it("should store audit preferences", async () => {
      const email = "prefs@example.com";
      const preferences = {
        preferredMeetingTime: "10:00 AM",
        timezone: "America/New_York",
        communicationPreference: "email",
      };

      await storeAuditPreferences(email, preferences, store);
      await new Promise(resolve => setTimeout(resolve, 10));

      const retrieved = await getAuditPreferences(email, store);
      expect(retrieved).toMatchObject(preferences);
    });
  });

  describe("getAuditPreferences", () => {
    it("should return null for non-existent preferences", async () => {
      const email = "nonexistent@example.com";
      const prefs = await getAuditPreferences(email, store);

      expect(prefs).toBeNull();
    });
  });
});

describe("Graph Configuration", () => {
  describe("createGraphConfig", () => {
    it("should create config with thread_id and user_id", () => {
      const email = "user@example.com";
      const threadId = generateThreadId(email);
      const config = createGraphConfig(email, threadId);

      expect(config.configurable.thread_id).toBe(threadId);
      expect(config.configurable.user_id).toBe(email);
    });

    it("should normalize email in user_id", () => {
      const email = "User@Example.COM";
      const threadId = generateThreadId(email);
      const config = createGraphConfig(email, threadId);

      expect(config.configurable.user_id).toBe("user@example.com");
    });
  });

  describe("extractUserContext", () => {
    it("should extract thread_id and user_id from config", () => {
      const config = {
        configurable: {
          thread_id: "test-thread-123",
          user_id: "user@example.com",
        },
      };

      const context = extractUserContext(config);

      expect(context.threadId).toBe("test-thread-123");
      expect(context.userId).toBe("user@example.com");
    });

    it("should return empty strings for missing config", () => {
      const config = {};
      const context = extractUserContext(config);

      expect(context.threadId).toBe("");
      expect(context.userId).toBe("");
    });
  });
});
