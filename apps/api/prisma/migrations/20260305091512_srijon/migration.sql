/*
  Warnings:

  - Made the column `startDate` on table `PlayerInjury` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PlayerInjury" ALTER COLUMN "startDate" SET NOT NULL;
