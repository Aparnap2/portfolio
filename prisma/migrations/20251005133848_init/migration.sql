-- CreateTable
CREATE TABLE "AuditSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "currentPhase" TEXT NOT NULL DEFAULT 'discovery',
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "industry" TEXT,
    "companySize" TEXT,
    "currentSystems" JSONB,
    "acquisitionFlow" TEXT,
    "deliveryFlow" TEXT,
    "supportFlow" TEXT,
    "manualTasks" JSONB,
    "hoursPerWeek" INTEGER,
    "avgHourlyRate" INTEGER NOT NULL DEFAULT 60,
    "decisionBottlenecks" TEXT,
    "dataSilos" TEXT,
    "visibilityGaps" TEXT,
    "budgetRange" TEXT,
    "timeline" TEXT,
    "userRole" TEXT,
    "name" TEXT,
    "email" TEXT,
    "company" TEXT,
    "phone" TEXT,
    "calendlyBooked" BOOLEAN NOT NULL DEFAULT false,
    "painScore" INTEGER,
    "estimatedValue" INTEGER,
    "roadmap" JSONB,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "convertedAt" TIMESTAMP(3),
    "projectId" TEXT,
    "timeToComplete" INTEGER,
    "dropoffPhase" TEXT,

    CONSTRAINT "AuditSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditOpportunity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "solutionDescription" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "hoursSavedPerMonth" INTEGER NOT NULL,
    "monthlySavings" INTEGER NOT NULL,
    "errorReduction" INTEGER,
    "devCostMin" INTEGER NOT NULL,
    "devCostMax" INTEGER NOT NULL,
    "devCostMid" INTEGER NOT NULL,
    "implementationWeeks" INTEGER NOT NULL,
    "breakevenMonths" DOUBLE PRECISION NOT NULL,
    "roi12Months" INTEGER NOT NULL,
    "roi36Months" INTEGER,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "painPointsMatched" JSONB NOT NULL,
    "systemsRequired" JSONB NOT NULL,

    CONSTRAINT "AuditOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityTemplate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "problemItSolves" TEXT NOT NULL,
    "avgDevCostMin" INTEGER NOT NULL,
    "avgDevCostMax" INTEGER NOT NULL,
    "avgTimeSavedHrsMonth" INTEGER NOT NULL,
    "avgErrorReduction" INTEGER,
    "avgImplementationWeeks" INTEGER NOT NULL,
    "complexity" TEXT NOT NULL,
    "matchingRules" JSONB NOT NULL,
    "techStack" JSONB NOT NULL,
    "integrationsRequired" JSONB NOT NULL,
    "exampleWorkflow" TEXT,
    "realWorldExample" TEXT,
    "timesMatched" INTEGER NOT NULL DEFAULT 0,
    "avgClientSatisfaction" DOUBLE PRECISION,

    CONSTRAINT "OpportunityTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "auditSessionId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "painScore" INTEGER,
    "estimatedValue" INTEGER,
    "timeline" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "calendlyBooked" BOOLEAN NOT NULL DEFAULT false,
    "calendlyUrl" TEXT,
    "firstContactDate" TIMESTAMP(3),
    "lastContactDate" TIMESTAMP(3),
    "convertedToProject" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT,
    "conversionDate" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subject" TEXT,
    "content" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "discordMessageId" TEXT,
    "emailMessageId" TEXT,
    "hubspotDealId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditsStarted" INTEGER NOT NULL DEFAULT 0,
    "auditsCompleted" INTEGER NOT NULL DEFAULT 0,
    "auditsAbandoned" INTEGER NOT NULL DEFAULT 0,
    "phase1Dropoff" INTEGER NOT NULL DEFAULT 0,
    "phase2Dropoff" INTEGER NOT NULL DEFAULT 0,
    "phase3Dropoff" INTEGER NOT NULL DEFAULT 0,
    "avgTimeToComplete" INTEGER,
    "avgPainScore" DOUBLE PRECISION,
    "avgEstimatedValue" INTEGER,
    "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
    "callsBooked" INTEGER NOT NULL DEFAULT 0,
    "proposalsSent" INTEGER NOT NULL DEFAULT 0,
    "projectsWon" INTEGER NOT NULL DEFAULT 0,
    "topOpportunities" JSONB NOT NULL,

    CONSTRAINT "AuditAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditSession_sessionId_key" ON "AuditSession"("sessionId");

-- CreateIndex
CREATE INDEX "AuditSession_email_idx" ON "AuditSession"("email");

-- CreateIndex
CREATE INDEX "AuditSession_status_idx" ON "AuditSession"("status");

-- CreateIndex
CREATE INDEX "AuditSession_createdAt_idx" ON "AuditSession"("createdAt");

-- CreateIndex
CREATE INDEX "AuditSession_painScore_idx" ON "AuditSession"("painScore");

-- CreateIndex
CREATE INDEX "AuditSession_sessionId_idx" ON "AuditSession"("sessionId");

-- CreateIndex
CREATE INDEX "AuditOpportunity_sessionId_idx" ON "AuditOpportunity"("sessionId");

-- CreateIndex
CREATE INDEX "AuditOpportunity_rank_idx" ON "AuditOpportunity"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityTemplate_slug_key" ON "OpportunityTemplate"("slug");

-- CreateIndex
CREATE INDEX "OpportunityTemplate_category_idx" ON "OpportunityTemplate"("category");

-- CreateIndex
CREATE INDEX "OpportunityTemplate_difficulty_idx" ON "OpportunityTemplate"("difficulty");

-- CreateIndex
CREATE INDEX "OpportunityTemplate_slug_idx" ON "OpportunityTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_auditSessionId_key" ON "Lead"("auditSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_painScore_idx" ON "Lead"("painScore");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_leadId_idx" ON "Notification"("leadId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "AuditAnalytics_date_idx" ON "AuditAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AuditAnalytics_date_key" ON "AuditAnalytics"("date");

-- AddForeignKey
ALTER TABLE "AuditOpportunity" ADD CONSTRAINT "AuditOpportunity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AuditSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditOpportunity" ADD CONSTRAINT "AuditOpportunity_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OpportunityTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
