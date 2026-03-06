-- CreateTable
CREATE TABLE "PlayerInjury" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerInjury_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerInjury_clubId_idx" ON "PlayerInjury"("clubId");

-- CreateIndex
CREATE INDEX "PlayerInjury_userId_idx" ON "PlayerInjury"("userId");

-- AddForeignKey
ALTER TABLE "PlayerInjury" ADD CONSTRAINT "PlayerInjury_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerInjury" ADD CONSTRAINT "PlayerInjury_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
