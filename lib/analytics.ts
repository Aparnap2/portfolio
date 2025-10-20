import type { AuditAnalytics } from "@/lib/types";
import { db } from "@/lib/db";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function updateAuditAnalytics(update: {
  auditsStarted?: number;
  auditsCompleted?: number;
  auditsAbandoned?: number;
  phase1Dropoff?: number;
  phase2Dropoff?: number;
  phase3Dropoff?: number;
  avgPainScore?: number | null;
  avgEstimatedValue?: number | null;
  leadsGenerated?: number;
  topOpportunities?: string[];
}) {
  const key = todayKey();
  
  // Upsert analytics record for today
  const result = await db.auditAnalytics.upsert({
    where: { date: new Date(key) },
    update: {
      auditsStarted: { increment: update.auditsStarted ?? 0 },
      auditsCompleted: { increment: update.auditsCompleted ?? 0 },
      auditsAbandoned: { increment: update.auditsAbandoned ?? 0 },
      phase1Dropoff: { increment: update.phase1Dropoff ?? 0 },
      phase2Dropoff: { increment: update.phase2Dropoff ?? 0 },
      phase3Dropoff: { increment: update.phase3Dropoff ?? 0 },
      avgPainScore: update.avgPainScore !== undefined ? update.avgPainScore : undefined,
      avgEstimatedValue: update.avgEstimatedValue !== undefined ? update.avgEstimatedValue : undefined,
      leadsGenerated: { increment: update.leadsGenerated ?? 0 },
    },
    create: {
      date: new Date(key),
      auditsStarted: update.auditsStarted ?? 0,
      auditsCompleted: update.auditsCompleted ?? 0,
      auditsAbandoned: update.auditsAbandoned ?? 0,
      phase1Dropoff: update.phase1Dropoff ?? 0,
      phase2Dropoff: update.phase2Dropoff ?? 0,
      phase3Dropoff: update.phase3Dropoff ?? 0,
      avgPainScore: update.avgPainScore ?? null,
      avgEstimatedValue: update.avgEstimatedValue ?? null,
      leadsGenerated: update.leadsGenerated ?? 0,
      callsBooked: 0,
      proposalsSent: 0,
      projectsWon: 0,
      topOpportunities: update.topOpportunities?.map(name => ({ name, count: 1 })) || [],
    }
  });
  
  return result;
}