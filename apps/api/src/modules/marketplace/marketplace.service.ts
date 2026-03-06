import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMarketplaceOfferDto,
  MarketplaceBrowseQueryDto,
  UpsertMarketplaceListingDto,
} from './dto';

type ListingView = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  headline: string;
  bio: string | null;
  positions: string[];
  nationality: string | null;
  expectedSalary: number | null;
  openToOffers: boolean;
  createdAt: string;
  offerCount: number;
};

function normalizePosition(raw?: string | null) {
  return String(raw || '')
    .trim()
    .toUpperCase();
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  private async withStorageGuard<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const code = String(error?.code || '');
      const message = String(error?.message || '');
      const isSchemaIssue =
        code === 'P2021' || // table does not exist
        code === 'P2022' || // column does not exist
        message.includes('MarketplaceListing') ||
        message.includes('MarketplaceOffer');

      if (isSchemaIssue) {
        throw new ServiceUnavailableException(
          'Marketplace storage is not ready. Run Prisma migrate/db push and generate in apps/api, then restart API.',
        );
      }
      throw error;
    }
  }

  private listingRepo() {
    const repo = (this.prisma as any).marketplaceListing;
    if (!repo) {
      throw new ServiceUnavailableException(
        'Marketplace database models are not initialized. Run Prisma migrate and generate for the API app.',
      );
    }
    return repo;
  }

  private offerRepo() {
    const repo = (this.prisma as any).marketplaceOffer;
    if (!repo) {
      throw new ServiceUnavailableException(
        'Marketplace database models are not initialized. Run Prisma migrate and generate for the API app.',
      );
    }
    return repo;
  }

  private isRecruiterRole(primary: string, subRoles: string[]) {
    if (primary === 'ADMIN' || primary === 'MANAGER') return true;
    return subRoles.includes('AGENT');
  }

  private async getMembership(userId: string, clubId: string) {
    return this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { userId: true, clubId: true, primary: true, subRoles: true },
    });
  }

  private async getAnyMembership(userId: string) {
    return this.prisma.membership.findFirst({
      where: { userId },
      select: { clubId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async reconcileListingsForUsers(userIds: string[]) {
    if (!userIds.length) return;

    const listings = await this.listingRepo().findMany({
      where: {
        userId: { in: userIds },
        status: 'ACTIVE',
      },
      select: { id: true, userId: true },
    });
    if (!listings.length) return;

    const memberships = await this.prisma.membership.findMany({
      where: { userId: { in: listings.map((row: any) => row.userId) } },
      select: { userId: true, clubId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const clubByUser = new Map<string, string>();
    for (const row of memberships) {
      if (!clubByUser.has(row.userId)) clubByUser.set(row.userId, row.clubId);
    }

    await Promise.all(
      listings
        .filter((listing: any) => clubByUser.has(listing.userId))
        .map((listing: any) =>
          this.listingRepo().update({
            where: { id: listing.id },
            data: {
              status: 'HIRED',
              openToOffers: false,
              hiredClubId: clubByUser.get(listing.userId),
              hiredAt: new Date(),
            },
          }),
        ),
    );
  }

  private async reconcileAllActiveListings() {
    const active = await this.listingRepo().findMany({
      where: { status: 'ACTIVE' },
      select: { userId: true },
    });
    await this.reconcileListingsForUsers(active.map((row: any) => row.userId));
  }

  private mapListing(row: any): ListingView {
    const profilePositions = Array.isArray(row?.user?.playerProfile?.positions)
      ? row.user.playerProfile.positions
      : [];
    const listingPositions = Array.isArray(row?.positions) ? row.positions : [];
    const positions = uniq(
      [...listingPositions, ...profilePositions]
        .map((value) => normalizePosition(value))
        .filter(Boolean),
    );

    return {
      id: row.id,
      userId: row.userId,
      fullName: row.user?.fullName || row.user?.email || row.userId,
      email: row.user?.email || '',
      headline: row.headline,
      bio: row.bio || null,
      positions,
      nationality: row.nationality || row.user?.playerProfile?.nationality || null,
      expectedSalary:
        typeof row.expectedSalary === 'number' ? Number(row.expectedSalary) : null,
      openToOffers: row.openToOffers !== false,
      createdAt: row.createdAt?.toISOString?.() || new Date().toISOString(),
      offerCount: Number(row?._count?.offers || 0),
    };
  }

  private applyListingFilters(rows: ListingView[], query: MarketplaceBrowseQueryDto) {
    const search = String(query.search || '')
      .trim()
      .toLowerCase();
    const wantedPosition = normalizePosition(query.position);

    return rows.filter((row) => {
      if (search) {
        const haystack = `${row.fullName} ${row.email} ${row.headline} ${row.positions.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (wantedPosition) {
        const matched = row.positions.some((item) => normalizePosition(item) === wantedPosition);
        if (!matched) return false;
      }
      return true;
    });
  }

  private sortListings(rows: ListingView[], query: MarketplaceBrowseQueryDto) {
    const sortBy = query.sortBy || 'createdAt';
    const sortDir = query.sortDir || 'desc';
    const sign = sortDir === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
      let left: number | string = 0;
      let right: number | string = 0;
      if (sortBy === 'salary') {
        left = a.expectedSalary ?? 0;
        right = b.expectedSalary ?? 0;
      } else if (sortBy === 'name') {
        left = a.fullName.toLowerCase();
        right = b.fullName.toLowerCase();
      } else {
        left = new Date(a.createdAt).getTime();
        right = new Date(b.createdAt).getTime();
      }

      if (left < right) return -1 * sign;
      if (left > right) return 1 * sign;
      return 0;
    });
  }

  async listings(_userId: string, query: MarketplaceBrowseQueryDto) {
    return this.withStorageGuard(async () => {
      await this.reconcileAllActiveListings();

      const rows = await this.listingRepo().findMany({
        where: {
          status: 'ACTIVE',
          openToOffers: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              playerProfile: {
                select: {
                  positions: true,
                  nationality: true,
                },
              },
            },
          },
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const mapped = rows.map((row: any) => this.mapListing(row));
      const filtered = this.applyListingFilters(mapped, query);
      const sorted = this.sortListings(filtered, query);
      const limit = clamp(query.limit || 30, 1, 100);
      const listings = sorted.slice(0, limit);
      const positions = uniq(
        sorted
          .flatMap((row) => row.positions)
          .map((v) => normalizePosition(v)),
      ).sort();

      return {
        count: filtered.length,
        limit,
        availablePositions: positions,
        listings,
      };
    });
  }

  async myListing(userId: string) {
    return this.withStorageGuard(async () => {
      await this.reconcileListingsForUsers([userId]);

      const membership = await this.getAnyMembership(userId);
      const listing = await this.listingRepo().findUnique({
        where: { userId },
      });

      return {
        hasClubMembership: !!membership,
        listing: listing || null,
      };
    });
  }

  async upsertMyListing(userId: string, dto: UpsertMarketplaceListingDto) {
    return this.withStorageGuard(async () => {
      const membership = await this.getAnyMembership(userId);
      if (membership) {
        throw new ForbiddenException(
          'Only players without a club can create or update marketplace listing',
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          playerProfile: {
            select: { positions: true, nationality: true },
          },
        },
      });
      if (!user) throw new NotFoundException('User not found');

      const profilePositions = Array.isArray(user?.playerProfile?.positions)
        ? user.playerProfile.positions
        : [];
      const desiredPositions = Array.isArray(dto.positions) ? dto.positions : [];
      const positions = uniq(
        [...desiredPositions, ...profilePositions]
          .map((value) => normalizePosition(value))
          .filter(Boolean),
      );

      const listing = await this.listingRepo().upsert({
        where: { userId },
        create: {
          userId,
          headline: dto.headline.trim(),
          bio: dto.bio?.trim() || null,
          positions,
          nationality: dto.nationality?.trim() || user?.playerProfile?.nationality || null,
          expectedSalary:
            typeof dto.expectedSalary === 'number'
              ? Math.max(0, Math.trunc(dto.expectedSalary))
              : null,
          openToOffers: dto.openToOffers !== false,
          status: 'ACTIVE',
        },
        update: {
          headline: dto.headline.trim(),
          bio: dto.bio?.trim() || null,
          positions,
          nationality: dto.nationality?.trim() || user?.playerProfile?.nationality || null,
          expectedSalary:
            typeof dto.expectedSalary === 'number'
              ? Math.max(0, Math.trunc(dto.expectedSalary))
              : null,
          openToOffers: dto.openToOffers !== false,
          status: 'ACTIVE',
          hiredAt: null,
          hiredClubId: null,
        },
      });

      return { listing };
    });
  }

  async myOffers(userId: string) {
    await this.reconcileListingsForUsers([userId]);

    const listing = await this.listingRepo().findUnique({
      where: { userId },
      select: { id: true, status: true, openToOffers: true, headline: true },
    });
    if (!listing) {
      return { listing: null, offers: [] };
    }

    const offers = await this.offerRepo().findMany({
      where: { listingId: listing.id },
      orderBy: { createdAt: 'desc' },
      include: {
        recruiter: {
          select: { id: true, email: true, fullName: true },
        },
        recruiterClub: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return {
      listing,
      offers: offers.map((offer: any) => ({
        id: offer.id,
        message: offer.message,
        offeredSalary: offer.offeredSalary,
        status: offer.status,
        createdAt: offer.createdAt,
        respondedAt: offer.respondedAt,
        recruiter: offer.recruiter,
        recruiterClub: offer.recruiterClub,
      })),
    };
  }

  async sendOffer(userId: string, listingId: string, dto: CreateMarketplaceOfferDto) {
    await this.reconcileAllActiveListings();

    const listing = await this.listingRepo().findUnique({
      where: { id: listingId },
      select: {
        id: true,
        userId: true,
        status: true,
        openToOffers: true,
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId === userId) {
      throw new BadRequestException('You cannot send offer to your own listing');
    }
    if (listing.status !== 'ACTIVE' || listing.openToOffers === false) {
      throw new BadRequestException('Listing is not open for offers');
    }

    const listingOwnerMembership = await this.getAnyMembership(listing.userId);
    if (listingOwnerMembership) {
      await this.listingRepo().update({
        where: { id: listing.id },
        data: {
          status: 'HIRED',
          openToOffers: false,
          hiredClubId: listingOwnerMembership.clubId,
          hiredAt: new Date(),
        },
      });
      throw new BadRequestException('Player is already assigned to a club');
    }

    const recruiterMembership = await this.getMembership(userId, dto.clubId);
    if (!recruiterMembership) throw new ForbiddenException('No access to recruiter club');
    if (
      !this.isRecruiterRole(
        String(recruiterMembership.primary || ''),
        Array.isArray(recruiterMembership.subRoles) ? recruiterMembership.subRoles : [],
      )
    ) {
      throw new ForbiddenException('Only ADMIN, MANAGER, or AGENT can send offers');
    }

    const existingPending = await this.offerRepo().findFirst({
      where: {
        listingId,
        recruiterClubId: dto.clubId,
        status: 'PENDING',
      },
      select: { id: true },
    });
    if (existingPending) {
      throw new BadRequestException('You already have a pending offer for this listing');
    }

    const offer = await this.offerRepo().create({
      data: {
        listingId,
        recruiterUserId: userId,
        recruiterClubId: dto.clubId,
        message: dto.message.trim(),
        offeredSalary:
          typeof dto.offeredSalary === 'number' ? Math.max(0, Math.trunc(dto.offeredSalary)) : null,
      },
    });

    return { offer };
  }

  async recruiterOffers(userId: string, clubId?: string) {
    const scopedClubId = String(clubId || '').trim();
    if (scopedClubId) {
      const membership = await this.getMembership(userId, scopedClubId);
      if (!membership) throw new ForbiddenException('No access to recruiter club');
      if (
        !this.isRecruiterRole(
          String(membership.primary || ''),
          Array.isArray(membership.subRoles) ? membership.subRoles : [],
        )
      ) {
        throw new ForbiddenException('Only ADMIN, MANAGER, or AGENT can view recruiter offers');
      }
    }

    const offers = await this.offerRepo().findMany({
      where: {
        recruiterUserId: userId,
        ...(scopedClubId ? { recruiterClubId: scopedClubId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        },
        recruiterClub: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return {
      offers: offers.map((offer: any) => ({
        id: offer.id,
        status: offer.status,
        message: offer.message,
        offeredSalary: offer.offeredSalary,
        createdAt: offer.createdAt,
        respondedAt: offer.respondedAt,
        listing: {
          id: offer.listing?.id,
          headline: offer.listing?.headline,
          player: offer.listing?.user
            ? {
                id: offer.listing.user.id,
                email: offer.listing.user.email,
                fullName: offer.listing.user.fullName,
              }
            : null,
        },
        recruiterClub: offer.recruiterClub,
      })),
    };
  }

  async acceptOffer(userId: string, offerId: string) {
    await this.reconcileListingsForUsers([userId]);

    const offer = await this.offerRepo().findUnique({
      where: { id: offerId },
      include: {
        listing: {
          select: {
            id: true,
            userId: true,
            status: true,
            openToOffers: true,
          },
        },
      },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (!offer.listing || offer.listing.userId !== userId) {
      throw new ForbiddenException('Offer does not belong to current player');
    }
    if (offer.status !== 'PENDING') {
      throw new BadRequestException('Offer is already finalized');
    }

    const existingMembership = await this.getAnyMembership(userId);
    if (existingMembership) {
      await this.listingRepo().update({
        where: { id: offer.listing.id },
        data: {
          status: 'HIRED',
          openToOffers: false,
          hiredClubId: existingMembership.clubId,
          hiredAt: new Date(),
        },
      });
      throw new BadRequestException('Player is already assigned to a club');
    }

    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: {
          userId,
          clubId: offer.recruiterClubId,
          primary: 'PLAYER',
          subRoles: [],
        },
        select: { id: true, userId: true, clubId: true, primary: true, subRoles: true },
      });

      await (tx as any).marketplaceOffer.update({
        where: { id: offerId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: now,
          respondedAt: now,
        },
      });

      await (tx as any).marketplaceOffer.updateMany({
        where: {
          listingId: offer.listing.id,
          status: 'PENDING',
          id: { not: offerId },
        },
        data: {
          status: 'REJECTED',
          respondedAt: now,
        },
      });

      await (tx as any).marketplaceListing.update({
        where: { id: offer.listing.id },
        data: {
          status: 'HIRED',
          openToOffers: false,
          hiredClubId: offer.recruiterClubId,
          hiredAt: now,
        },
      });

      return membership;
    });

    return {
      ok: true,
      membership: result,
      hiredClubId: offer.recruiterClubId,
    };
  }

  async rejectOffer(userId: string, offerId: string) {
    const offer = await this.offerRepo().findUnique({
      where: { id: offerId },
      include: { listing: { select: { userId: true } } },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (!offer.listing || offer.listing.userId !== userId) {
      throw new ForbiddenException('Offer does not belong to current player');
    }
    if (offer.status !== 'PENDING') {
      throw new BadRequestException('Offer is already finalized');
    }

    const updated = await this.offerRepo().update({
      where: { id: offerId },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    return { offer: updated };
  }
}
