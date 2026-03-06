import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MatchStatus } from '@prisma/client';

export class UpdateMatchStatusDto {
  @IsEnum(MatchStatus)
  status!: MatchStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  homeScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  awayScore?: number;
}
