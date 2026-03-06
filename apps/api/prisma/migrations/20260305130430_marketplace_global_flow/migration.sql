-- CreateEnum
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('ACTIVE', 'HIRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MarketplaceOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT,
    "positions" TEXT[],
    "nationality" TEXT,
    "expectedSalary" INTEGER,
    "openToOffers" BOOLEAN NOT NULL DEFAULT true,
    "status" "MarketplaceListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "hiredClubId" TEXT,
    "hiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceOffer" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "recruiterUserId" TEXT NOT NULL,
    "recruiterClubId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "offeredSalary" INTEGER,
    "status" "MarketplaceOfferStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListing_userId_key" ON "MarketplaceListing"("userId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_idx" ON "MarketplaceListing"("status");

-- CreateIndex
CREATE INDEX "MarketplaceListing_openToOffers_idx" ON "MarketplaceListing"("openToOffers");

-- CreateIndex
CREATE INDEX "MarketplaceListing_hiredClubId_idx" ON "MarketplaceListing"("hiredClubId");

-- CreateIndex
CREATE INDEX "MarketplaceOffer_listingId_idx" ON "MarketplaceOffer"("listingId");

-- CreateIndex
CREATE INDEX "MarketplaceOffer_recruiterClubId_idx" ON "MarketplaceOffer"("recruiterClubId");

-- CreateIndex
CREATE INDEX "MarketplaceOffer_recruiterUserId_idx" ON "MarketplaceOffer"("recruiterUserId");

-- CreateIndex
CREATE INDEX "MarketplaceOffer_status_idx" ON "MarketplaceOffer"("status");

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_hiredClubId_fkey" FOREIGN KEY ("hiredClubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOffer" ADD CONSTRAINT "MarketplaceOffer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOffer" ADD CONSTRAINT "MarketplaceOffer_recruiterUserId_fkey" FOREIGN KEY ("recruiterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOffer" ADD CONSTRAINT "MarketplaceOffer_recruiterClubId_fkey" FOREIGN KEY ("recruiterClubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
