/*
  Warnings:

  - You are about to drop the column `note` on the `MatchEvent` table. All the data in the column will be lost.
  - Added the required column `clubId` to the `MatchEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MatchEvent" DROP COLUMN "note",
ADD COLUMN     "clubId" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "team" TEXT;
