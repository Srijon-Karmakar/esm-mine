import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrimaryRole } from '@prisma/client';
import { CreateInjuryDto, UpdateInjuryDto } from './dto';

@Injectable()
export class InjuriesService {
  constructor(private prisma: PrismaService) {}

  /* ============================================================
     HELPERS
  ============================================================ */

  private async assertClubMember(userId: string, clubId: string) {
    const m = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });

    if (!m) throw new ForbiddenException('No club access');
    return m;
  }

  private assertManagerRole(primary: PrimaryRole) {
    const allowed = new Set<PrimaryRole>([
      PrimaryRole.ADMIN,
      PrimaryRole.MANAGER,
    ]);
    if (!allowed.has(primary))
      throw new ForbiddenException('Insufficient role');
  }

  /** returns null if empty/undefined, throws if invalid date */
  private parseDateOrNull(input?: string) {
    if (input === undefined) return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime()))
      throw new BadRequestException('Invalid date format');
    return d;
  }

  private normalizeBool(input: any, fallback: boolean) {
    if (typeof input === 'boolean') return input;
    if (typeof input === 'string') {
      const v = input.trim().toLowerCase();
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
    return fallback;
  }

  /* ============================================================
     CRUD
  ============================================================ */

  // ADMIN/MANAGER creates an injury record for a player (userId)
  async create(actorId: string, clubId: string, dto: CreateInjuryDto) {
    const m = await this.assertClubMember(actorId, clubId);
    this.assertManagerRole(m.primary);

    const userId = dto.userId?.trim();
    if (!userId) throw new BadRequestException('Missing userId');

    const type = dto.type?.trim();
    if (!type) throw new BadRequestException('Invalid type');

    // If severity is REQUIRED in Prisma, never send null
    const severity = dto.severity?.trim() || 'LOW';
    const description = dto.description?.trim() ?? null;

    // ✅ DON'T pass null into parseDateOrNull
    const startDate = this.parseDateOrNull(dto.startDate);
    if (!startDate) throw new BadRequestException('startDate is required');

    const endDate = this.parseDateOrNull(dto.endDate);

    if (endDate && endDate < startDate) {
      throw new BadRequestException('endDate cannot be before startDate');
    }

    const isActive = this.normalizeBool(dto.isActive, true);

    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) throw new BadRequestException('Invalid userId');

    return this.prisma.playerInjury.create({
      data: {
        clubId,
        userId,
        type,
        severity,
        description,
        startDate,
        endDate,
        isActive,
      },
    });
  }

  // any club member can view injuries
  async list(
    actorId: string,
    clubId: string,
    filters?: { userId?: string; activeOnly?: boolean },
  ) {
    await this.assertClubMember(actorId, clubId);

    const where: any = { clubId };
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.activeOnly) where.isActive = true;

    return this.prisma.playerInjury.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(actorId: string, clubId: string, injuryId: string) {
    await this.assertClubMember(actorId, clubId);

    const injury = await this.prisma.playerInjury.findFirst({
      where: { id: injuryId, clubId },
    });

    if (!injury) throw new NotFoundException('Injury not found');
    return injury;
  }

  // ADMIN/MANAGER update
  async update(
    actorId: string,
    clubId: string,
    injuryId: string,
    dto: UpdateInjuryDto,
  ) {
    const m = await this.assertClubMember(actorId, clubId);
    this.assertManagerRole(m.primary);

    const exists = await this.prisma.playerInjury.findFirst({
      where: { id: injuryId, clubId },
      select: { id: true, startDate: true, endDate: true },
    });
    if (!exists) throw new NotFoundException('Injury not found');

    // startDate is REQUIRED => if provided, must not become null

    // const parsedStart =
    //   dto.startDate === undefined ? undefined : this.parseDateOrNull(dto.startDate);

    // if (dto.startDate !== undefined && !parsedStart) {
    //   throw new BadRequestException("startDate is required");
    // }

    // const parsedEnd =
    //   dto.endDate === undefined ? undefined : this.parseDateOrNull(dto.endDate);

    // const nextStart = parsedStart === undefined ? exists.startDate : parsedStart;
    // const nextEnd = parsedEnd === undefined ? exists.endDate : parsedEnd;

    // if (nextEnd && nextEnd < nextStart) {
    //   throw new BadRequestException("endDate cannot be before startDate");
    // }

    const parsedStart =
      dto.startDate === undefined
        ? undefined
        : this.parseDateOrNull(dto.startDate);
    const parsedEnd =
      dto.endDate === undefined ? undefined : this.parseDateOrNull(dto.endDate);

    // if client sent startDate but it parsed to null => reject
    if (dto.startDate !== undefined && parsedStart === null) {
      throw new BadRequestException('startDate is required');
    }

    const baseStart = exists.startDate;
    if (!baseStart) {
      throw new BadRequestException('startDate missing in DB for this injury');
    }

    // ✅ Date guaranteed
    const nextStart: Date = parsedStart == null ? baseStart : parsedStart; // null OR undefined => baseStart

    // ✅ Date|null allowed
    const nextEnd: Date | null =
      parsedEnd === undefined ? exists.endDate : parsedEnd;

    if (nextEnd && nextEnd < nextStart) {
      throw new BadRequestException('endDate cannot be before startDate');
    }

    return this.prisma.playerInjury.update({
      where: { id: injuryId },
      data: {
        type: dto.type?.trim() ?? undefined,
        severity: dto.severity?.trim() ?? undefined,
        description: dto.description?.trim() ?? undefined,

        // only update if provided (and not null)
        startDate: parsedStart == null ? undefined : parsedStart,

        // if endDate was provided and empty => set null (to clear)
        // if not provided => leave unchanged
        endDate: parsedEnd === undefined ? undefined : parsedEnd,

        isActive:
          dto.isActive === undefined
            ? undefined
            : this.normalizeBool(dto.isActive, true),
      },
    });
  }

  // ADMIN/MANAGER delete
  async remove(actorId: string, clubId: string, injuryId: string) {
    const m = await this.assertClubMember(actorId, clubId);
    this.assertManagerRole(m.primary);

    const exists = await this.prisma.playerInjury.findFirst({
      where: { id: injuryId, clubId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Injury not found');

    return this.prisma.playerInjury.delete({ where: { id: injuryId } });
  }

  /* ============================================================
     CONVENIENCE
  ============================================================ */

  // Mark recovered quickly (no dto here)
  async markRecovered(
    actorId: string,
    clubId: string,
    injuryId: string,
    endDate?: string,
  ) {
    const m = await this.assertClubMember(actorId, clubId);
    this.assertManagerRole(m.primary);

    const exists = await this.prisma.playerInjury.findFirst({
      where: { id: injuryId, clubId },
      select: { id: true, startDate: true },
    });
    if (!exists) throw new NotFoundException('Injury not found');

    const parsedEnd = endDate ? this.parseDateOrNull(endDate) : new Date();
    if (!parsedEnd) throw new BadRequestException('Invalid endDate');

    // ensure end >= start
    // if (parsedEnd < exists.startDate) {
    //   throw new BadRequestException("endDate cannot be before startDate");
    // }

    if (!exists.startDate) {
      throw new BadRequestException('startDate missing in DB for this injury');
    }
    if (parsedEnd && parsedEnd < exists.startDate) {
      throw new BadRequestException('endDate cannot be before startDate');
    }

    return this.prisma.playerInjury.update({
      where: { id: injuryId },
      data: {
        isActive: false,
        endDate: parsedEnd,
      },
    });
  }
}
