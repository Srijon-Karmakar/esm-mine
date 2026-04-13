-- CreateEnum
CREATE TYPE "DashboardAnalyticsCategory" AS ENUM ('MATCH', 'PLAYER', 'CLUB');

-- CreateTable
CREATE TABLE "DashboardAnalyticsEntry" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "category" "DashboardAnalyticsCategory" NOT NULL,
    "subjectLabel" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "metrics" JSONB NOT NULL,
    "performanceIndex" DOUBLE PRECISION NOT NULL,
    "readinessIndex" DOUBLE PRECISION NOT NULL,
    "momentumIndex" DOUBLE PRECISION NOT NULL,
    "dataCompleteness" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardAnalyticsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DashboardAnalyticsEntry_clubId_recordedAt_idx" ON "DashboardAnalyticsEntry"("clubId", "recordedAt");

-- CreateIndex
CREATE INDEX "DashboardAnalyticsEntry_clubId_category_recordedAt_idx" ON "DashboardAnalyticsEntry"("clubId", "category", "recordedAt");

-- CreateIndex
CREATE INDEX "DashboardAnalyticsEntry_createdByUserId_idx" ON "DashboardAnalyticsEntry"("createdByUserId");

-- AddForeignKey
ALTER TABLE "DashboardAnalyticsEntry" ADD CONSTRAINT "DashboardAnalyticsEntry_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardAnalyticsEntry" ADD CONSTRAINT "DashboardAnalyticsEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
