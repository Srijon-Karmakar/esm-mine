import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private normalizeEmail(value: string) {
    return String(value || '').toLowerCase().trim();
  }

  private getAllowlistedEmails() {
    const raw = this.config.get<string>('PLATFORM_ADMIN_EMAILS') || '';
    return new Set(
      raw
        .split(',')
        .map((email) => this.normalizeEmail(email))
        .filter(Boolean),
    );
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.sub;
    const tokenEmail = this.normalizeEmail(String(req.user?.email || ''));

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const allowlisted = this.getAllowlistedEmails().has(tokenEmail);
    if (allowlisted) return true;

    try {
      const user = await (this.prisma as any).user.findUnique({
        where: { id: userId },
        select: { isPlatformAdmin: true, email: true },
      });

      if (user?.isPlatformAdmin) return true;
      if (this.getAllowlistedEmails().has(this.normalizeEmail(user?.email || ''))) {
        return true;
      }
    } catch {
      if (allowlisted) return true;
    }

    throw new ForbiddenException('Platform admin access required');
  }
}
