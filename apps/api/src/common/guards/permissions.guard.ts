import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { hasRolePermission, type RolePermission } from '../types/role-policy';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  private getClubId(req: any): string | undefined {
    const fromHeader = req.headers?.['x-club-id'] as string | undefined;
    const fromQuery = req.query?.clubId as string | undefined;
    const fromParams = req.params?.clubId as string | undefined;
    const fromBody = req.body?.clubId as string | undefined;
    return fromHeader || fromQuery || fromParams || fromBody;
  }

  private async assertClubOperational(clubId: string) {
    try {
      const club = await (this.prisma as any).club.findUnique({
        where: { id: clubId },
        select: {
          isActive: true,
          subscriptionStatus: true,
        },
      });
      if (!club) throw new ForbiddenException('Club not found');
      if (club.isActive === false) {
        throw new ForbiddenException('Club is deactivated by platform admin');
      }

      const status = String(club.subscriptionStatus || 'TRIAL').toUpperCase();
      if (status === 'PAST_DUE' || status === 'CANCELED') {
        throw new ForbiddenException(
          'Club subscription is inactive. Contact your club admin.',
        );
      }
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (
        msg.includes('deactivated by platform admin') ||
        msg.includes('Club subscription is inactive')
      ) {
        throw error;
      }
      // Keep backward compatibility when migration/prisma generation is pending.
    }
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<RolePermission[]>(PERMISSIONS_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) || [];

    if (!required.length) return true;

    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    const clubId = this.getClubId(req);
    if (!clubId) {
      throw new ForbiddenException(
        'Missing clubId. Send x-club-id header or clubId param/query/body.',
      );
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { clubId: true, primary: true, subRoles: true },
    });

    if (!membership) throw new ForbiddenException('No club access');

    await this.assertClubOperational(clubId);

    const denied = required.find(
      (permission) =>
        !hasRolePermission(
          { primary: membership.primary, subRoles: membership.subRoles },
          permission,
        ),
    );

    if (denied) {
      throw new ForbiddenException(
        `Missing permission '${denied}' for current club role`,
      );
    }

    req.membership = membership;
    req.clubId = clubId;

    return true;
  }
}
