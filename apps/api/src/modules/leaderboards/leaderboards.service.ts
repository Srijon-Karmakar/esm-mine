import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeaderboardsService {
  constructor(private prisma: PrismaService) {}

  private async assertMember(userId: string, clubId: string) {
    const m = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { id: true },
    });

    if (!m) throw new ForbiddenException('No club access');
  }

  private async resolveSeasonMatchIds(clubId: string, seasonId?: string) {
    if (!seasonId) return undefined;

    const games = await this.prisma.seasonGame.findMany({
      where: { clubId, seasonId },
      select: { matchId: true },
    });

    return games.map((g) => g.matchId);
  }

  async topScorers(
    actorId: string,
    clubId: string,
    seasonId?: string,
    limit = 10,
  ) {
    await this.assertMember(actorId, clubId);

    if (!limit || limit < 1) {
      throw new BadRequestException('limit must be >= 1');
    }

    const matchIds = await this.resolveSeasonMatchIds(clubId, seasonId);

    return this.prisma.playerMatchStat.groupBy({
      by: ['userId'],
      where: {
        clubId,
        matchId: matchIds ? { in: matchIds } : undefined,
      },
      _sum: {
        goals: true,
      },
      orderBy: {
        _sum: { goals: 'desc' },
      },
      take: limit,
    });
  }

  async topAssists(
    actorId: string,
    clubId: string,
    seasonId?: string,
    limit = 10,
  ) {
    await this.assertMember(actorId, clubId);

    const matchIds = await this.resolveSeasonMatchIds(clubId, seasonId);

    return this.prisma.playerMatchStat.groupBy({
      by: ['userId'],
      where: {
        clubId,
        matchId: matchIds ? { in: matchIds } : undefined,
      },
      _sum: {
        assists: true,
      },
      orderBy: {
        _sum: { assists: 'desc' },
      },
      take: limit,
    });
  }

  async mostMinutes(
    actorId: string,
    clubId: string,
    seasonId?: string,
    limit = 10,
  ) {
    await this.assertMember(actorId, clubId);

    const matchIds = await this.resolveSeasonMatchIds(clubId, seasonId);

    return this.prisma.playerMatchStat.groupBy({
      by: ['userId'],
      where: {
        clubId,
        matchId: matchIds ? { in: matchIds } : undefined,
      },
      _sum: {
        minutes: true,
      },
      orderBy: {
        _sum: { minutes: 'desc' },
      },
      take: limit,
    });
  }
}
