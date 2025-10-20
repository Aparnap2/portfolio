import { updateAuditAnalytics } from "@/lib/analytics";
import { db } from "@/lib/db";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    auditAnalytics: {
      upsert: jest.fn(),
    }
  }
}));

describe("Analytics Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateAuditAnalytics", () => {
    it("should create a new analytics record", async () => {
      const mockAnalytics = {
        id: "analytics-test-date",
        date: new Date(),
        auditsStarted: 5,
        auditsCompleted: 3,
        avgPainScore: 75,
        avgEstimatedValue: 2000,
      };

      (db.auditAnalytics.upsert as jest.Mock).mockResolvedValueOnce(mockAnalytics);

      const updateData = {
        auditsStarted: 5,
        auditsCompleted: 3,
        avgPainScore: 75,
        avgEstimatedValue: 2000,
      };

      const result = await updateAuditAnalytics(updateData);

      expect(db.auditAnalytics.upsert).toHaveBeenCalledWith({
        where: { date: expect.any(Date) },
        update: {
          auditsStarted: { increment: 5 },
          auditsCompleted: { increment: 3 },
          avgPainScore: 75,
          avgEstimatedValue: 2000,
          auditsAbandoned: { increment: 0 },
          leadsGenerated: { increment: 0 },
          phase1Dropoff: { increment: 0 },
          phase2Dropoff: { increment: 0 },
          phase3Dropoff: { increment: 0 },
        },
        create: {
          date: expect.any(Date),
          auditsStarted: 5,
          auditsCompleted: 3,
          auditsAbandoned: 0,
          phase1Dropoff: 0,
          phase2Dropoff: 0,
          phase3Dropoff: 0,
          avgPainScore: 75,
          avgEstimatedValue: 2000,
          leadsGenerated: 0,
          callsBooked: 0,
          proposalsSent: 0,
          projectsWon: 0,
          topOpportunities: [],
        }
      });

      expect(result).toEqual(mockAnalytics);
    });

    it("should increment existing analytics record", async () => {
      const mockAnalytics = {
        id: "analytics-test-date",
        date: new Date(),
        auditsStarted: 10,
        auditsCompleted: 6,
      };

      (db.auditAnalytics.upsert as jest.Mock).mockResolvedValueOnce(mockAnalytics);

      const updateData = {
        auditsStarted: 5,
        auditsCompleted: 3,
      };

      const result = await updateAuditAnalytics(updateData);

      expect(db.auditAnalytics.upsert).toHaveBeenCalledWith({
        where: { date: expect.any(Date) },
        update: {
          auditsStarted: { increment: 5 },
          auditsCompleted: { increment: 3 },
          avgPainScore: undefined,
          avgEstimatedValue: undefined,
          auditsAbandoned: { increment: 0 },
          leadsGenerated: { increment: 0 },
          phase1Dropoff: { increment: 0 },
          phase2Dropoff: { increment: 0 },
          phase3Dropoff: { increment: 0 },
        },
        create: {
          date: expect.any(Date),
          auditsStarted: 5,
          auditsCompleted: 3,
          auditsAbandoned: 0,
          phase1Dropoff: 0,
          phase2Dropoff: 0,
          phase3Dropoff: 0,
          avgPainScore: null,
          avgEstimatedValue: null,
          leadsGenerated: 0,
          callsBooked: 0,
          proposalsSent: 0,
          projectsWon: 0,
          topOpportunities: [],
        }
      });

      expect(result).toEqual(mockAnalytics);
    });

    it("should handle top opportunities", async () => {
      const mockAnalytics = {
        id: "analytics-test-date",
        date: new Date(),
        auditsStarted: 5,
        topOpportunities: [{ name: "Lead Qualification", count: 2 }],
      };

      (db.auditAnalytics.upsert as jest.Mock).mockResolvedValueOnce(mockAnalytics);

      const updateData = {
        auditsStarted: 5,
        topOpportunities: ["Lead Qualification", "Reporting Automation"],
      };

      const result = await updateAuditAnalytics(updateData);

      expect(db.auditAnalytics.upsert).toHaveBeenCalledWith({
        where: { date: expect.any(Date) },
        update: {
          auditsStarted: { increment: 5 },
          auditsCompleted: { increment: 0 },
          avgPainScore: undefined,
          avgEstimatedValue: undefined,
          auditsAbandoned: { increment: 0 },
          leadsGenerated: { increment: 0 },
          phase1Dropoff: { increment: 0 },
          phase2Dropoff: { increment: 0 },
          phase3Dropoff: { increment: 0 },
        },
        create: {
          date: expect.any(Date),
          auditsStarted: 5,
          auditsCompleted: 0,
          auditsAbandoned: 0,
          phase1Dropoff: 0,
          phase2Dropoff: 0,
          phase3Dropoff: 0,
          avgPainScore: null,
          avgEstimatedValue: null,
          leadsGenerated: 0,
          callsBooked: 0,
          proposalsSent: 0,
          projectsWon: 0,
          topOpportunities: [{ name: "Lead Qualification", count: 1 }, { name: "Reporting Automation", count: 1 }],
        }
      });

      expect(result).toEqual(mockAnalytics);
    });
  });
});