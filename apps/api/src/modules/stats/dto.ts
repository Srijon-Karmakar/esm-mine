import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class LeaderboardQueryDto {
  @IsOptional()
  @IsIn(['goals', 'assists', 'minutes', 'yellow', 'red'])
  metric?: 'goals' | 'assists' | 'minutes' | 'yellow' | 'red';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class DateRangeQueryDto {
  @IsOptional()
  @IsString()
  from?: string; // ISO

  @IsOptional()
  @IsString()
  to?: string; // ISO
}
