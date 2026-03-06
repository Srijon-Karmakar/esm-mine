-- CreateEnum
CREATE TYPE "LineupSide" AS ENUM ('HOME', 'AWAY');

-- CreateEnum
CREATE TYPE "LineupSlot" AS ENUM ('STARTING', 'BENCH');

-- CreateTable
CREATE TABLE "MatchLineup" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "side" "LineupSide" NOT NULL,
    "formation" TEXT,
    "captainUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchLineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchLineupPlayer" (
    "id" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slot" "LineupSlot" NOT NULL,
    "jerseyNo" INTEGER,
    "position" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchLineupPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchLineup_clubId_idx" ON "MatchLineup"("clubId");

-- CreateIndex
CREATE INDEX "MatchLineup_matchId_idx" ON "MatchLineup"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchLineup_matchId_side_key" ON "MatchLineup"("matchId", "side");

-- CreateIndex
CREATE INDEX "MatchLineupPlayer_lineupId_idx" ON "MatchLineupPlayer"("lineupId");

-- CreateIndex
CREATE INDEX "MatchLineupPlayer_userId_idx" ON "MatchLineupPlayer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchLineupPlayer_lineupId_userId_key" ON "MatchLineupPlayer"("lineupId", "userId");

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineupPlayer" ADD CONSTRAINT "MatchLineupPlayer_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "MatchLineup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineupPlayer" ADD CONSTRAINT "MatchLineupPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
