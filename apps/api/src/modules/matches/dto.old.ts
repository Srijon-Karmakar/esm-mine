import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MatchEventType, MatchStatus } from '@prisma/client';

export class AddMatchEventDto {
  @IsEnum(MatchEventType)
  type!: MatchEventType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  minute?: number;

  // ✅ match Prisma: team is String? but we restrict values
  @IsOptional()
  @IsIn(['HOME', 'AWAY'])
  team?: 'HOME' | 'AWAY';

  // ✅ match Prisma field name
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  playerId?: string;

  // ✅ match Prisma field name
  @IsOptional()
  @IsString()
  assistId?: string;
}
