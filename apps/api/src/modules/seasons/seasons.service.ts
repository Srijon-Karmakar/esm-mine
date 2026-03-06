import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AddSeasonTeamDto,
  CreateSeasonDto,
  LinkSeasonMatchDto,
  CreateSeasonTeamDto,
} from './dto';
import { PrimaryRole } from '@prisma/client';
import { StandingsEngineService } from './standings-engine.service';

@Injectable()
export class SeasonsService {
  constructor(
    private prisma: PrismaService,
    private standings: StandingsEngineService,
  ) {}

  /* ============================================================
     COMMON HELPERS
  ============================================================ */

  private async assertMember(userId: string, clubId: string) {
    const m = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });

    if (!m) throw new ForbiddenException('No club access');
    return m;
  }

  private async assertManage(userId: string, clubId: string) {
    const m = await this.assertMember(userId, clubId);

    const allowed = new Set<PrimaryRole>([
      PrimaryRole.ADMIN,
      PrimaryRole.MANAGER,
    ]);

    if (!allowed.has(m.primary))
      throw new ForbiddenException('Insufficient role');

    return m;
  }

  private async assertSeason(clubId: string, seasonId: string) {
    const season = await this.prisma.season.findFirst({
      where: { id: seasonId, clubId },
      select: { id: true },
    });

    if (!season) throw new NotFoundException('Season not found');
    return season;
  }

  /* ============================================================
     SEASON CRUD
  ============================================================ */

  async createSeason(actorId: string, clubId: string, dto: CreateSeasonDto) {
    await this.assertManage(actorId, clubId);

    const startAt = new Date(dto.startAt);
    const endAt = dto.endAt ? new Date(dto.endAt) : null;

    if (Number.isNaN(startAt.getTime()))
      throw new BadRequestException('Invalid startAt');

    if (endAt && Number.isNaN(endAt.getTime()))
      throw new BadRequestException('Invalid endAt');

    return this.prisma.season.create({
      data: {
        clubId,
        name: dto.name.trim(),
        startAt,
        endAt,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listSeasons(actorId: string, clubId: string) {
    await this.assertMember(actorId, clubId);

    return this.prisma.season.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSeason(actorId: string, clubId: string, seasonId: string) {
    await this.assertMember(actorId, clubId);

    const season = await this.prisma.season.findFirst({
      where: { id: seasonId, clubId },
      include: { teams: true },
    });

    if (!season) throw new NotFoundException('Season not found');
    return season;
  }

  /* ============================================================
     SEASON TEAMS
  ============================================================ */

  async addTeam(
    actorId: string,
    clubId: string,
    seasonId: string,
    dto: AddSeasonTeamDto | CreateSeasonTeamDto,
  ) {
    await this.assertManage(actorId, clubId);
    await this.assertSeason(clubId, seasonId);

    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Invalid team name');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const team = await tx.seasonTeam.create({
          data: { seasonId, name },
        });

        // Auto-create empty standing row
        await tx.seasonStanding.create({
          data: {
            seasonId,
            teamId: team.id,
          },
        });

        return team;
      });
    } catch (e: any) {
      // Prisma unique constraint error
      if (e?.code === 'P2002') {
        throw new BadRequestException('Team already exists in this season');
      }
      throw e;
    }
  }

  async listTeams(actorId: string, clubId: string, seasonId: string) {
    await this.assertMember(actorId, clubId);
    await this.assertSeason(clubId, seasonId);

    return this.prisma.seasonTeam.findMany({
      where: { seasonId },
      orderBy: { name: 'asc' },
      include: { standings: true },
    });
  }

  /* ============================================================
     MATCH LINKING
  ============================================================ */

  async linkMatch(
    actorId: string,
    clubId: string,
    seasonId: string,
    dto: LinkSeasonMatchDto,
  ) {
    await this.assertManage(actorId, clubId);
    await this.assertSeason(clubId, seasonId);

    const match = await this.prisma.match.findFirst({
      where: { id: dto.matchId, clubId },
      select: { id: true },
    });
    if (!match) throw new NotFoundException('Match not found');

    const [homeTeam, awayTeam] = await Promise.all([
      this.prisma.seasonTeam.findFirst({
        where: { id: dto.homeTeamId, seasonId },
        select: { id: true },
      }),
      this.prisma.seasonTeam.findFirst({
        where: { id: dto.awayTeamId, seasonId },
        select: { id: true },
      }),
    ]);

    if (!homeTeam || !awayTeam)
      throw new BadRequestException('Invalid season team(s)');

    if (dto.homeTeamId === dto.awayTeamId)
      throw new BadRequestException('Home and away team cannot be same');

    const seasonMatch = await this.prisma.seasonMatch.upsert({
      where: { matchId: dto.matchId },
      update: {
        seasonId,
        homeTeamId: dto.homeTeamId,
        awayTeamId: dto.awayTeamId,
      },
      create: {
        seasonId,
        matchId: dto.matchId,
        homeTeamId: dto.homeTeamId,
        awayTeamId: dto.awayTeamId,
      },
    });

    // Recompute standings if needed
    await this.standings.recomputeSeasonStandings(seasonId);

    return seasonMatch;
  }

  /* ============================================================
     STANDINGS
  ============================================================ */

  async standingsForSeason(actorId: string, clubId: string, seasonId: string) {
    await this.assertMember(actorId, clubId);
    await this.assertSeason(clubId, seasonId);

    return this.prisma.seasonStanding.findMany({
      where: { seasonId },
      include: { team: true },
      orderBy: [{ points: 'desc' }, { goalDiff: 'desc' }, { goalsFor: 'desc' }],
    });
  }

  async recomputeStandings(actorId: string, clubId: string, seasonId: string) {
    await this.assertManage(actorId, clubId);
    await this.assertSeason(clubId, seasonId);

    return this.standings.recomputeSeasonStandings(seasonId);
  }
}
