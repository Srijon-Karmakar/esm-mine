-- Add user-bound invitation support for assignment workflow.
ALTER TABLE "Invitation"
ADD COLUMN "userId" TEXT;

-- Backfill existing rows where email already matches a known user.
UPDATE "Invitation" AS i
SET "userId" = u."id"
FROM "User" AS u
WHERE i."userId" IS NULL
  AND lower(i."email") = lower(u."email");

CREATE INDEX "Invitation_userId_idx" ON "Invitation"("userId");

ALTER TABLE "Invitation"
ADD CONSTRAINT "Invitation_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
