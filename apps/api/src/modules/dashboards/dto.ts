import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const DASHBOARD_ANALYTICS_CATEGORIES = ['MATCH', 'PLAYER', 'CLUB'] as const;
export type DashboardAnalyticsCategoryValue = (typeof DASHBOARD_ANALYTICS_CATEGORIES)[number];

export class DashboardAnalyticsMetricsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  matchLoad?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  trainingLoad?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  winRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  possession?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  playerFitness?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  playerMorale?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  recoveryScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  clubCohesion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fanEngagement?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  disciplineScore?: number;
}

export class CreateDashboardAnalyticsEntryDto {
  @IsIn(DASHBOARD_ANALYTICS_CATEGORIES)
  category!: DashboardAnalyticsCategoryValue;

  @IsString()
  @MinLength(2)
  subjectLabel!: string;

  @IsDateString()
  recordedAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DashboardAnalyticsMetricsDto)
  metrics!: DashboardAnalyticsMetricsDto;
}
