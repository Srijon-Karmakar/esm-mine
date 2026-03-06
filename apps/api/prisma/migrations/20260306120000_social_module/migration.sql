-- Social module storage

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SocialVisibility') THEN
    CREATE TYPE "SocialVisibility" AS ENUM ('PUBLIC');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SocialMediaType') THEN
    CREATE TYPE "SocialMediaType" AS ENUM ('IMAGE', 'VIDEO');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SocialReactionType') THEN
    CREATE TYPE "SocialReactionType" AS ENUM ('LIKE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SocialPost" (
  "id" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "authorClubId" TEXT,
  "skill" TEXT NOT NULL,
  "caption" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "visibility" "SocialVisibility" NOT NULL DEFAULT 'PUBLIC',
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SocialMedia" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "type" "SocialMediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "format" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "durationSec" DOUBLE PRECISION,
  "bytes" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SocialComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SocialReaction" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "SocialReactionType" NOT NULL DEFAULT 'LIKE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SocialMedia_postId_key" ON "SocialMedia"("postId");
CREATE UNIQUE INDEX IF NOT EXISTS "SocialReaction_postId_userId_type_key" ON "SocialReaction"("postId", "userId", "type");

CREATE INDEX IF NOT EXISTS "SocialPost_authorUserId_idx" ON "SocialPost"("authorUserId");
CREATE INDEX IF NOT EXISTS "SocialPost_authorClubId_idx" ON "SocialPost"("authorClubId");
CREATE INDEX IF NOT EXISTS "SocialPost_createdAt_idx" ON "SocialPost"("createdAt");
CREATE INDEX IF NOT EXISTS "SocialPost_visibility_isArchived_idx" ON "SocialPost"("visibility", "isArchived");

CREATE INDEX IF NOT EXISTS "SocialMedia_type_idx" ON "SocialMedia"("type");
CREATE INDEX IF NOT EXISTS "SocialMedia_createdAt_idx" ON "SocialMedia"("createdAt");

CREATE INDEX IF NOT EXISTS "SocialComment_postId_createdAt_idx" ON "SocialComment"("postId", "createdAt");
CREATE INDEX IF NOT EXISTS "SocialComment_userId_createdAt_idx" ON "SocialComment"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "SocialComment_isDeleted_idx" ON "SocialComment"("isDeleted");

CREATE INDEX IF NOT EXISTS "SocialReaction_postId_type_idx" ON "SocialReaction"("postId", "type");
CREATE INDEX IF NOT EXISTS "SocialReaction_userId_type_idx" ON "SocialReaction"("userId", "type");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SocialPost_authorUserId_fkey'
  ) THEN
    ALTER TABLE "SocialPost"
      ADD CONSTRAINT "SocialPost_authorUserId_fkey"
      FOREIGN KEY ("authorUserId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SocialPost_authorClubId_fkey'
  ) THEN
    ALTER TABLE "SocialPost"
      ADD CONSTRAINT "SocialPost_authorClubId_fkey"
      FOREIGN KEY ("authorClubId") REFERENCES "Club"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SocialMedia_postId_fkey'
  ) THEN
    ALTER TABLE "SocialMedia"
      ADD CONSTRAINT "SocialMedia_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "SocialPost"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SocialComment_postId_fkey'
  ) THEN
    ALTER TABLE "SocialComment"
      ADD CONSTRAINT "SocialComment_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "SocialPost"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SocialComment_userId_fkey'
  ) THEN
    ALTER TABLE "SocialComment"
      ADD CONSTRAINT "SocialComment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SocialReaction_postId_fkey'
  ) THEN
    ALTER TABLE "SocialReaction"
      ADD CONSTRAINT "SocialReaction_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "SocialPost"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SocialReaction_userId_fkey'
  ) THEN
    ALTER TABLE "SocialReaction"
      ADD CONSTRAINT "SocialReaction_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
