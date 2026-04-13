import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMediaSignatureDto,
  CreateSocialCommentDto,
  CreateSocialPostDto,
  SocialFeedQueryDto,
} from './dto';

type PostRole = 'PLAYER' | 'MANAGER' | 'ADMIN' | 'MEMBER' | 'COACH' | 'PHYSIO' | 'AGENT' | 'NUTRITIONIST' | 'PITCH_MANAGER';

const ROLE_PRIORITY: PostRole[] = [
  'COACH',
  'PHYSIO',
  'AGENT',
  'NUTRITIONIST',
  'PITCH_MANAGER',
  'PLAYER',
  'MANAGER',
  'ADMIN',
  'MEMBER',
];

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1920;
const MAX_VIDEO_WIDTH = 1280;
const MAX_VIDEO_HEIGHT = 720;
const MAX_VIDEO_DURATION_SEC = 90;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const INSTAGRAM_URL_RE = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/;

function isValidInstagramUrl(url: string): boolean {
  return INSTAGRAM_URL_RE.test(url);
}

function sanitizeTag(input: string) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .slice(0, 30);
}

function uniq(values: string[]) {
  return Array.from(new Set(values));
}

function resolveUserRole(membership?: { primary?: string; subRoles?: string[] } | null): PostRole {
  if (!membership) return 'PLAYER';
  const subRoles = Array.isArray(membership.subRoles) ? membership.subRoles : [];
  const primary = String(membership.primary || 'MEMBER').toUpperCase() as PostRole;
  for (const role of ROLE_PRIORITY) {
    if (subRoles.includes(role)) return role;
  }
  return primary;
}

@Injectable()
export class SocialService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private postRepo() {
    const repo = (this.prisma as any).socialPost;
    if (!repo) {
      throw new ServiceUnavailableException(
        'Social storage is not ready. Run Prisma migrate/db push and generate in apps/api.',
      );
    }
    return repo;
  }

  private commentRepo() {
    const repo = (this.prisma as any).socialComment;
    if (!repo) {
      throw new ServiceUnavailableException(
        'Social storage is not ready. Run Prisma migrate/db push and generate in apps/api.',
      );
    }
    return repo;
  }

  private reactionRepo() {
    const repo = (this.prisma as any).socialReaction;
    if (!repo) {
      throw new ServiceUnavailableException(
        'Social storage is not ready. Run Prisma migrate/db push and generate in apps/api.',
      );
    }
    return repo;
  }

  private async withStorageGuard<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const code = String(error?.code || '');
      const message = String(error?.message || '');
      const isSchemaIssue =
        code === 'P2021' ||
        code === 'P2022' ||
        message.includes('SocialPost') ||
        message.includes('SocialComment') ||
        message.includes('SocialReaction') ||
        message.includes('SocialMedia');
      if (isSchemaIssue) {
        throw new ServiceUnavailableException(
          'Social storage is not ready. Run Prisma migrate/db push and generate in apps/api, then restart API.',
        );
      }
      throw error;
    }
  }

  private async getUserContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        memberships: {
          orderBy: { createdAt: 'asc' },
          include: {
            club: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const memberships = Array.isArray(user.memberships) ? user.memberships : [];
    const canPublish =
      memberships.length === 0 ||
      memberships.some((membership) => String(membership.primary).toUpperCase() === 'PLAYER');

    return {
      user,
      memberships,
      canPublish,
      activeMembership: memberships[0] || null,
    };
  }

  private mapComment(row: any) {
    const member = row?.user?.memberships?.[0] || null;
    return {
      id: row.id,
      text: row.text,
      createdAt: row.createdAt,
      author: {
        id: row.user?.id,
        fullName: row.user?.fullName || row.user?.email || row.user?.id,
        role: resolveUserRole(member),
      },
    };
  }

  private mapPost(row: any, currentUserId: string) {
    const member = row?.author?.memberships?.[0] || null;
    return {
      id: row.id,
      skill: row.skill,
      caption: row.caption,
      tags: Array.isArray(row.tags) ? row.tags : [],
      createdAt: row.createdAt,
      author: {
        id: row.author?.id,
        fullName: row.author?.fullName || row.author?.email || row.author?.id,
        role: resolveUserRole(member),
        club: member?.club
          ? {
              id: member.club.id,
              name: member.club.name,
              slug: member.club.slug,
            }
          : null,
      },
      instagramUrl: row.instagramUrl || null,
      media: row.media
        ? {
            id: row.media.id,
            kind: String(row.media.type || 'IMAGE').toUpperCase() === 'VIDEO' ? 'video' : 'image',
            url: row.media.url,
            publicId: row.media.publicId,
            format: row.media.format || null,
            width: row.media.width || null,
            height: row.media.height || null,
            durationSec: row.media.durationSec || null,
            bytes: row.media.bytes || null,
          }
        : null,
      stats: {
        reactions: Number(row?._count?.reactions || 0),
        comments: Number(row?._count?.comments || 0),
        likedByMe: Array.isArray(row.reactions)
          ? row.reactions.some(
              (reaction: any) =>
                String(reaction.userId || '') === currentUserId &&
                String(reaction.type || '').toUpperCase() === 'LIKE',
            )
          : false,
      },
      comments: Array.isArray(row.comments) ? row.comments.map((item: any) => this.mapComment(item)) : [],
    };
  }

  async feed(userId: string, query: SocialFeedQueryDto) {
    return this.withStorageGuard(async () => {
      const limit = clamp(Number(query.limit || 20), 1, 40);

      const rows = await this.postRepo().findMany({
        where: {
          isArchived: false,
          visibility: 'PUBLIC',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              fullName: true,
              memberships: {
                orderBy: { createdAt: 'asc' },
                take: 1,
                select: {
                  primary: true,
                  subRoles: true,
                  club: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
          media: true,
          comments: {
            orderBy: { createdAt: 'asc' },
            take: 25,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  memberships: {
                    orderBy: { createdAt: 'asc' },
                    take: 1,
                    select: { primary: true, subRoles: true },
                  },
                },
              },
            },
          },
          reactions: {
            where: { userId, type: 'LIKE' },
            select: { id: true, userId: true, type: true },
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
      });

      return {
        count: rows.length,
        posts: rows.map((row: any) => this.mapPost(row, userId)),
      };
    });
  }

  async createPost(userId: string, dto: CreateSocialPostDto) {
    return this.withStorageGuard(async () => {
      const context = await this.getUserContext(userId);
      if (!context.canPublish) {
        throw new ForbiddenException('Only players can publish social posts');
      }

      const hasMedia = !!(dto.media?.url && dto.media?.publicId);
      const hasInstagram = !!(dto.instagramUrl?.trim());

      if (!hasMedia && !hasInstagram) {
        throw new BadRequestException('Either a media upload or an Instagram post URL is required');
      }
      if (hasInstagram && !isValidInstagramUrl(dto.instagramUrl!.trim())) {
        throw new BadRequestException('Instagram URL must be a valid instagram.com/p/, /reel/, or /tv/ link');
      }

      if (hasMedia) {
        const m = dto.media!;
        if (m.kind === 'image' && typeof m.bytes === 'number' && m.bytes > MAX_IMAGE_BYTES) {
          throw new BadRequestException('Image media is too large after compression (max 8 MB)');
        }
        if (m.kind === 'video' && typeof m.bytes === 'number' && m.bytes > MAX_VIDEO_BYTES) {
          throw new BadRequestException('Video media is too large after compression (max 80 MB)');
        }
        if (m.kind === 'image' && (typeof m.width !== 'number' || typeof m.height !== 'number')) {
          throw new BadRequestException('Image metadata is incomplete (width/height required)');
        }
        if (
          m.kind === 'image' &&
          typeof m.width === 'number' &&
          typeof m.height === 'number' &&
          (m.width > MAX_IMAGE_WIDTH || m.height > MAX_IMAGE_HEIGHT)
        ) {
          throw new BadRequestException('Image resolution exceeds 1920x1920');
        }
        if (m.kind === 'video' && (typeof m.width !== 'number' || typeof m.height !== 'number')) {
          throw new BadRequestException('Video metadata is incomplete (width/height required)');
        }
        if (
          m.kind === 'video' &&
          typeof m.width === 'number' &&
          typeof m.height === 'number' &&
          (m.width > MAX_VIDEO_WIDTH || m.height > MAX_VIDEO_HEIGHT)
        ) {
          throw new BadRequestException('Video resolution exceeds 1280x720');
        }
        if (m.kind === 'video' && (typeof m.durationSec !== 'number' || !Number.isFinite(m.durationSec))) {
          throw new BadRequestException('Video metadata is incomplete (duration required)');
        }
        if (m.kind === 'video' && typeof m.durationSec === 'number' && m.durationSec > MAX_VIDEO_DURATION_SEC) {
          throw new BadRequestException('Video duration exceeds 90 seconds');
        }
      }

      const tags = uniq((dto.tags || []).map((tag) => sanitizeTag(tag)).filter(Boolean)).slice(0, 12);
      const instagramUrl = hasInstagram ? dto.instagramUrl!.trim() : null;

      const created = await this.postRepo().create({
        data: {
          authorUserId: userId,
          authorClubId: context.activeMembership?.clubId || null,
          skill: dto.skill.trim(),
          caption: dto.caption.trim(),
          tags,
          instagramUrl,
          visibility: 'PUBLIC',
          ...(hasMedia && dto.media
            ? {
                media: {
                  create: {
                    type: dto.media.kind === 'video' ? 'VIDEO' : 'IMAGE',
                    url: dto.media.url.trim(),
                    publicId: dto.media.publicId.trim(),
                    format: dto.media.format?.trim() || null,
                    width: typeof dto.media.width === 'number' ? dto.media.width : null,
                    height: typeof dto.media.height === 'number' ? dto.media.height : null,
                    durationSec: typeof dto.media.durationSec === 'number' ? dto.media.durationSec : null,
                    bytes: typeof dto.media.bytes === 'number' ? dto.media.bytes : null,
                  },
                },
              }
            : {}),
        },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              fullName: true,
              memberships: {
                orderBy: { createdAt: 'asc' },
                take: 1,
                select: {
                  primary: true,
                  subRoles: true,
                  club: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
          media: true,
          comments: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  memberships: {
                    orderBy: { createdAt: 'asc' },
                    take: 1,
                    select: { primary: true, subRoles: true },
                  },
                },
              },
            },
          },
          reactions: {
            where: { userId, type: 'LIKE' },
            select: { id: true, userId: true, type: true },
          },
          _count: {
            select: { comments: true, reactions: true },
          },
        },
      });

      return { post: this.mapPost(created, userId) };
    });
  }

  async toggleLike(userId: string, postId: string) {
    return this.withStorageGuard(async () => {
      const post = await this.postRepo().findFirst({
        where: { id: postId, isArchived: false },
        select: { id: true },
      });
      if (!post) throw new NotFoundException('Post not found');

      const existing = await this.reactionRepo().findFirst({
        where: { postId, userId, type: 'LIKE' },
        select: { id: true },
      });

      if (existing) {
        await this.reactionRepo().delete({ where: { id: existing.id } });
      } else {
        await this.reactionRepo().create({
          data: { postId, userId, type: 'LIKE' },
        });
      }

      const reactions = await this.reactionRepo().count({
        where: { postId, type: 'LIKE' },
      });

      return {
        postId,
        liked: !existing,
        reactions,
      };
    });
  }

  async createComment(userId: string, postId: string, dto: CreateSocialCommentDto) {
    return this.withStorageGuard(async () => {
      const post = await this.postRepo().findFirst({
        where: { id: postId, isArchived: false },
        select: { id: true },
      });
      if (!post) throw new NotFoundException('Post not found');

      const comment = await this.commentRepo().create({
        data: {
          postId,
          userId,
          text: dto.text.trim(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              memberships: {
                orderBy: { createdAt: 'asc' },
                take: 1,
                select: { primary: true, subRoles: true },
              },
            },
          },
        },
      });

      const comments = await this.commentRepo().count({
        where: { postId },
      });

      return {
        comment: this.mapComment(comment),
        comments,
      };
    });
  }

  async deleteComment(userId: string, commentId: string) {
    return this.withStorageGuard(async () => {
      const comment = await this.commentRepo().findUnique({
        where: { id: commentId },
        select: {
          id: true,
          postId: true,
          userId: true,
          post: {
            select: {
              authorUserId: true,
            },
          },
        },
      });
      if (!comment) throw new NotFoundException('Comment not found');

      const isOwner = comment.userId === userId;
      const isPostAuthor = comment.post?.authorUserId === userId;
      if (!isOwner && !isPostAuthor) {
        throw new ForbiddenException('Only comment owner or post owner can delete comment');
      }

      await this.commentRepo().delete({ where: { id: comment.id } });
      return { ok: true };
    });
  }

  private signCloudinaryParams(params: Record<string, string | number>, apiSecret: string) {
    const payload = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return createHash('sha1')
      .update(`${payload}${apiSecret}`)
      .digest('hex');
  }

  createMediaSignature(dto: CreateMediaSignatureDto = {}) {
    const cloudName = String(this.config.get<string>('CLOUDINARY_CLOUD_NAME') || '').trim();
    const apiKey = String(this.config.get<string>('CLOUDINARY_API_KEY') || '').trim();
    const apiSecret = String(this.config.get<string>('CLOUDINARY_API_SECRET') || '').trim();

    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in API env.',
      );
    }

    const configuredFolder = String(
      this.config.get<string>('CLOUDINARY_UPLOAD_FOLDER') || 'esportm/social',
    );
    const folder = String(dto.folder || configuredFolder)
      .trim()
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/\.\./g, '')
      .replace(/^\//, '')
      .slice(0, 120);
    const timestamp = Math.floor(Date.now() / 1000);
    const transformation = String(dto.transformation || '')
      .trim()
      .replace(/[^\w:.,/\\-]/g, '')
      .slice(0, 220);

    const paramsToSign: Record<string, string | number> = { folder, timestamp };
    if (transformation) {
      paramsToSign.transformation = transformation;
    }

    const signature = this.signCloudinaryParams(paramsToSign, apiSecret);

    return {
      cloudName,
      apiKey,
      folder,
      timestamp,
      signature,
      resourceType: dto.resourceType || 'auto',
      transformation: transformation || undefined,
    };
  }
}
