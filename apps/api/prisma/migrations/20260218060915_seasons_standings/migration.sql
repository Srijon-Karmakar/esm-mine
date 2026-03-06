/*
  Warnings:

  - You are about to drop the column `endDate` on the `Season` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Season` table. All the data in the column will be lost.
  - Added the required column `startAt` to the `Season` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Season" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "SeasonTeam" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SeasonTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonMatch" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,

    CONSTRAINT "SeasonMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonStanding" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "draw" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDiff" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonStanding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeasonTeam_seasonId_idx" ON "SeasonTeam"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonTeam_seasonId_name_key" ON "SeasonTeam"("seasonId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonMatch_matchId_key" ON "SeasonMatch"("matchId");

-- CreateIndex
CREATE INDEX "SeasonMatch_seasonId_idx" ON "SeasonMatch"("seasonId");

-- CreateIndex
CREATE INDEX "SeasonStanding_seasonId_idx" ON "SeasonStanding"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonStanding_seasonId_teamId_key" ON "SeasonStanding"("seasonId", "teamId");

-- AddForeignKey
ALTER TABLE "SeasonTeam" ADD CONSTRAINT "SeasonTeam_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonMatch" ADD CONSTRAINT "SeasonMatch_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonMatch" ADD CONSTRAINT "SeasonMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonMatch" ADD CONSTRAINT "SeasonMatch_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "SeasonTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonMatch" ADD CONSTRAINT "SeasonMatch_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "SeasonTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonStanding" ADD CONSTRAINT "SeasonStanding_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonStanding" ADD CONSTRAINT "SeasonStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SeasonTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
