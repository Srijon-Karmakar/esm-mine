// import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
// import { PrismaService } from "../../prisma/prisma.service";
// import { CreateSquadDto, AddSquadMemberDto } from "./dto";

// @Injectable()
// export class SquadsService {
//   constructor(private prisma: PrismaService) {}

//   private async assertClubMember(userId: string, clubId: string) {
//     const membership = await this.prisma.membership.findUnique({
//       where: { userId_clubId: { userId, clubId } },
//       select: { id: true, primary: true, subRoles: true },
//     });

//     if (!membership) throw new ForbiddenException("No club access");
//     return membership;
//   }

//   async createSquad(actorUserId: string, clubId: string, dto: CreateSquadDto) {
//   await this.assertClubMember(actorUserId, clubId);

//   const name = dto.name?.trim();
//   if (!name) throw new BadRequestException("Invalid squad name");

//   // If same squad already exists, return it (idempotent create)
//   const existing = await this.prisma.squad.findFirst({
//     where: { clubId, name },
//   });

//   if (existing) {
//     return existing;
//   }

//   // Otherwise create new
//   const squad = await this.prisma.squad.create({
//     data: {
//       clubId,
//       name,
//       code: dto.code?.trim() || null,
//     },
//   });

//   return squad;
// }

//   async listSquads(actorUserId: string, clubId: string) {
//     await this.assertClubMember(actorUserId, clubId);

//     const squads = await this.prisma.squad.findMany({
//       where: { clubId },
//       orderBy: { createdAt: "desc" },
//       include: {
//         _count: { select: { members: true } },
//       },
//     });

//     return squads.map((s) => ({
//       id: s.id,
//       clubId: s.clubId,
//       name: s.name,
//       code: s.code,
//       createdAt: s.createdAt,
//       updatedAt: s.updatedAt,
//       memberCount: s._count.members,
//     }));
//   }

//   async getSquad(actorUserId: string, clubId: string, squadId: string) {
//     await this.assertClubMember(actorUserId, clubId);

//     const squad = await this.prisma.squad.findFirst({
//       where: { id: squadId, clubId },
//       include: {
//         members: {
//           include: {
//             user: { select: { id: true, email: true, fullName: true } },
//           },
//           orderBy: { createdAt: "desc" },
//         },
//       },
//     });

//     if (!squad) throw new NotFoundException("Squad not found");

//     return squad;
//   }

//   async addMember(actorUserId: string, clubId: string, squadId: string, dto: AddSquadMemberDto) {
//     // actor must be a club member (role guard will enforce ADMIN/MANAGER in controller)
//     await this.assertClubMember(actorUserId, clubId);

//     // ensure squad exists in this club
//     const squad = await this.prisma.squad.findFirst({
//       where: { id: squadId, clubId },
//       select: { id: true },
//     });
//     if (!squad) throw new NotFoundException("Squad not found");

//     // ensure target is club member (only club members can be in squad)
//     const targetMembership = await this.prisma.membership.findUnique({
//       where: { userId_clubId: { userId: dto.userId, clubId } },
//       select: { userId: true },
//     });
//     if (!targetMembership) throw new BadRequestException("User is not a member of this club");

//     const member = await this.prisma.squadMember.upsert({
//       where: { squadId_userId: { squadId, userId: dto.userId } },
//       update: {
//         jerseyNo: dto.jerseyNo ?? null,
//         position: dto.position?.trim() || null,
//       },
//       create: {
//         squadId,
//         userId: dto.userId,
//         jerseyNo: dto.jerseyNo ?? null,
//         position: dto.position?.trim() || null,
//       },
//     });

//     return member;
//   }

//   async removeMember(actorUserId: string, clubId: string, squadId: string, userId: string) {
//     await this.assertClubMember(actorUserId, clubId);

//     // ensure squad exists in this club
//     const squad = await this.prisma.squad.findFirst({
//       where: { id: squadId, clubId },
//       select: { id: true },
//     });
//     if (!squad) throw new NotFoundException("Squad not found");

//     await this.prisma.squadMember.delete({
//       where: { squadId_userId: { squadId, userId } },
//     });

//     return { ok: true };
//   }
// }

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSquadDto, AddSquadMemberDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SquadsService {
  constructor(private prisma: PrismaService) {}

  private async assertClubMember(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { id: true, primary: true, subRoles: true },
    });

    if (!membership) throw new ForbiddenException('No club access');
    return membership;
  }

  async createSquad(actorUserId: string, clubId: string, dto: CreateSquadDto) {
    await this.assertClubMember(actorUserId, clubId);

    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Invalid squad name');

    try {
      const squad = await this.prisma.squad.create({
        data: {
          clubId,
          name,
          code: dto.code?.trim() || null,
        },
      });
      return squad;
    } catch (e: any) {
      // ✅ Clean handling for duplicate squad name
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Squad already exists in this club');
      }
      throw e;
    }
  }

  async listSquads(actorUserId: string, clubId: string) {
    await this.assertClubMember(actorUserId, clubId);

    const squads = await this.prisma.squad.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true } },
      },
    });

    return squads;
  }

  async getSquad(actorUserId: string, clubId: string, squadId: string) {
    await this.assertClubMember(actorUserId, clubId);

    const squad = await this.prisma.squad.findFirst({
      where: { id: squadId, clubId },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!squad) throw new NotFoundException('Squad not found');
    return squad;
  }

  async addMember(
    actorUserId: string,
    clubId: string,
    squadId: string,
    dto: AddSquadMemberDto,
  ) {
    await this.assertClubMember(actorUserId, clubId);

    const squad = await this.prisma.squad.findFirst({
      where: { id: squadId, clubId },
      select: { id: true },
    });
    if (!squad) throw new NotFoundException('Squad not found');

    try {
      return await this.prisma.squadMember.create({
        data: {
          squadId,
          userId: dto.userId,
          jerseyNo: dto.jerseyNo ?? null,
          position: dto.position?.trim() || null,
        },
      });
    } catch (e: any) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('User is already in this squad');
      }
      throw e;
    }
  }

  async removeMember(
    actorUserId: string,
    clubId: string,
    squadId: string,
    userId: string,
  ) {
    await this.assertClubMember(actorUserId, clubId);

    const squad = await this.prisma.squad.findFirst({
      where: { id: squadId, clubId },
      select: { id: true },
    });
    if (!squad) throw new NotFoundException('Squad not found');

    await this.prisma.squadMember.delete({
      where: { squadId_userId: { squadId, userId } },
    });

    return { ok: true };
  }
}
