// import {
//   CanActivate,
//   ExecutionContext,
//   ForbiddenException,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { PrismaService } from '../../prisma/prisma.service';
// import { CLUB_ROLES_KEY } from '../decorators/club-roles.decorators';
// import { PrimaryRole } from '@prisma/client';

// @Injectable()
// export class ClubRolesGuard implements CanActivate {
//   constructor(
//     private reflector: Reflector,
//     private prisma: PrismaService,
//   ) {}

//   async canActivate(ctx: ExecutionContext): Promise<boolean> {
//     const req = ctx.switchToHttp().getRequest();

//     const userId: string | undefined = req.user?.sub;
//     if (!userId) throw new UnauthorizedException('Unauthorized');

//     const roles =
//       this.reflector.getAllAndOverride<PrimaryRole[]>(CLUB_ROLES_KEY, [
//         ctx.getHandler(),
//         ctx.getClass(),
//       ]) || [];

//     // If route doesn't require club roles, allow
//     if (roles.length === 0) return true;

//     // clubId can come from params or body
//     const clubId: string | undefined = req.params?.clubId || req.body?.clubId;
//     if (!clubId) throw new ForbiddenException('No club access');

//     const membership = await this.prisma.membership.findUnique({
//       where: { userId_clubId: { userId, clubId } },
//       select: { primary: true },
//     });

//     if (!membership) throw new ForbiddenException('No club access');

//     const ok = roles.includes(membership.primary);
//     if (!ok) throw new ForbiddenException('No club access');

//     // attach membership if you want later
//     req.membership = membership;

//     return true;
//   }
// }




















import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { CLUB_ROLES_KEY } from "../decorators/club-roles.decorators";
import { PrimaryRole } from "@prisma/client";

@Injectable()
export class ClubRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  private getClubId(req: any): string | undefined {
    // ✅ Prefer header (your frontend sends x-club-id)
    const fromHeader = req.headers?.["x-club-id"] as string | undefined;

    // ✅ Support query (?clubId=...)
    const fromQuery = req.query?.clubId as string | undefined;

    // ✅ Support REST param (/clubs/:clubId/...)
    const fromParams = req.params?.clubId as string | undefined;

    // ✅ Support body (POST/PATCH)
    const fromBody = req.body?.clubId as string | undefined;

    return fromHeader || fromQuery || fromParams || fromBody;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    const userId: string | undefined = req.user?.sub;
    if (!userId) throw new UnauthorizedException("Unauthorized");

    const roles =
      this.reflector.getAllAndOverride<PrimaryRole[]>(CLUB_ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) || [];

    // ✅ If route doesn't require club roles, allow
    if (roles.length === 0) return true;

    const clubId = this.getClubId(req);
    if (!clubId) {
      throw new ForbiddenException(
        "No club access (missing clubId). Send x-club-id header or clubId query param."
      );
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true, subRoles: true },
    });

    if (!membership) throw new ForbiddenException("No club access");

    // ✅ Primary role check
    const ok = roles.includes(membership.primary);
    if (!ok) throw new ForbiddenException("No club access");

    req.membership = membership;
    req.clubId = clubId;

    return true;
  }
}
