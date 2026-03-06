-- CreateEnum
CREATE TYPE "ClubTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ClubTaskStatus" AS ENUM ('OPEN', 'PENDING', 'DONE');

-- CreateTable
CREATE TABLE "ClubTask" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "ClubTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ClubTaskStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMessage" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'default',
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClubTask_clubId_idx" ON "ClubTask"("clubId");

-- CreateIndex
CREATE INDEX "ClubTask_assignedToUserId_idx" ON "ClubTask"("assignedToUserId");

-- CreateIndex
CREATE INDEX "ClubTask_status_idx" ON "ClubTask"("status");

-- CreateIndex
CREATE INDEX "ClubMessage_clubId_idx" ON "ClubMessage"("clubId");

-- CreateIndex
CREATE INDEX "ClubMessage_isActive_idx" ON "ClubMessage"("isActive");

-- CreateIndex
CREATE INDEX "ClubMessage_createdAt_idx" ON "ClubMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "ClubTask" ADD CONSTRAINT "ClubTask_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTask" ADD CONSTRAINT "ClubTask_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTask" ADD CONSTRAINT "ClubTask_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMessage" ADD CONSTRAINT "ClubMessage_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMessage" ADD CONSTRAINT "ClubMessage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

