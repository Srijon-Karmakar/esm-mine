import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MatchEventType } from '@prisma/client';

export class AddMatchEventDto {
  @IsEnum(MatchEventType)
  type!: MatchEventType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  minute?: number;

  @IsOptional()
  @IsIn(['HOME', 'AWAY'])
  team?: 'HOME' | 'AWAY';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  playerId?: string;

  @IsOptional()
  @IsString()
  assistId?: string;
}
