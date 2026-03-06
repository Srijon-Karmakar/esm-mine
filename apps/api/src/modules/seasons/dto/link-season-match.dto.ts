import { IsString, MinLength } from 'class-validator';

export class LinkSeasonMatchDto {
  @IsString()
  @MinLength(5)
  matchId!: string;

  @IsString()
  @MinLength(5)
  homeTeamId!: string;

  @IsString()
  @MinLength(5)
  awayTeamId!: string;
}
