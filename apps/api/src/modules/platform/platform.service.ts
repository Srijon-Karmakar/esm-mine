import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpdatePlatformAdminDto,
  UpdatePlatformClubDto,
  UpdateRoleSettingDto,
} from './dto';

const ROLE_CATALOG = [
  'MEMBER',
  'PLAYER',
  'MANAGER',
  'ADMIN',
  'COACH',
  'PHYSIO',
  'AGENT',
  'NUTRITIONIST',
  'PITCH_MANAGER',
  'CAPTAIN',
] as const;

type RoleKey = (typeof ROLE_CATALOG)[number];

@Injectable()
export class PlatformService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private normalizeEmail(value: string) {
    return String(value || '').toLowerCase().trim();
  }

  private normalizeRoleKey(value: string): RoleKey {
    const roleKey = String(value || '').toUpperCase().trim();
    if (!ROLE_CATALOG.includes(roleKey as RoleKey)) {
      throw new BadRequestException(`Unsupported role key '${value}'`);
    }
    return roleKey as RoleKey;
  }

  private getAllowlistedPlatformAdmins() {
    const raw = this.config.get<string>('PLATFORM_ADMIN_EMAILS') || '';
    return new Set(
      raw
        .split(',')
        .map((v) => this.normalizeEmail(v))
        .filter(Boolean),
    );
  }

  private normalizeClubRecord(club: any) {
    const monthlyPrice = Number(club.subscriptionMonthlyPrice || 0);
    const subscriptionStatus = String(club.subscriptionStatus || 'TRIAL').toUpperCase();
    const roleSettings = Array.isArray(club.roleSettings) ? club.roleSettings : [];

    return {
      id: club.id,
      name: club.name,
      slug: club.slug,
      isActive: club.isActive !== false,
      aiEnabled: club.aiEnabled !== false,
      marketplaceEnabled: club.marketplaceEnabled !== false,
      socialEnabled: club.socialEnabled !== false,
      billingPlan: String(club.billingPlan || 'FREE').toUpperCase(),
      subscriptionStatus,
      subscriptionMonthlyPrice: monthlyPrice,
      subscriptionStartAt: club.subscriptionStartAt ?? null,
      subscriptionNextBillingAt: club.subscriptionNextBillingAt ?? null,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      memberCount: Number(club?._count?.memberships || 0),
      adminCount: Number(
        Array.isArray(club?.memberships)
          ? club.memberships.filter((m: any) => m?.primary === 'ADMIN').length
          : 0,
      ),
      disabledRoleCount: roleSettings.filter((row: any) => row?.isEnabled === false)
        .length,
      estimatedMrr:
        subscriptionStatus === 'ACTIVE' && club.isActive !== false ? monthlyPrice : 0,
    };
  }

  private buildRoleMatrix(roleSettings: any[]) {
    const map = new Map<string, any>(
      (Array.isArray(roleSettings) ? roleSettings : []).map((row: any) => [
        String(row.roleKey || '').toUpperCase(),
        row,
      ]),
    );

    return ROLE_CATALOG.map((roleKey) => {
      const row = map.get(roleKey);
      const isPrimary = ['MEMBER', 'PLAYER', 'MANAGER', 'ADMIN'].includes(roleKey);
      return {
        roleKey,
        roleType: isPrimary ? 'PRIMARY' : 'SUBROLE',
        isEnabled: row?.isEnabled !== false,
        updatedAt: row?.updatedAt ?? null,
      };
    });
  }

  private async loadClubsWithPlatformFields() {
    const clubs = await (this.prisma as any).club.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: { select: { primary: true } },
        roleSettings: { select: { roleKey: true, isEnabled: true, updatedAt: true } },
        _count: { select: { memberships: true } },
      },
    });
    return clubs.map((club: any) => this.normalizeClubRecord(club));
  }

  async overview() {
    const [usersTotal, membershipsTotal, clubs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.membership.count(),
      this.loadClubsWithPlatformFields(),
    ]);

    const primaryBreakdownRows = await this.prisma.membership.groupBy({
      by: ['primary'],
      _count: { _all: true },
    });

    const primaryBreakdown = primaryBreakdownRows.reduce(
      (acc, row) => {
        acc[row.primary] = row._count._all;
        return acc;
      },
      {} as Record<string, number>,
    );

    const clubsActive = clubs.filter((club: any) => club.isActive).length;
    const clubsInactive = clubs.length - clubsActive;
    const trialSubscriptions = clubs.filter(
      (club: any) => club.subscriptionStatus === 'TRIAL',
    ).length;
    const activeSubscriptions = clubs.filter(
      (club: any) => club.subscriptionStatus === 'ACTIVE',
    ).length;
    const pastDueSubscriptions = clubs.filter(
      (club: any) => club.subscriptionStatus === 'PAST_DUE',
    ).length;
    const canceledSubscriptions = clubs.filter(
      (club: any) => club.subscriptionStatus === 'CANCELED',
    ).length;
    const estimatedMrr = clubs.reduce(
      (sum, club: any) => sum + Number(club.estimatedMrr || 0),
      0,
    );

    let dbPlatformAdmins = 0;
    try {
      dbPlatformAdmins = await (this.prisma as any).user.count({
        where: { isPlatformAdmin: true },
      });
    } catch {
      dbPlatformAdmins = 0;
    }

    return {
      totals: {
        users: usersTotal,
        memberships: membershipsTotal,
        clubs: clubs.length,
        activeClubs: clubsActive,
        inactiveClubs: clubsInactive,
        platformAdmins: Math.max(
          dbPlatformAdmins,
          this.getAllowlistedPlatformAdmins().size,
        ),
        activeSubscriptions,
        trialSubscriptions,
        pastDueSubscriptions,
        canceledSubscriptions,
        estimatedMrr,
      },
      membershipsByPrimary: primaryBreakdown,
    };
  }

  async clubs() {
    const clubs = await this.loadClubsWithPlatformFields();
    return { clubs };
  }

  async roleMatrix(clubId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, slug: true },
    });
    if (!club) throw new NotFoundException('Club not found');

    const rows = await (this.prisma as any).clubRoleSetting.findMany({
      where: { clubId },
      orderBy: { roleKey: 'asc' },
    });

    return {
      club,
      roles: this.buildRoleMatrix(rows),
    };
  }

  async updateRoleSetting(
    clubId: string,
    roleKeyInput: string,
    dto: UpdateRoleSettingDto,
  ) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });
    if (!club) throw new NotFoundException('Club not found');

    const roleKey = this.normalizeRoleKey(roleKeyInput);

    await (this.prisma as any).clubRoleSetting.upsert({
      where: { clubId_roleKey: { clubId, roleKey } },
      create: { clubId, roleKey, isEnabled: !!dto.isEnabled },
      update: { isEnabled: !!dto.isEnabled },
    });

    return this.roleMatrix(clubId);
  }

  async updateClub(clubId: string, dto: UpdatePlatformClubDto) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('No platform fields provided');
    }

    const data: Record<string, unknown> = {};
    if (typeof dto.isActive === 'boolean') data.isActive = dto.isActive;
    if (typeof dto.aiEnabled === 'boolean') data.aiEnabled = dto.aiEnabled;
    if (typeof dto.marketplaceEnabled === 'boolean') {
      data.marketplaceEnabled = dto.marketplaceEnabled;
    }
    if (typeof dto.socialEnabled === 'boolean') {
      data.socialEnabled = dto.socialEnabled;
    }
    if (dto.billingPlan) data.billingPlan = dto.billingPlan.toUpperCase();
    if (dto.subscriptionStatus) {
      data.subscriptionStatus = dto.subscriptionStatus.toUpperCase();
    }
    if (typeof dto.subscriptionMonthlyPrice === 'number') {
      data.subscriptionMonthlyPrice = Math.max(
        0,
        Math.trunc(dto.subscriptionMonthlyPrice),
      );
    }
    if (dto.subscriptionStartAt) {
      data.subscriptionStartAt = new Date(dto.subscriptionStartAt);
    }
    if (dto.subscriptionNextBillingAt) {
      data.subscriptionNextBillingAt = new Date(dto.subscriptionNextBillingAt);
    }

    let club: any = null;
    try {
      club = await (this.prisma as any).club.update({
        where: { id: clubId },
        data,
        include: {
          memberships: { select: { primary: true } },
          roleSettings: { select: { roleKey: true, isEnabled: true, updatedAt: true } },
          _count: { select: { memberships: true } },
        },
      });
    } catch (error: any) {
      if (String(error?.code || '') === 'P2025') {
        throw new NotFoundException('Club not found');
      }
      throw error;
    }

    return { club: this.normalizeClubRecord(club) };
  }

  async users() {
    const allowlisted = this.getAllowlistedPlatformAdmins();
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });

    let dbRows: Array<{ id: string; isPlatformAdmin: boolean }> = [];
    try {
      dbRows = await (this.prisma as any).user.findMany({
        select: { id: true, isPlatformAdmin: true },
      });
    } catch {
      dbRows = [];
    }
    const dbAdminById = new Map(
      dbRows.map((row) => [row.id, !!row.isPlatformAdmin]),
    );

    return {
      users: users.map((user) => ({
        ...user,
        isPlatformAdmin:
          !!dbAdminById.get(user.id) ||
          allowlisted.has(this.normalizeEmail(user.email)),
      })),
    };
  }

  async updatePlatformAdmin(userId: string, dto: UpdatePlatformAdminDto) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!target) throw new NotFoundException('User not found');

    const nextValue = !!dto.isPlatformAdmin;
    const allowlisted = this.getAllowlistedPlatformAdmins();
    const targetAllowlisted = allowlisted.has(this.normalizeEmail(target.email));

    const withFlag = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: { isPlatformAdmin: true },
    });
    const currentDbValue = !!withFlag?.isPlatformAdmin;
    const currentDbAdminCount = await (this.prisma as any).user.count({
      where: { isPlatformAdmin: true },
    });

    if (
      !nextValue &&
      currentDbValue &&
      !targetAllowlisted &&
      currentDbAdminCount <= 1
    ) {
      throw new BadRequestException(
        'Cannot remove last database platform admin. Add another first.',
      );
    }

    const updated = await (this.prisma as any).user.update({
      where: { id: userId },
      data: { isPlatformAdmin: nextValue },
      select: { id: true, email: true, fullName: true, isPlatformAdmin: true },
    });

    return {
      user: {
        ...updated,
        isPlatformAdmin:
          !!updated.isPlatformAdmin ||
          allowlisted.has(this.normalizeEmail(updated.email)),
      },
    };
  }
}
