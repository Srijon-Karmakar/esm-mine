// import {
//   CanActivate,
//   ExecutionContext,
//   ForbiddenException,
//   Injectable,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { PrismaService } from '../../prisma/prisma.service';
// import { PrimaryRole } from '@prisma/client';
// import { ROLES_KEY } from '../decorators/roles.decorators';

// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(
//     private reflector: Reflector,
//     private prisma: PrismaService,
//   ) {}

//   async canActivate(ctx: ExecutionContext): Promise<boolean> {
//     const required = this.reflector.getAllAndOverride<PrimaryRole[]>(
//       ROLES_KEY,
//       [ctx.getHandler(), ctx.getClass()],
//     );
//     if (!required?.length) return true;

//     const req = ctx.switchToHttp().getRequest();
//     const userId = req.user?.sub as string | undefined;
//     const clubId = req.params?.clubId as string | undefined;

//     if (!userId) throw new ForbiddenException('Missing user');
//     if (!clubId) throw new ForbiddenException('Missing clubId');

//     const membership = await this.prisma.membership.findUnique({
//       where: { userId_clubId: { userId, clubId } },
//       select: { primary: true },
//     });

//     if (!membership) throw new ForbiddenException('No club access');
//     if (!required.includes(membership.primary))
//       throw new ForbiddenException('Insufficient role');

//     return true;
//   }
// }












import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { PrimaryRole } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorators";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  private getClubId(req: any): string | undefined {
    const fromHeader = req.headers?.["x-club-id"] as string | undefined;
    const fromQuery = req.query?.clubId as string | undefined;
    const fromParams = req.params?.clubId as string | undefined;
    const fromBody = req.body?.clubId as string | undefined;
    return fromHeader || fromQuery || fromParams || fromBody;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<PrimaryRole[]>(ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) || [];

    if (!required.length) return true;

    const req = ctx.switchToHttp().getRequest();
    const userId = req.user?.sub as string | undefined;

    if (!userId) throw new ForbiddenException("Missing user");

    const clubId = this.getClubId(req);
    if (!clubId) {
      throw new ForbiddenException(
        "Missing clubId (send x-club-id header or ?clubId=...)"
      );
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { primary: true },
    });

    if (!membership) throw new ForbiddenException("No club access");
    if (!required.includes(membership.primary))
      throw new ForbiddenException("Insufficient role");

    return true;
  }
}