ALTER TABLE "PlayerProfile"
ADD COLUMN "wellnessStatus" TEXT,
ADD COLUMN "readinessScore" INTEGER,
ADD COLUMN "energyLevel" INTEGER,
ADD COLUMN "sorenessLevel" INTEGER,
ADD COLUMN "sleepHours" DOUBLE PRECISION,
ADD COLUMN "healthNotes" TEXT,
ADD COLUMN "healthUpdatedAt" TIMESTAMP(3);
