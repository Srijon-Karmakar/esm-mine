-- CreateEnum
CREATE TYPE "ScheduleEventType" AS ENUM ('TRAINING', 'MATCH');

-- AlterTable
ALTER TABLE "SocialPost" ALTER COLUMN "tags" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ScheduleEvent" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "type" "ScheduleEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "targetGroups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "privateToUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleEvent_clubId_idx" ON "ScheduleEvent"("clubId");

-- CreateIndex
CREATE INDEX "ScheduleEvent_createdByUserId_idx" ON "ScheduleEvent"("createdByUserId");

-- CreateIndex
CREATE INDEX "ScheduleEvent_type_idx" ON "ScheduleEvent"("type");

-- AddForeignKey
ALTER TABLE "ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
