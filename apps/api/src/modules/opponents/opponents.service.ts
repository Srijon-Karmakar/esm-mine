import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOpponentDto, UpdateOpponentDto } from './dto';
import { PrimaryRole } from '@prisma/client';

@Injectable()
export class OpponentsService {
  constructor(private prisma: PrismaService) {}

  private async assertManager(userId: string, clubId: string) {
    const m = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });
    if (!m) throw new ForbiddenException('No club access');

    const allowed = new Set<PrimaryRole>([
      PrimaryRole.ADMIN,
      PrimaryRole.MANAGER,
    ]);

    // if (![PrimaryRole.ADMIN, PrimaryRole.MANAGER].includes(m.primary)) {
    if (!allowed.has(m.primary)) {
      throw new ForbiddenException('Insufficient role');
    }
  }

  async create(actorId: string, clubId: string, dto: CreateOpponentDto) {
    await this.assertManager(actorId, clubId);

    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Invalid name');

    try {
      return await this.prisma.opponent.create({
        data: {
          clubId,
          name,
          shortName: dto.shortName?.trim() || null,
        },
      });
    } catch (e: any) {
      // Unique (clubId, name)
      if (e?.code === 'P2002')
        throw new BadRequestException('Opponent already exists');
      throw e;
    }
  }

  async list(actorId: string, clubId: string) {
    // any club member can view
    const m = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId: actorId, clubId } },
      select: { id: true },
    });
    if (!m) throw new ForbiddenException('No club access');

    return this.prisma.opponent.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    actorId: string,
    clubId: string,
    opponentId: string,
    dto: UpdateOpponentDto,
  ) {
    await this.assertManager(actorId, clubId);

    const exists = await this.prisma.opponent.findFirst({
      where: { id: opponentId, clubId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Opponent not found');

    const name = dto.name?.trim();

    try {
      return await this.prisma.opponent.update({
        where: { id: opponentId },
        data: {
          name: name ?? undefined,
          shortName: dto.shortName?.trim() ?? undefined,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002')
        throw new BadRequestException('Opponent name already exists');
      throw e;
    }
  }

  async remove(actorId: string, clubId: string, opponentId: string) {
    await this.assertManager(actorId, clubId);

    const exists = await this.prisma.opponent.findFirst({
      where: { id: opponentId, clubId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Opponent not found');

    return this.prisma.opponent.delete({ where: { id: opponentId } });
  }
}
