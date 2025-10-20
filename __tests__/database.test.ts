import { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

// Mock the Prisma client to avoid database calls in tests
jest.mock("@prisma/client", () => {
  // Use jest.fn() to create a mock constructor
  const mockPrismaClient = {
    auditSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditOpportunity: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    opportunityTemplate: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    lead: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    auditAnalytics: {
      upsert: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe("Database Models", () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe("db.auditSession", () => {
    it("should have the correct methods", () => {
      expect(db.auditSession).toHaveProperty("create");
      expect(db.auditSession).toHaveProperty("findUnique");
      expect(db.auditSession).toHaveProperty("update");
    });

    it("should call prisma auditSession methods", async () => {
      const mockData = {
        id: "test-id",
        sessionId: "test-session-id",
        currentPhase: "discovery",
      };

      (prisma.auditSession.create as jest.Mock).mockResolvedValue(mockData);

      const result = await db.auditSession.create({
        data: {
          sessionId: "test-session-id",
          currentPhase: "discovery",
          completionPercent: 0,
          status: "in_progress",
        }
      });

      expect(prisma.auditSession.create).toHaveBeenCalledWith({
        data: {
          sessionId: "test-session-id",
          currentPhase: "discovery",
          completionPercent: 0,
          status: "in_progress",
        }
      });

      expect(result).toEqual(mockData);
    });
  });

  describe("db.auditOpportunity", () => {
    it("should have the correct methods", () => {
      expect(db.auditOpportunity).toHaveProperty("create");
      expect(db.auditOpportunity).toHaveProperty("findMany");
    });

    it("should call prisma auditOpportunity methods", async () => {
      const mockOpportunity = {
        id: "opp-1",
        sessionId: "session-1",
        name: "Test Opportunity",
      };

      (prisma.auditOpportunity.create as jest.Mock).mockResolvedValue(mockOpportunity);

      const result = await db.auditOpportunity.create({
        data: {
          sessionId: "session-1",
          templateId: "tpl-1",
          name: "Test Opportunity",
          problemStatement: "Test problem",
          solutionDescription: "Test solution",
          category: "lead_gen",
          difficulty: "low",
          hoursSavedPerMonth: 10,
          monthlySavings: 1000,
          devCostMin: 1000,
          devCostMax: 3000,
          devCostMid: 2000,
          implementationWeeks: 4,
          breakevenMonths: 2.0,
          roi12Months: 150,
          roi36Months: null,
          matchScore: 85,
          rank: 1,
          painPointsMatched: [],
          systemsRequired: [],
        }
      });

      expect(prisma.auditOpportunity.create).toHaveBeenCalledWith({
        data: {
          sessionId: "session-1",
          templateId: "tpl-1",
          name: "Test Opportunity",
          problemStatement: "Test problem",
          solutionDescription: "Test solution",
          category: "lead_gen",
          difficulty: "low",
          hoursSavedPerMonth: 10,
          monthlySavings: 1000,
          devCostMin: 1000,
          devCostMax: 3000,
          devCostMid: 2000,
          implementationWeeks: 4,
          breakevenMonths: 2.0,
          roi12Months: 150,
          roi36Months: null,
          matchScore: 85,
          rank: 1,
          painPointsMatched: [],
          systemsRequired: [],
        }
      });

      expect(result).toEqual(mockOpportunity);
    });
  });

  describe("db.opportunityTemplate", () => {
    it("should have the correct methods", () => {
      expect(db.opportunityTemplate).toHaveProperty("findMany");
      expect(db.opportunityTemplate).toHaveProperty("update");
    });

    it("should call prisma opportunityTemplate methods", async () => {
      const mockTemplates = [
        { id: "tpl-1", name: "Template 1", category: "lead_gen" },
        { id: "tpl-2", name: "Template 2", category: "analytics" },
      ];

      (prisma.opportunityTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);

      const result = await db.opportunityTemplate.findMany({
        where: {
          category: {
            in: ["lead_gen", "analytics"]
          }
        }
      });

      expect(prisma.opportunityTemplate.findMany).toHaveBeenCalledWith({
        where: {
          category: {
            in: ["lead_gen", "analytics"]
          }
        }
      });

      expect(result).toEqual(mockTemplates);
    });
  });

  describe("db.lead", () => {
    it("should have the correct methods", () => {
      expect(db.lead).toHaveProperty("upsert");
      expect(db.lead).toHaveProperty("findUnique");
    });

    it("should call prisma lead methods", async () => {
      const mockLead = {
        id: "lead-1",
        email: "test@example.com",
        name: "Test User",
      };

      (prisma.lead.upsert as jest.Mock).mockResolvedValue(mockLead);

      const result = await db.lead.upsert({
        where: { email: "test@example.com" },
        create: {
          name: "Test User",
          email: "test@example.com",
          source: "audit",
        },
        update: {
          name: "Test User",
        },
      });

      expect(prisma.lead.upsert).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        create: {
          name: "Test User",
          email: "test@example.com",
          source: "audit",
        },
        update: {
          name: "Test User",
        },
      });

      expect(result).toEqual(mockLead);
    });
  });

  describe("db.notification", () => {
    it("should have the correct methods", () => {
      expect(db.notification).toHaveProperty("create");
    });

    it("should call prisma notification methods", async () => {
      const mockNotification = {
        id: "notif-1",
        leadId: "lead-1",
        type: "email",
      };

      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await db.notification.create({
        data: {
          leadId: "lead-1",
          type: "email",
          status: "pending",
          subject: "Test Subject",
        }
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          leadId: "lead-1",
          type: "email",
          status: "pending",
          subject: "Test Subject",
        }
      });

      expect(result).toEqual(mockNotification);
    });
  });

  describe("db.auditAnalytics", () => {
    it("should have the upsert method", () => {
      expect(db.auditAnalytics).toHaveProperty("upsert");
    });

    it("should call prisma auditAnalytics methods", async () => {
      const mockAnalytics = {
        id: "analytics-1",
        date: new Date(),
        auditsStarted: 10,
      };

      (prisma.auditAnalytics.upsert as jest.Mock).mockResolvedValue(mockAnalytics);

      const result = await db.auditAnalytics.upsert({
        where: { date: new Date() },
        update: { auditsStarted: { increment: 5 } },
        create: { date: new Date(), auditsStarted: 5 },
      });

      expect(prisma.auditAnalytics.upsert).toHaveBeenCalledWith({
        where: { date: expect.any(Date) },
        update: { auditsStarted: { increment: 5 } },
        create: { date: expect.any(Date), auditsStarted: 5 },
      });

      expect(result).toEqual(mockAnalytics);
    });
  });
});