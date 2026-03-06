import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class QueryLeaderboardDto {
  /**
   * Which metric should we rank by?
   */
  @IsOptional()
  @IsIn(['GOALS', 'ASSISTS', 'MINUTES', 'YELLOW', 'RED', 'GA'])
  metric?: 'GOALS' | 'ASSISTS' | 'MINUTES' | 'YELLOW' | 'RED' | 'GA';

  /**
   * Max rows to return
   */
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
