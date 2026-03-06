import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertPlayerProfileDto } from './dto';
import { PrimaryRole } from '@prisma/client';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async upsertMyProfile(userId: string, dto: UpsertPlayerProfileDto) {
    if (!userId) throw new BadRequestException('Missing user');

    const dob = dto.dob ? new Date(dto.dob) : undefined;

    const profile = await this.prisma.playerProfile.upsert({
      where: { userId },
      update: {
        dob: dob ?? undefined,
        nationality: dto.nationality?.trim() ?? undefined,
        heightCm: dto.heightCm ?? undefined,
        weightKg: dto.weightKg ?? undefined,
        dominantFoot: dto.dominantFoot ?? undefined,
        positions: dto.positions ?? undefined,
      },
      create: {
        userId,
        dob: dob ?? null,
        nationality: dto.nationality?.trim() || null,
        heightCm: dto.heightCm ?? null,
        weightKg: dto.weightKg ?? null,
        dominantFoot: dto.dominantFoot ?? null,
        positions: dto.positions ?? [],
      },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });

    return profile;
  }

  async getMe(userId: string) {
    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });

    return profile; // can be null if not created yet
  }

  private async assertClubMember(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });

    if (!membership) throw new ForbiddenException('No club access');
    return membership;
  }

  // club can list players (ADMIN/MANAGER typically)
  async listClubPlayers(actorUserId: string, clubId: string) {
    await this.assertClubMember(actorUserId, clubId);

    // Only list members who are PLAYER primary role
    const memberships = await this.prisma.membership.findMany({
      where: { clubId, primary: PrimaryRole.PLAYER },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = memberships.map((m) => m.userId);

    const profiles = await this.prisma.playerProfile.findMany({
      where: { userId: { in: userIds } },
    });

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    return memberships.map((m) => ({
      user: m.user,
      membershipId: m.id,
      profile: profileMap.get(m.userId) || null,
    }));
  }
}
