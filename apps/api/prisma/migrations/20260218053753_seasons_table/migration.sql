-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opponent" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonGame" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "venueType" TEXT NOT NULL,
    "gf" INTEGER NOT NULL,
    "ga" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Season_clubId_idx" ON "Season"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_clubId_name_key" ON "Season"("clubId", "name");

-- CreateIndex
CREATE INDEX "Opponent_clubId_idx" ON "Opponent"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "Opponent_clubId_name_key" ON "Opponent"("clubId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonGame_matchId_key" ON "SeasonGame"("matchId");

-- CreateIndex
CREATE INDEX "SeasonGame_clubId_idx" ON "SeasonGame"("clubId");

-- CreateIndex
CREATE INDEX "SeasonGame_seasonId_idx" ON "SeasonGame"("seasonId");

-- CreateIndex
CREATE INDEX "SeasonGame_opponentId_idx" ON "SeasonGame"("opponentId");

-- CreateIndex
CREATE INDEX "PlayerMatchStat_matchId_idx" ON "PlayerMatchStat"("matchId");

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opponent" ADD CONSTRAINT "Opponent_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonGame" ADD CONSTRAINT "SeasonGame_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonGame" ADD CONSTRAINT "SeasonGame_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonGame" ADD CONSTRAINT "SeasonGame_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "Opponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonGame" ADD CONSTRAINT "SeasonGame_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
