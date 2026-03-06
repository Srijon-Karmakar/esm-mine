import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ClubTaskPriority,
  ClubTaskStatus,
  MatchStatus,
  PrimaryRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMessageDto,
  CreateTaskDto,
  UpdateMessageDto,
  UpdateTaskDto,
} from './dto';

function daysFromRange(range: string): number {
  const r = String(range || '30d').toLowerCase().trim();
  if (r.endsWith('d')) return Math.max(1, parseInt(r) || 30);
  if (r.endsWith('w')) return Math.max(7, (parseInt(r) || 4) * 7);
  if (r.endsWith('m')) return Math.max(30, (parseInt(r) || 1) * 30);
  return 30;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
type TaskStatus = 'OPEN' | 'PENDING' | 'DONE';
type TaskType =
  | 'MATCH_PREP'
  | 'INJURY_FOLLOWUP'
  | 'SIGNUP_ASSIGNMENT'
  | 'MANUAL_TASK';

function normalizeTone(input?: string | null): 'default' | 'warn' | 'ok' | 'danger' {
  const tone = String(input || 'default').toLowerCase();
  if (tone === 'warn' || tone === 'ok' || tone === 'danger') return tone;
  return 'default';
}

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  private async getMembership(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: { clubId: true, primary: true, subRoles: true },
    });
    if (!membership) throw new ForbiddenException('No access to this club');
    return membership;
  }

  private isAdminOrManager(primary: PrimaryRole) {
    return primary === PrimaryRole.ADMIN || primary === PrimaryRole.MANAGER;
  }

  private ensureManagePermission(primary: PrimaryRole) {
    if (!this.isAdminOrManager(primary)) {
      throw new ForbiddenException('Only ADMIN or MANAGER can manage this resource');
    }
  }

  async training(userId: string, clubId: string, range: string) {
    const membership = await this.getMembership(userId, clubId);
    const days = daysFromRange(range);
    const now = new Date();
    const from = new Date(Date.now() - days * 86400000);
    const next14 = new Date(Date.now() + 14 * 86400000);

    const injuryWhere =
      membership.primary === PrimaryRole.PLAYER ? { userId, clubId, isActive: true } : { clubId, isActive: true };

    const [squads, players, finishedMatches, statsRows, upcomingMatches, activeInjuries] =
      await Promise.all([
        this.prisma.squad.count({ where: { clubId } }),
        this.prisma.squadMember.count({ where: { squad: { clubId } } }),
        this.prisma.match.findMany({
          where: { clubId, status: MatchStatus.FINISHED, kickoffAt: { gte: from } },
          select: { kickoffAt: true },
        }),
        this.prisma.playerMatchStat.findMany({
          where: {
            clubId,
            match: { kickoffAt: { gte: from } },
            ...(membership.primary === PrimaryRole.PLAYER ? { userId } : {}),
          },
          select: { goals: true, assists: true, match: { select: { kickoffAt: true } } },
        }),
        this.prisma.match.findMany({
          where: {
            clubId,
            kickoffAt: { gte: now, lte: next14 },
            status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE] },
          },
          orderBy: { kickoffAt: 'asc' },
          take: 12,
          select: {
            id: true,
            title: true,
            opponent: true,
            kickoffAt: true,
            venue: true,
            status: true,
            homeScore: true,
            awayScore: true,
          },
        }),
        this.prisma.playerInjury.findMany({
          where: injuryWhere,
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: {
            id: true,
            userId: true,
            type: true,
            severity: true,
            isActive: true,
            startDate: true,
            endDate: true,
          },
        }),
      ]);

    const matchesByDay = new Map<string, number>();
    for (const match of finishedMatches) {
      const key = isoDay(new Date(match.kickoffAt));
      matchesByDay.set(key, (matchesByDay.get(key) || 0) + 1);
    }

    const goalsByDay = new Map<string, number>();
    const assistsByDay = new Map<string, number>();
    for (const row of statsRows) {
      const key = isoDay(new Date(row.match.kickoffAt));
      goalsByDay.set(key, (goalsByDay.get(key) || 0) + (row.goals || 0));
      assistsByDay.set(key, (assistsByDay.get(key) || 0) + (row.assists || 0));
    }

    const allDays = Array.from(
      new Set([...matchesByDay.keys(), ...goalsByDay.keys(), ...assistsByDay.keys()]),
    ).sort();

    const trend = allDays.map((day) => ({
      day,
      matches: matchesByDay.get(day) || 0,
      goals: goalsByDay.get(day) || 0,
      assists: assistsByDay.get(day) || 0,
    }));

    const summary = {
      squads,
      players,
      upcoming: upcomingMatches.length,
      activeInjuries: activeInjuries.length,
      totalMatches: trend.reduce((sum, item) => sum + item.matches, 0),
      totalGoals: trend.reduce((sum, item) => sum + item.goals, 0),
      totalAssists: trend.reduce((sum, item) => sum + item.assists, 0),
    };

    return {
      clubId,
      rangeDays: days,
      role: membership.primary,
      summary,
      trend,
      upcomingMatches,
      activeInjuries,
    };
  }

  async tasks(userId: string, clubId: string, limit: number) {
    const membership = await this.getMembership(userId, clubId);
    const safeLimit = Math.min(Math.max(limit || 20, 1), 80);
    const now = new Date();
    const next10 = new Date(Date.now() + 10 * 86400000);

    const [upcomingMatches, activeInjuries, manualTasks] = await Promise.all([
      this.prisma.match.findMany({
        where: {
          clubId,
          kickoffAt: { gte: now, lte: next10 },
          status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE] },
        },
        orderBy: { kickoffAt: 'asc' },
        take: 16,
        select: {
          id: true,
          title: true,
          opponent: true,
          kickoffAt: true,
          status: true,
          venue: true,
        },
      }),
      this.prisma.playerInjury.findMany({
        where: {
          clubId,
          isActive: true,
          ...(membership.primary === PrimaryRole.PLAYER ? { userId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 16,
        select: {
          id: true,
          userId: true,
          type: true,
          severity: true,
          startDate: true,
          endDate: true,
        },
      }),
      this.prisma.clubTask.findMany({
        where: {
          clubId,
          ...(this.isAdminOrManager(membership.primary)
            ? {}
            : { assignedToUserId: userId }),
        },
        orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
        take: safeLimit,
        include: {
          createdBy: { select: { id: true, email: true, fullName: true } },
          assignedTo: { select: { id: true, email: true, fullName: true } },
        },
      }),
    ]);

    let signupAssignments: Array<{
      id: string;
      email: string;
      primary: PrimaryRole;
      expiresAt: Date;
      createdAt: Date;
    }> = [];

    if (this.isAdminOrManager(membership.primary)) {
      signupAssignments = await this.prisma.invitation.findMany({
        where: {
          clubId,
          usedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          email: true,
          primary: true,
          expiresAt: true,
          createdAt: true,
        },
      });
    }

    const tasks: Array<{
      id: string;
      type: TaskType;
      title: string;
      description: string;
      priority: TaskPriority;
      status: TaskStatus;
      dueAt: string | null;
      createdAt: string | null;
      source: 'SYSTEM' | 'MANUAL';
      mutable: boolean;
      assignedToUserId?: string | null;
      assignedToName?: string | null;
      createdByName?: string | null;
      meta?: Record<string, string>;
    }> = [];

    for (const row of manualTasks) {
      tasks.push({
        id: row.id,
        type: 'MANUAL_TASK',
        title: row.title,
        description: row.description || '',
        priority: row.priority as TaskPriority,
        status: row.status as TaskStatus,
        dueAt: row.dueAt ? row.dueAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
        source: 'MANUAL',
        mutable: true,
        assignedToUserId: row.assignedToUserId || null,
        assignedToName: row.assignedTo?.fullName || row.assignedTo?.email || null,
        createdByName: row.createdBy.fullName || row.createdBy.email || row.createdBy.id,
      });
    }

    for (const row of upcomingMatches) {
      const dueAt = row.kickoffAt?.toISOString() || null;
      const kickoffMs = row.kickoffAt ? row.kickoffAt.getTime() : Number.MAX_SAFE_INTEGER;
      const priority: TaskPriority = kickoffMs - Date.now() <= 48 * 3600000 ? 'HIGH' : 'MEDIUM';
      tasks.push({
        id: `match-${row.id}`,
        type: 'MATCH_PREP',
        title: `Prepare fixture: ${row.title || `vs ${row.opponent || 'Opponent'}`}`,
        description: `${row.status || 'SCHEDULED'} | ${row.venue || 'Venue TBA'}`,
        priority,
        status: 'OPEN',
        dueAt,
        createdAt: row.kickoffAt ? row.kickoffAt.toISOString() : null,
        source: 'SYSTEM',
        mutable: false,
      });
    }

    for (const row of activeInjuries) {
      const severity = String(row.severity || '').toUpperCase();
      const priority: TaskPriority = severity === 'HIGH' ? 'HIGH' : severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';
      const startDateText = row.startDate ? row.startDate.toISOString().slice(0, 10) : '-';
      const etaText = row.endDate ? ` | ETA ${row.endDate.toISOString().slice(0, 10)}` : '';
      tasks.push({
        id: `injury-${row.id}`,
        type: 'INJURY_FOLLOWUP',
        title: `Medical follow-up: ${row.type || 'Injury'} (User ${row.userId})`,
        description: `Started ${startDateText}${etaText}`,
        priority,
        status: 'OPEN',
        dueAt: row.endDate?.toISOString() || null,
        createdAt: row.startDate ? row.startDate.toISOString() : null,
        source: 'SYSTEM',
        mutable: false,
      });
    }

    for (const row of signupAssignments) {
      tasks.push({
        id: `signup-${row.id}`,
        type: 'SIGNUP_ASSIGNMENT',
        title: `Pending signup assignment: ${row.email}`,
        description: `Role ${row.primary} assigned, waiting acceptance`,
        priority: 'MEDIUM',
        status: 'PENDING',
        dueAt: row.expiresAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
        source: 'SYSTEM',
        mutable: false,
      });
    }

    tasks.sort((a, b) => {
      const ta = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });

    const sliced = tasks.slice(0, safeLimit);
    const dueSoonBoundary = Date.now() + 72 * 3600000;
    const counts = {
      total: sliced.length,
      high: sliced.filter((t) => t.priority === 'HIGH').length,
      open: sliced.filter((t) => t.status === 'OPEN' || t.status === 'PENDING').length,
      dueSoon: sliced.filter((t) => {
        if (!t.dueAt) return false;
        const time = new Date(t.dueAt).getTime();
        return Number.isFinite(time) && time <= dueSoonBoundary;
      }).length,
    };

    return {
      clubId,
      role: membership.primary,
      counts,
      tasks: sliced,
    };
  }

  async createTask(userId: string, clubId: string, dto: CreateTaskDto) {
    const membership = await this.getMembership(userId, clubId);
    this.ensureManagePermission(membership.primary);

    let assignedToUserId: string | null = null;
    if (dto.assignedToUserId?.trim()) {
      const target = await this.prisma.membership.findUnique({
        where: {
          userId_clubId: { userId: dto.assignedToUserId.trim(), clubId },
        },
        select: { userId: true },
      });
      if (!target) throw new BadRequestException('Assigned user is not a club member');
      assignedToUserId = target.userId;
    }

    const dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    if (dto.dueAt && Number.isNaN(dueAt?.getTime())) {
      throw new BadRequestException('Invalid dueAt date');
    }

    const task = await this.prisma.clubTask.create({
      data: {
        clubId,
        createdByUserId: userId,
        assignedToUserId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        priority: dto.priority || ClubTaskPriority.MEDIUM,
        dueAt,
      },
    });

    return { task };
  }

  async updateTask(userId: string, clubId: string, taskId: string, dto: UpdateTaskDto) {
    const membership = await this.getMembership(userId, clubId);
    const task = await this.prisma.clubTask.findFirst({
      where: { id: taskId, clubId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isManager = this.isAdminOrManager(membership.primary);
    if (!isManager && task.assignedToUserId !== userId) {
      throw new ForbiddenException('Only assigned member can update this task');
    }

    if (!isManager) {
      const onlyStatusUpdate =
        dto.status !== undefined &&
        dto.title === undefined &&
        dto.description === undefined &&
        dto.priority === undefined &&
        dto.dueAt === undefined &&
        dto.assignedToUserId === undefined;
      if (!onlyStatusUpdate) {
        throw new ForbiddenException('You can only update task status');
      }
    }

    let assignedToUserId: string | undefined;
    if (dto.assignedToUserId !== undefined) {
      if (!isManager) throw new ForbiddenException('Cannot reassign task');
      if (!dto.assignedToUserId.trim()) {
        assignedToUserId = undefined;
      } else {
        const target = await this.prisma.membership.findUnique({
          where: { userId_clubId: { userId: dto.assignedToUserId.trim(), clubId } },
          select: { userId: true },
        });
        if (!target) throw new BadRequestException('Assigned user is not a club member');
        assignedToUserId = target.userId;
      }
    }

    const dueAt = dto.dueAt ? new Date(dto.dueAt) : undefined;
    if (dto.dueAt && Number.isNaN(dueAt?.getTime())) {
      throw new BadRequestException('Invalid dueAt date');
    }

    const updated = await this.prisma.clubTask.update({
      where: { id: task.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.dueAt !== undefined ? { dueAt } : {}),
        ...(dto.assignedToUserId !== undefined ? { assignedToUserId: assignedToUserId || null } : {}),
      },
    });

    return { task: updated };
  }

  async feed(userId: string, clubId: string, limit: number) {
    const membership = await this.getMembership(userId, clubId);
    const safeLimit = Math.min(Math.max(limit || 30, 1), 120);

    const [matches, injuries, invitations, manualMessages] = await Promise.all([
      this.prisma.match.findMany({
        where: { clubId },
        orderBy: { kickoffAt: 'desc' },
        take: safeLimit,
        select: {
          id: true,
          title: true,
          opponent: true,
          kickoffAt: true,
          venue: true,
          status: true,
          homeScore: true,
          awayScore: true,
        },
      }),
      this.prisma.playerInjury.findMany({
        where: {
          clubId,
          ...(membership.primary === PrimaryRole.PLAYER ? { userId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
        select: {
          id: true,
          userId: true,
          type: true,
          severity: true,
          isActive: true,
          startDate: true,
          createdAt: true,
        },
      }),
      this.isAdminOrManager(membership.primary)
        ? this.prisma.invitation.findMany({
            where: { clubId, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
            take: safeLimit,
            select: {
              id: true,
              email: true,
              primary: true,
              createdAt: true,
              expiresAt: true,
            },
          })
        : Promise.resolve([]),
      this.prisma.clubMessage.findMany({
        where: {
          clubId,
          isActive: true,
          ...(this.isAdminOrManager(membership.primary)
            ? {}
            : {
                audience: {
                  in:
                    membership.primary === PrimaryRole.PLAYER
                      ? ['ALL', 'PLAYERS']
                      : ['ALL', 'STAFF'],
                },
              }),
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: safeLimit,
        include: {
          createdBy: { select: { id: true, email: true, fullName: true } },
        },
      }),
    ]);

    const feed: Array<{
      id: string;
      kind: 'MATCH' | 'INJURY' | 'SIGNUP' | 'MESSAGE';
      tone: 'default' | 'warn' | 'ok' | 'danger';
      title: string;
      subtitle: string;
      ts: string;
      mutable?: boolean;
      isPinned?: boolean;
      audience?: string;
    }> = [];

    for (const row of manualMessages) {
      const tone = normalizeTone(row.tone);
      feed.push({
        id: `message-${row.id}`,
        kind: 'MESSAGE',
        tone,
        title: row.title,
        subtitle: `${row.body} | ${row.audience} | by ${
          row.createdBy.fullName || row.createdBy.email || row.createdBy.id
        }`,
        ts: row.createdAt.toISOString(),
        mutable: this.isAdminOrManager(membership.primary),
        isPinned: row.isPinned,
        audience: row.audience,
      });
    }

    for (const row of matches) {
      const tone =
        row.status === MatchStatus.LIVE
          ? 'warn'
          : row.status === MatchStatus.FINISHED
            ? 'ok'
            : row.status === MatchStatus.CANCELLED
              ? 'danger'
              : 'default';

      feed.push({
        id: `match-${row.id}`,
        kind: 'MATCH',
        tone,
        title: row.title || `vs ${row.opponent || 'Opponent'}`,
        subtitle:
          `${row.status || 'SCHEDULED'} | ${row.kickoffAt.toISOString()} | ${row.venue || 'Venue TBA'}` +
          ` | ${row.homeScore ?? '-'}-${row.awayScore ?? '-'}`,
        ts: row.kickoffAt.toISOString(),
      });
    }

    for (const row of injuries) {
      const severity = String(row.severity || '').toUpperCase();
      const tone = severity === 'HIGH' ? 'danger' : severity === 'MEDIUM' ? 'warn' : 'ok';
      const startText = row.startDate ? row.startDate.toISOString() : '-';
      feed.push({
        id: `injury-${row.id}`,
        kind: 'INJURY',
        tone,
        title: `${row.type || 'Injury'} (${row.severity || 'LOW'})`,
        subtitle: `User ${row.userId} | ${row.isActive ? 'Active' : 'Recovered'} | Start ${startText}`,
        ts: row.createdAt.toISOString(),
      });
    }

    for (const row of invitations) {
      feed.push({
        id: `signup-${row.id}`,
        kind: 'SIGNUP',
        tone: 'warn',
        title: `Signup assignment pending: ${row.email}`,
        subtitle: `Role ${row.primary} | Expires ${row.expiresAt.toISOString()}`,
        ts: row.createdAt.toISOString(),
      });
    }

    feed.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    return {
      clubId,
      role: membership.primary,
      feed: feed.slice(0, safeLimit),
    };
  }

  async createMessage(userId: string, clubId: string, dto: CreateMessageDto) {
    const membership = await this.getMembership(userId, clubId);
    this.ensureManagePermission(membership.primary);

    const message = await this.prisma.clubMessage.create({
      data: {
        clubId,
        createdByUserId: userId,
        title: dto.title.trim(),
        body: dto.body.trim(),
        tone: normalizeTone(dto.tone),
        audience: (dto.audience || 'ALL').toUpperCase(),
        isPinned: Boolean(dto.isPinned),
      },
    });

    return { message };
  }

  async updateMessage(
    userId: string,
    clubId: string,
    messageId: string,
    dto: UpdateMessageDto,
  ) {
    const membership = await this.getMembership(userId, clubId);
    this.ensureManagePermission(membership.primary);

    const message = await this.prisma.clubMessage.findFirst({
      where: { id: messageId, clubId },
      select: { id: true },
    });
    if (!message) throw new NotFoundException('Message not found');

    const updated = await this.prisma.clubMessage.update({
      where: { id: message.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
        ...(dto.tone !== undefined ? { tone: normalizeTone(dto.tone) } : {}),
        ...(dto.audience !== undefined ? { audience: dto.audience.toUpperCase() } : {}),
        ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return { message: updated };
  }
}
