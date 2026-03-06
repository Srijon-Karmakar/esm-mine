DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Club"
ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN IF NOT EXISTS "subscriptionMonthlyPrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "subscriptionStartAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscriptionNextBillingAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "ClubRoleSetting" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "roleKey" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubRoleSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClubRoleSetting_clubId_roleKey_key" ON "ClubRoleSetting"("clubId", "roleKey");
CREATE INDEX IF NOT EXISTS "ClubRoleSetting_clubId_idx" ON "ClubRoleSetting"("clubId");

DO $$ BEGIN
  ALTER TABLE "ClubRoleSetting"
  ADD CONSTRAINT "ClubRoleSetting_clubId_fkey"
  FOREIGN KEY ("clubId")
  REFERENCES "Club"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
